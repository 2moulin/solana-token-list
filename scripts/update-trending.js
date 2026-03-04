#!/usr/bin/env node
// Fetch trending Solana tokens using verified mint addresses + DexScreener
// Runs via GitHub Actions every 5 minutes
// Output: trending.json (served via GitHub Pages)

const fs = require('fs');
const https = require('https');

const OUTPUT_FILE = 'trending.json';

// Verified Solana token mint addresses
const KNOWN_TOKENS = [
  { address: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Solana' },
  { address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', name: 'Jupiter' },
  { address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', name: 'Bonk' },
  { address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', symbol: 'WIF', name: 'dogwifhat' },
  { address: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', symbol: 'PYTH', name: 'Pyth Network' },
  { address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', symbol: 'RAY', name: 'Raydium' },
  { address: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof', symbol: 'RENDER', name: 'Render' },
  { address: '2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv', symbol: 'PENGU', name: 'Pudgy Penguins' },
  { address: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', symbol: 'POPCAT', name: 'Popcat' },
  { address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', symbol: 'ORCA', name: 'Orca' },
  { address: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL', symbol: 'JTO', name: 'Jito' },
  { address: 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux', symbol: 'HNT', name: 'Helium' },
  { address: 'TNSRxcUxoT9xBG3de7PiJyTDYu7kskLqcpddxnEJAS6', symbol: 'TNSR', name: 'Tensor' },
  { address: 'DriFtupJYLTosbwoN8koMbEYSx54aFAVLddWsbksjwg7', symbol: 'DRIFT', name: 'Drift' },
  { address: 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5', symbol: 'MEW', name: 'cat in a dogs world' },
  { address: '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump', symbol: 'FARTCOIN', name: 'Fartcoin' },
  { address: 'Grass7B4RdKfBCjTKgSqnXkqjwiGvQyFbuSCUJr3XXjs', symbol: 'GRASS', name: 'Grass' },
  { address: 'KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS', symbol: 'KMNO', name: 'Kamino' },
  { address: '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN', symbol: 'TRUMP', name: 'Official Trump' },
  { address: 'SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y', symbol: 'SHDW', name: 'Shadow Token' },
  { address: 'nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7', symbol: 'NOS', name: 'Nosana' },
  { address: '85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ', symbol: 'W', name: 'Wormhole' },
  { address: 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC', symbol: 'AI16Z', name: 'ai16z' },
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'SolanaTokenList/1.0' } }, (res) => {
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const results = [];

  // Fetch each token individually from DexScreener (accurate data per token)
  console.log(`Fetching ${KNOWN_TOKENS.length} tokens from DexScreener...`);

  for (const token of KNOWN_TOKENS) {
    try {
      const raw = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token.address}`);
      const data = JSON.parse(raw);

      // Filter for Solana pairs where this token is the base token
      const pairs = (data.pairs || []).filter(p =>
        p.chainId === 'solana' && p.baseToken.address === token.address
      );

      if (pairs.length === 0) {
        console.log(`  ${token.symbol}: no pairs found, skipping`);
        continue;
      }

      // Sort by liquidity to get the most reliable pair for price
      pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
      const best = pairs[0];

      // Aggregate volume across ALL pairs for this token
      const totalVolume = pairs.reduce((sum, p) => sum + (p.volume?.h24 || 0), 0);

      results.push({
        symbol: token.symbol,
        name: token.name,
        price: parseFloat(best.priceUsd) || 0,
        change24h: best.priceChange?.h24 || 0,
        volume24h: totalVolume,
        marketCap: best.marketCap || best.fdv || 0,
        image: best.info?.imageUrl || '',
        address: token.address,
        pairAddress: best.pairAddress,
      });

      console.log(`  ${token.symbol}: $${best.priceUsd} | vol: $${totalVolume.toFixed(0)} | ${pairs.length} pairs`);

      // Small delay between calls to be polite (25 calls well within 300/min)
      await sleep(200);
    } catch (e) {
      console.error(`  ${token.symbol}: ${e.message}`);
    }
  }

  console.log(`\nGot ${results.length}/${KNOWN_TOKENS.length} tokens from DexScreener`);

  // Bonus: try CoinGecko to enrich data (better images, market cap)
  try {
    console.log('Fetching CoinGecko enrichment...');
    const raw = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=solana-ecosystem&order=volume_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h');
    const coins = JSON.parse(raw);

    const cgMap = {};
    for (const coin of coins) {
      cgMap[coin.symbol.toUpperCase()] = coin;
    }

    for (const token of results) {
      const cg = cgMap[token.symbol];
      if (!cg) continue;
      // CoinGecko has better aggregate volume and market cap
      if (cg.total_volume > token.volume24h) token.volume24h = cg.total_volume;
      if (cg.market_cap > token.marketCap) token.marketCap = cg.market_cap;
      if (!token.image && cg.image) token.image = cg.image;
      if (cg.price_change_percentage_24h != null) token.change24h = cg.price_change_percentage_24h;
    }
    console.log('  CoinGecko enrichment applied');
  } catch (e) {
    console.error('  CoinGecko enrichment failed (non-critical):', e.message);
  }

  // Filter out tokens with no price
  const valid = results.filter(t => t.price > 0);

  // Sort by volume (most traded first)
  valid.sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));

  // Keep top 20
  const top = valid.slice(0, 20);

  const output = {
    updatedAt: new Date().toISOString(),
    tokens: top,
  };

  // Clean up floating point artifacts
  top.forEach(t => { t.volume24h = Math.round(t.volume24h); });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nWrote ${top.length} trending tokens to ${OUTPUT_FILE}`);
}

main().catch(console.error);
