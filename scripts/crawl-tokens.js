// MEGA Token List Crawler - ALL SOURCES
// 1. Solana Labs (13k verified)
// 2. Jupiter Verified
// 3. DexScreener Top Tokens
// 100% Free - Scales to 1000s of users

const https = require('https');
const http = require('http');
const fs = require('fs');

// All free sources
const SOURCES = {
  solanaLabs: 'https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json',
  jupiterVerified: 'https://token.jup.ag/verified',
  jupiterStrict: 'https://token.jup.ag/strict',
  jupiterAll: 'https://token.jup.ag/all'
};

// Popular tokens priority
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
 * Fetch JSON from URL (using Node's built-in https)
 */
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Failed to parse JSON from ${url}: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Fetch DexScreener top tokens (trending)
 */
async function fetchDexScreenerTop() {
  console.log('📥 Fetching DexScreener trending tokens...');

  try {
    // DexScreener trending endpoint (free, no auth)
    const data = await fetchJson('https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112');

    if (!data || !data.pairs) {
      console.log('⚠️  No DexScreener data');
      return [];
    }

    // Extract unique tokens from pairs
    const tokens = [];
    const seen = new Set();

    data.pairs.slice(0, 100).forEach(pair => {
      if (pair.chainId === 'solana' && pair.baseToken) {
        const addr = pair.baseToken.address;
        if (!seen.has(addr)) {
          seen.add(addr);
          tokens.push({
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

    console.log(`✅ Loaded ${tokens.length} tokens from DexScreener`);
    return tokens;

  } catch (error) {
    console.error('❌ DexScreener error:', error.message);
    return [];
  }
}

/**
 * Step 1: Fetch Solana Labs list
 */
async function fetchSolanaLabs() {
  console.log('📥 [1/4] Fetching Solana Labs token list...');

  try {
    const data = await fetchJson(SOURCES.solanaLabs);
    const tokens = data.tokens || [];
    console.log(`✅ Loaded ${tokens.length} tokens from Solana Labs`);
    return tokens;
  } catch (error) {
    console.error('❌ Solana Labs error:', error.message);
    return [];
  }
}

/**
 * Step 2: Fetch Jupiter verified list
 */
async function fetchJupiterVerified() {
  console.log('📥 [2/4] Fetching Jupiter verified tokens...');

  try {
    const tokens = await fetchJson(SOURCES.jupiterVerified);
    const validTokens = Array.isArray(tokens) ? tokens : [];
    console.log(`✅ Loaded ${validTokens.length} tokens from Jupiter Verified`);
    return validTokens;
  } catch (error) {
    console.error('❌ Jupiter Verified error:', error.message);
    return [];
  }
}

/**
 * Step 3: Fetch Jupiter All tokens
 */
async function fetchJupiterAll() {
  console.log('📥 [3/4] Fetching Jupiter all tokens...');

  try {
    const tokens = await fetchJson(SOURCES.jupiterAll);
    const validTokens = Array.isArray(tokens) ? tokens : [];
    console.log(`✅ Loaded ${validTokens.length} tokens from Jupiter All`);
    return validTokens;
  } catch (error) {
    console.error('❌ Jupiter All error:', error.message);
    return [];
  }
}

/**
 * Normalize token format
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
 * Filter wrapped SOL - keep only official
 */
function filterWrappedSOL(tokens) {
  const OFFICIAL_SOL = 'So11111111111111111111111111111111111111112';

  return tokens.filter(token => {
    if ((token.symbol === 'SOL' || token.symbol === 'WSOL' || token.symbol.includes('SOL')) &&
        token.address !== OFFICIAL_SOL) {
      return false;
    }
    return true;
  });
}

/**
 * Deduplicate by address (popular first)
 */
function deduplicateTokens(tokens) {
  const seen = new Map();
  const result = [];

  // First pass: popular tokens
  tokens.forEach(token => {
    if (POPULAR_TOKENS.includes(token.address)) {
      if (!seen.has(token.address)) {
        seen.set(token.address, true);
        result.push(token);
      }
    }
  });

  // Second pass: remaining tokens
  tokens.forEach(token => {
    if (!seen.has(token.address)) {
      seen.set(token.address, true);
      result.push(token);
    }
  });

  return result;
}

/**
 * MAIN: Build MEGA token list
 */
async function buildMegaTokenList() {
  console.log('🚀 MEGA TOKEN LIST BUILDER');
  console.log('═══════════════════════════════════════');
  console.log('');

  const allTokens = [];
  const stats = {
    solanaLabs: 0,
    jupiterVerified: 0,
    jupiterAll: 0,
    dexScreener: 0
  };

  // Step 1: Solana Labs
  const solanaTokens = await fetchSolanaLabs();
  stats.solanaLabs = solanaTokens.length;
  solanaTokens.forEach(t => allTokens.push(normalizeToken(t)));

  // Step 2: Jupiter Verified
  const jupiterVerified = await fetchJupiterVerified();
  stats.jupiterVerified = jupiterVerified.length;
  jupiterVerified.forEach(t => allTokens.push(normalizeToken(t)));

  // Step 3: Jupiter All
  const jupiterAll = await fetchJupiterAll();
  stats.jupiterAll = jupiterAll.length;
  jupiterAll.forEach(t => allTokens.push(normalizeToken(t)));

  // Step 4: DexScreener Top
  console.log('📥 [4/4] Fetching DexScreener top tokens...');
  const dexTokens = await fetchDexScreenerTop();
  stats.dexScreener = dexTokens.length;
  dexTokens.forEach(t => allTokens.push(normalizeToken(t)));

  console.log('');
  console.log('📊 FETCHING COMPLETE');
  console.log('═══════════════════════════════════════');
  console.log(`   Solana Labs:      ${stats.solanaLabs.toLocaleString()} tokens`);
  console.log(`   Jupiter Verified: ${stats.jupiterVerified.toLocaleString()} tokens`);
  console.log(`   Jupiter All:      ${stats.jupiterAll.toLocaleString()} tokens`);
  console.log(`   DexScreener Top:  ${stats.dexScreener.toLocaleString()} tokens`);
  console.log(`   ─────────────────────────────────────`);
  console.log(`   Total Fetched:    ${allTokens.length.toLocaleString()} tokens`);
  console.log('');

  // Step 5: Filter wrapped SOL
  console.log('🔍 Filtering wrapped SOL duplicates...');
  const filtered = filterWrappedSOL(allTokens);
  console.log(`   Removed: ${allTokens.length - filtered.length} wrapped SOL tokens`);

  // Step 6: Deduplicate by address
  console.log('');
  console.log('✨ Deduplicating by address...');
  const unique = deduplicateTokens(filtered);
  console.log(`   Removed: ${filtered.length - unique.length} duplicate addresses`);
  console.log(`   Final:   ${unique.length.toLocaleString()} unique tokens`);

  // Build final list
  const tokenList = {
    name: 'Tenet Wallet - MEGA Token List',
    description: 'Combined: Solana Labs + Jupiter (verified + all) + DexScreener trending',
    timestamp: new Date().toISOString(),
    version: {
      major: 1,
      minor: 0,
      patch: Date.now()
    },
    sources: Object.keys(SOURCES),
    stats: stats,
    tokens: unique,
    count: unique.length
  };

  // Save to file
  console.log('');
  console.log('💾 Writing to tokens.json...');
  fs.writeFileSync('tokens.json', JSON.stringify(tokenList, null, 2));

  console.log('');
  console.log('✅ SUCCESS!');
  console.log('═══════════════════════════════════════');
  console.log(`📁 File: tokens.json`);
  console.log(`📊 Tokens: ${tokenList.count.toLocaleString()} unique`);
  console.log(`📦 Size: ${(Buffer.byteLength(JSON.stringify(tokenList)) / 1024 / 1024).toFixed(2)} MB`);
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
    console.error('❌ FATAL ERROR:', error);
    process.exit(1);
  });
