// MEGA Token List Crawler v2
// Fetches: Solana Labs + DexScreener Top + Trending
// Updates daily via GitHub Actions

const https = require('https');
const http = require('http');
const fs = require('fs');

// Fetch helper
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (error) { reject(new Error(`Parse error: ${error.message}`)); }
      });
    }).on('error', reject);
  });
}

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Popular tokens (always priority)
const POPULAR_TOKENS = [
  'So11111111111111111111111111111111111111112', // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // JUP
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', // PYTH
  'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL', // JTO
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', // mSOL
  '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj', // stSOL
];

/**
 * Fetch DexScreener trending tokens (top 500 by volume)
 */
async function fetchDexScreenerTrending() {
  console.log('📥 Fetching DexScreener trending tokens...');

  try {
    // Get trending pairs on Solana
    const data = await fetchJson('https://api.dexscreener.com/latest/dex/search?q=solana');

    if (!data || !data.pairs) {
      console.log('⚠️  No DexScreener data');
      return [];
    }

    const tokens = [];
    const seen = new Set();

    // Extract tokens from pairs (top 100)
    data.pairs.slice(0, 100).forEach(pair => {
      if (pair.chainId === 'solana' && pair.baseToken) {
        const addr = pair.baseToken.address;
        if (!seen.has(addr) && addr !== 'So11111111111111111111111111111111111111112') {
          seen.add(addr);
          tokens.push({
            address: addr,
            symbol: pair.baseToken.symbol || 'UNKNOWN',
            name: pair.baseToken.name || 'Unknown',
            decimals: 9,
            chainId: 101,
            logoURI: pair.info?.imageUrl,
            volume24h: parseFloat(pair.volume?.h24 || 0),
            priceChange24h: parseFloat(pair.priceChange?.h24 || 0)
          });
        }
      }
    });

    console.log(`✅ Found ${tokens.length} trending tokens from DexScreener`);
    return tokens;

  } catch (error) {
    console.error('❌ DexScreener error:', error.message);
    return [];
  }
}

/**
 * Fetch multiple trending searches
 */
async function fetchDexScreenerMulti() {
  console.log('📥 Fetching top tokens from multiple DexScreener queries...');

  const queries = [
    'bonk', 'wif', 'jup', 'pyth', 'jto', 'wen', 'myro', 'popcat',
    'mew', 'tremp', 'bome', 'sloth', 'billy', 'ponke', 'gme'
  ];

  const allTokens = [];
  const seen = new Set();

  for (const query of queries) {
    try {
      console.log(`  Searching: ${query}...`);
      const data = await fetchJson(`https://api.dexscreener.com/latest/dex/search?q=${query}`);

      if (data && data.pairs) {
        data.pairs.slice(0, 5).forEach(pair => {
          if (pair.chainId === 'solana' && pair.baseToken) {
            const addr = pair.baseToken.address;
            if (!seen.has(addr)) {
              seen.add(addr);
              allTokens.push({
                address: addr,
                symbol: pair.baseToken.symbol || 'UNKNOWN',
                name: pair.baseToken.name || 'Unknown',
                decimals: 9,
                chainId: 101,
                logoURI: pair.info?.imageUrl
              });
            }
          }
        });
      }

      await sleep(1100); // Rate limit: 1 req/sec
    } catch (error) {
      console.error(`  ❌ Error searching ${query}:`, error.message);
    }
  }

  console.log(`✅ Found ${allTokens.length} tokens from multi-search`);
  return allTokens;
}

/**
 * Fetch Solana Labs base list
 */
async function fetchSolanaLabs() {
  console.log('📥 Fetching Solana Labs token list...');

  try {
    const data = await fetchJson('https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json');
    const tokens = data.tokens || [];
    console.log(`✅ Loaded ${tokens.length} tokens from Solana Labs`);
    return tokens;
  } catch (error) {
    console.error('❌ Solana Labs error:', error.message);
    return [];
  }
}

/**
 * Normalize token
 */
function normalizeToken(token) {
  return {
    address: token.address || token.mint,
    symbol: token.symbol || 'UNKNOWN',
    name: token.name || 'Unknown Token',
    decimals: token.decimals || 9,
    chainId: token.chainId || 101,
    logoURI: token.logoURI || token.image || token.logoUri
  };
}

/**
 * Filter wrapped SOL
 */
function filterWrappedSOL(tokens) {
  const OFFICIAL_SOL = 'So11111111111111111111111111111111111111112';
  return tokens.filter(token => {
    if ((token.symbol === 'SOL' || token.symbol === 'WSOL' || token.symbol?.includes('SOL')) &&
        token.address !== OFFICIAL_SOL) {
      return false;
    }
    return true;
  });
}

/**
 * Deduplicate by address
 */
function deduplicateTokens(tokens) {
  const addressMap = new Map();

  // First: popular tokens
  tokens.forEach(token => {
    if (POPULAR_TOKENS.includes(token.address)) {
      addressMap.set(token.address, token);
    }
  });

  // Second: remaining tokens
  tokens.forEach(token => {
    if (!addressMap.has(token.address)) {
      addressMap.set(token.address, token);
    }
  });

  return Array.from(addressMap.values());
}

/**
 * MAIN
 */
async function buildMegaTokenList() {
  console.log('');
  console.log('🚀 MEGA TOKEN LIST BUILDER v2');
  console.log('═══════════════════════════════════════════════');
  console.log('');

  const allTokens = [];
  const stats = {};

  // Step 1: Solana Labs base
  const solanaTokens = await fetchSolanaLabs();
  stats.solanaLabs = solanaTokens.length;
  solanaTokens.forEach(t => allTokens.push(normalizeToken(t)));

  console.log('');

  // Step 2: DexScreener trending
  const trendingTokens = await fetchDexScreenerTrending();
  stats.dexScreenerTrending = trendingTokens.length;
  trendingTokens.forEach(t => allTokens.push(normalizeToken(t)));

  console.log('');

  // Step 3: DexScreener multi-search
  const multiTokens = await fetchDexScreenerMulti();
  stats.dexScreenerMulti = multiTokens.length;
  multiTokens.forEach(t => allTokens.push(normalizeToken(t)));

  console.log('');
  console.log('📊 PROCESSING');
  console.log('═══════════════════════════════════════════════');
  console.log(`   Fetched:  ${allTokens.length.toLocaleString()} total tokens`);

  // Filter wrapped SOL
  const filtered = filterWrappedSOL(allTokens);
  console.log(`   Filtered: ${filtered.length.toLocaleString()} (removed ${allTokens.length - filtered.length} wrapped SOL)`);

  // Deduplicate
  const unique = deduplicateTokens(filtered);
  console.log(`   Unique:   ${unique.length.toLocaleString()} (removed ${filtered.length - unique.length} duplicates)`);

  // Build final list
  const tokenList = {
    name: 'Tenet Wallet - MEGA Token List',
    description: 'Solana Labs + DexScreener trending + popular tokens',
    timestamp: new Date().toISOString(),
    version: {
      major: 2,
      minor: 0,
      patch: Date.now()
    },
    stats: stats,
    tokens: unique,
    count: unique.length
  };

  // Save
  fs.writeFileSync('tokens.json', JSON.stringify(tokenList, null, 2));

  console.log('');
  console.log('✅ SUCCESS!');
  console.log('═══════════════════════════════════════════════');
  console.log(`📁 File:   tokens.json`);
  console.log(`📊 Tokens: ${tokenList.count.toLocaleString()}`);
  console.log(`📦 Size:   ${(Buffer.byteLength(JSON.stringify(tokenList)) / 1024 / 1024).toFixed(2)} MB`);
  console.log('');
  console.log('📈 Sources:');
  console.log(`   Solana Labs:        ${stats.solanaLabs.toLocaleString()}`);
  console.log(`   DexScreener Trend:  ${stats.dexScreenerTrending.toLocaleString()}`);
  console.log(`   DexScreener Multi:  ${stats.dexScreenerMulti.toLocaleString()}`);
  console.log('');

  return tokenList;
}

// Run
buildMegaTokenList()
  .then(() => {
    console.log('🎉 DONE! Ready to deploy.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ FATAL:', error);
    process.exit(1);
  });
