#!/usr/bin/env node
// Fetch trending Solana tokens from CoinGecko + DexScreener
// Runs via GitHub Actions every 5 minutes
// Output: trending.json (served via GitHub Pages)

const fs = require('fs');
const https = require('https');

const OUTPUT_FILE = 'trending.json';

// Exclude stablecoins, wrapped tokens, bridges
const EXCLUDE_SYMBOLS = new Set([
  'USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'USDP', 'GUSD', 'PAX', 'USDD', 'USDS', 'USD1',
  'PYUSD', 'USDG', 'USDE', 'SUSDE', 'USYC', 'BUIDL', 'AUSD', 'USAD', 'EURC', 'FDUSD',
  'WETH', 'WBTC', 'WBNB', 'WMATIC', 'WSOL', 'WLINK', 'CBBTC', 'TBTC',
  'UNI', 'AAVE', 'SUSHI', 'AVAX', 'FTM', 'MATIC', 'LINK', 'WLFI',
]);

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        res.resume();
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function isValid(symbol, name) {
  const sym = symbol.toUpperCase();
  if (EXCLUDE_SYMBOLS.has(sym)) return false;
  const n = name.toUpperCase();
  if (n.includes('WRAPPED') || n.includes('WORMHOLE') || n.includes('BRIDGED')) return false;
  return true;
}

async function main() {
  const results = [];
  const seen = new Set();

  // Source 1: CoinGecko Solana ecosystem by volume (top active tokens)
  try {
    console.log('Fetching CoinGecko Solana ecosystem...');
    const raw = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=solana-ecosystem&order=volume_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h');
    const coins = JSON.parse(raw);

    for (const coin of coins) {
      const sym = coin.symbol.toUpperCase();
      if (!isValid(sym, coin.name)) continue;
      if (coin.current_price <= 0) continue;
      if ((coin.market_cap || 0) <= 0) continue;
      if (seen.has(sym)) continue;
      seen.add(sym);

      results.push({
        symbol: sym,
        name: coin.name,
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h || 0,
        volume24h: coin.total_volume || 0,
        marketCap: coin.market_cap || 0,
        image: coin.image || '',
      });
    }
    console.log(`  Got ${results.length} tokens from CoinGecko`);
  } catch (e) {
    console.error('CoinGecko fetch failed:', e.message);
  }

  // Source 2: DexScreener — search popular Solana tokens to fill gaps
  const dexQueries = ['SOL', 'BONK', 'WIF', 'JUP', 'TRUMP', 'PENGU', 'POPCAT', 'RENDER', 'RAY', 'PYTH'];
  const queriesToRun = dexQueries.filter(q => !seen.has(q));
  if (queriesToRun.length > 0) {
    console.log(`Fetching ${queriesToRun.length} tokens from DexScreener...`);
    for (const query of queriesToRun) {
      try {
        const raw = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${query}`);
        const data = JSON.parse(raw);
        const candidates = (data.pairs || [])
          .filter(p =>
            p.chainId === 'solana' &&
            p.baseToken.symbol.toUpperCase() === query &&
            (p.liquidity?.usd || 0) >= 50000
          )
          .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
        const match = candidates[0];
        if (!match) continue;
        const sym = match.baseToken.symbol.toUpperCase();
        if (seen.has(sym)) continue;
        seen.add(sym);
        results.push({
          symbol: sym,
          name: match.baseToken.name,
          price: parseFloat(match.priceUsd) || 0,
          change24h: match.priceChange?.h24 || 0,
          volume24h: match.volume?.h24 || 0,
          marketCap: match.marketCap || 0,
          image: match.info?.imageUrl || '',
          address: match.baseToken.address,
          pairAddress: match.pairAddress,
        });
      } catch { /* skip */ }
    }
    console.log(`  Total tokens after DexScreener: ${results.length}`);
  }

  // Source 3: Resolve Solana addresses for CoinGecko tokens via DexScreener
  const needAddress = results.filter(t => !t.address && t.symbol !== 'SOL');
  if (needAddress.length > 0) {
    console.log(`Resolving ${needAddress.length} token addresses via DexScreener...`);
    // Batch: max 5 lookups to stay within rate limits
    for (const token of needAddress.slice(0, 5)) {
      try {
        const raw = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(token.symbol)}`);
        const data = JSON.parse(raw);
        const match = (data.pairs || []).find(p =>
          p.chainId === 'solana' &&
          p.baseToken.symbol.toUpperCase() === token.symbol &&
          (p.liquidity?.usd || 0) >= 10000
        );
        if (match) {
          token.address = match.baseToken.address;
          token.pairAddress = match.pairAddress;
        }
      } catch { /* skip */ }
    }
  }

  // SOL special case
  const sol = results.find(t => t.symbol === 'SOL');
  if (sol) sol.address = 'So11111111111111111111111111111111111111112';

  // Sort by volume (most traded first)
  results.sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));

  // Keep top 20
  const top = results.slice(0, 20);

  const output = {
    updatedAt: new Date().toISOString(),
    tokens: top,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nWrote ${top.length} trending tokens to ${OUTPUT_FILE}`);
}

main().catch(console.error);
