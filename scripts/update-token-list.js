// MEGA Token List Crawler v4 - ULTIMATE EDITION
// Multi-Source Discovery: DexScreener + CoinGecko + Jupiter + Raydium + Orca
// 12 runs/day (every 2 hours) - Smart rotation strategy
// Incremental discovery: Only fetch NEW tokens

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

// Top 50 popular tokens (always priority)
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
  'hntyVP6YFm1Hg25TN9WGLqM12b1TRezMtJJmsZ4MTYVU', // HNT
  'SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y', // SHDW
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // ETH (Wormhole)
  'A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM', // USDCet (Portal)
  'Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1', // SBR
  'RLBxxFkseAZ4RgJH3Sqn8jXxhmGoz9jWxDNJMh8pL7a', // RLB
  '5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm', // INF
  'kinXdEcpDQeHPEuQnqmUgtYykqKGVFq6CeVX5iAHJq6', // KIN
  'AGFEad2et2ZJif9jaGpdMixQqvW5i81aBdvKe7PHNfz3', // FIDA
  'FTT9VzRCKnutdQZpP8dhsZPbVLXSgBxVkBhKh9PmJnxb', // STEP
  'EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp', // FANT
  'GFX1ZjR2P15tmrSwow6FjyDYcEkoFb4p4gJCpLBjaxHD', // GOFX
  'BXXkv6z8ykpG1yuvUDPgh732wzVHB69RnB9YgSYh3itW', // C98
  '6naWDMGNWwqffJnnXFLBCLaYu1y5U9Rohe5wwJPHvf1p', // PORT
  'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac', // MNGO
  'CASHVDm2wsJXfhj6VWxb7GiMdoLc17Du7paH4bNr5woT', // CASH
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // RAY
  'Gsai2KN28MTGcSZ1gKYFswUpFpS7EM9mvdR9e6kuW5VX', // ATLAS
  'ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx', // POLIS
  'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt', // SRM
  'Comp4ssDzXcLeu2MnLuGNNFC4cmLPMng8qWHPvzAMU1h', // COMP
  '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E', // BTC (Wormhole)
  '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk', // WSETH
  'xxxxa1sKNGwFtw2kFn8XauW9xq8hBZ5kVtcSesTT9fW', // SLND
  'z3dn17yLaGMKffVogeFHQ9zWVcXgqgf3PQnDsNs2g6M', // ORCA
  'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5', // MEW
  '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', // POPCAT
  'Bn113WT6rbdgwrm12UJtnmNqGqZjY4it2WoUQuQopFVn', // TREMP
  'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82', // BOME
  'SLoth9dK7ryUmFJ4YYhKv4jXcq53j9PiK6SgYAL6gFs', // SLOTH
  'EdAhkbj5nF9sRM7XN7ewuW8C9XEUMs8P7cnoQ57SYE96', // MYRO
  'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk', // WEN
  'GDfnEsia2WLAW5t8yx2X5j2mkfA74i5kwGdDuZHt7XmG', // PONKE
  'CKaKtYvz6dKPyMvYq9Rh3UBrnNqYZAyd7iF4hJtjUvks', // GECKO
  'So11111111111111111111111111111111111111111', // WSOL
  'Taki7fi3Zicv7Du1xNAWLaf6mRK7ikdn77HeGzgwvo4', // TAKI
  '8cn7JcYVjDZesLa3RTt3NXne4mWms2YYFe2rbCxVLKv1', // MOUTAI
  '9vMJfxuKxXBoEa7rM12mYLMwTacLMLDJqHozw96WQL8i', // UST
  'GEJpt3Wjmr628FqXxTgxMce1pLntckPf1qmCy2oj1vyC', // GENOPETS
  'EPeUFDgHRxs9xxEPVaL6kfGQvCon7jmAWKVUHuux1Tpz', // BAT
  'CvB1ztJvpYQPvdPBePtRzjL4aQidjydtUz61NWgcgQtP' // COPE
];

/**
 * Load existing token list to avoid re-fetching
 */
function loadExistingTokens() {
  try {
    if (fs.existsSync('tokens.json')) {
      const data = JSON.parse(fs.readFileSync('tokens.json', 'utf8'));
      return data.tokens || [];
    }
  } catch (error) {
    console.log('⚠️  Starting fresh - no existing tokens.json');
  }
  return [];
}

/**
 * Get set of already known addresses for deduplication
 */
function getKnownAddresses(existingTokens) {
  return new Set(existingTokens.map(t => t.address));
}

/**
 * STATIC SOURCE: Solana Labs (fetch once, cache forever)
 */
async function fetchSolanaLabs(knownAddresses) {
  console.log('📥 Fetching Solana Labs token list...');

  try {
    const data = await fetchJson('https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json');
    const tokens = data.tokens || [];

    // Only keep new tokens
    const newTokens = tokens.filter(t => !knownAddresses.has(t.address));

    console.log(`✅ Solana Labs: ${tokens.length} total, ${newTokens.length} new`);
    return newTokens;
  } catch (error) {
    console.error('❌ Solana Labs error:', error.message);
    return [];
  }
}

/**
 * STATIC SOURCE: Jupiter Archived List (fetch once)
 */
async function fetchJupiterArchived(knownAddresses) {
  console.log('📥 Fetching Jupiter archived list...');

  try {
    const data = await fetchJson('https://token.jup.ag/all');
    const tokens = data || [];

    const newTokens = tokens.filter(t => !knownAddresses.has(t.address));

    console.log(`✅ Jupiter: ${tokens.length} total, ${newTokens.length} new`);
    return newTokens;
  } catch (error) {
    console.error('❌ Jupiter error:', error.message);
    return [];
  }
}

/**
 * DYNAMIC SOURCE: DexScreener Smart Queries
 * 100 requests optimized for new token discovery
 */
async function fetchDexScreenerSmart(knownAddresses) {
  console.log('');
  console.log('🔥 DexScreener Smart Discovery (100 requests)');
  console.log('═══════════════════════════════════════════════');

  const allTokens = [];
  const hour = new Date().getUTCHours();
  let queries = [];

  // Smart rotation based on time of day
  if (hour >= 0 && hour < 8) {
    // Night: Focus on latest pairs & new launches
    console.log('🌙 Night Mode: Latest pairs + new launches');
    queries = [
      'solana', 'new', 'launch', 'latest', 'bonk', 'wif', 'popcat',
      'meme', 'coin', 'token', 'defi', 'dex', 'pump', 'moon',
      'pepe', 'doge', 'shib', 'floki', 'wen', 'tremp', 'bome'
    ];
  } else if (hour >= 8 && hour < 16) {
    // Day: Focus on trending & high volume
    console.log('☀️ Day Mode: Trending + high volume');
    queries = [
      'jup', 'pyth', 'jto', 'orca', 'ray', 'mango', 'drift',
      'trending', 'volume', 'top', 'popular', 'hot', 'trade',
      'usdc', 'usdt', 'sol', 'btc', 'eth', 'stablecoin'
    ];
  } else {
    // Evening: Deep dive niche & gaming
    console.log('🌆 Evening Mode: Niche + gaming + NFT');
    queries = [
      'atlas', 'polis', 'genopets', 'stepn', 'nft', 'gaming',
      'metaverse', 'render', 'helium', 'nosana', 'shdw',
      'dao', 'governance', 'staking', 'yield', 'farm'
    ];
  }

  // Add diverse searches to reach 100 total
  const additionalQueries = [
    'samo', 'cope', 'foxy', 'grape', 'dust', 'media', 'kin',
    'msol', 'stsol', 'jsol', 'liquid', 'stake', 'validator',
    'bridge', 'wormhole', 'portal', 'allbridge', 'cross',
    'lend', 'borrow', 'loan', 'protocol', 'vault', 'pool',
    'swap', 'amm', 'orderbook', 'perp', 'derivative', 'option',
    'real', 'world', 'asset', 'rwa', 'commodity', 'gold',
    'ai', 'artificial', 'intelligence', 'data', 'oracle',
    'music', 'art', 'creator', 'social', 'community',
    'privacy', 'zero', 'knowledge', 'zk', 'rollup',
    'mobile', 'phone', 'iot', 'device', 'hardware',
    'energy', 'green', 'carbon', 'climate', 'esg',
    'insurance', 'predict', 'betting', 'lottery', 'game',
    'sport', 'fantasy', 'esport', 'streaming', 'video',
    'launchpad', 'ido', 'ico', 'presale', 'fundraise',
    'aggregator', 'analytics', 'explorer', 'wallet', 'tool'
  ];

  queries = [...queries, ...additionalQueries].slice(0, 100);

  const startTime = Date.now();
  let requestCount = 0;
  let newFound = 0;

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];

    try {
      const progress = Math.round((i / queries.length) * 100);
      process.stdout.write(`\r[${progress}%] ${i + 1}/${queries.length}: ${query.padEnd(20)} (${newFound} new)`);

      const data = await fetchJson(`https://api.dexscreener.com/latest/dex/search?q=${query}`);
      requestCount++;

      if (data && data.pairs) {
        data.pairs.slice(0, 15).forEach(pair => {
          if (pair.chainId === 'solana' && pair.baseToken) {
            const addr = pair.baseToken.address;
            if (!knownAddresses.has(addr)) {
              knownAddresses.add(addr);
              newFound++;
              allTokens.push({
                address: addr,
                symbol: pair.baseToken.symbol || 'UNKNOWN',
                name: pair.baseToken.name || 'Unknown',
                decimals: 9,
                chainId: 101,
                logoURI: pair.info?.imageUrl,
                volume24h: parseFloat(pair.volume?.h24 || 0),
                liquidity: parseFloat(pair.liquidity?.usd || 0)
              });
            }
          }
        });
      }

      // Rate limit: 1.2 seconds per request (safe for 300/15min)
      await sleep(1200);

    } catch (error) {
      console.error(`\n  ❌ Error on "${query}":`, error.message);
    }
  }

  const elapsedTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log('');
  console.log(`✅ DexScreener: ${requestCount} requests in ${elapsedTime} min, ${newFound} new tokens`);
  console.log('');

  return allTokens;
}

/**
 * DYNAMIC SOURCE: CoinGecko Top Solana Tokens
 */
async function fetchCoinGecko(knownAddresses) {
  console.log('📥 Fetching CoinGecko Solana tokens...');

  try {
    // CoinGecko free API: coins/markets endpoint
    const data = await fetchJson('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=solana-ecosystem&order=market_cap_desc&per_page=250&page=1&sparkline=false');

    const tokens = [];
    data.forEach(coin => {
      // Try to extract Solana address from platforms
      const solAddress = coin.platforms?.solana;
      if (solAddress && !knownAddresses.has(solAddress)) {
        knownAddresses.add(solAddress);
        tokens.push({
          address: solAddress,
          symbol: coin.symbol?.toUpperCase() || 'UNKNOWN',
          name: coin.name || 'Unknown',
          decimals: 9,
          chainId: 101,
          logoURI: coin.image
        });
      }
    });

    console.log(`✅ CoinGecko: ${tokens.length} new tokens`);
    return tokens;
  } catch (error) {
    console.error('❌ CoinGecko error:', error.message);
    return [];
  }
}

/**
 * DYNAMIC SOURCE: Raydium Top Pools
 */
async function fetchRaydiumPools(knownAddresses) {
  console.log('📥 Fetching Raydium pools...');

  try {
    const data = await fetchJson('https://api.raydium.io/v2/main/pairs');

    const tokens = [];
    if (Array.isArray(data)) {
      data.slice(0, 100).forEach(pool => {
        // Extract base and quote tokens
        [pool.baseMint, pool.quoteMint].forEach(addr => {
          if (addr && !knownAddresses.has(addr)) {
            knownAddresses.add(addr);
            tokens.push({
              address: addr,
              symbol: pool.baseSymbol || pool.quoteSymbol || 'UNKNOWN',
              name: pool.name || 'Unknown',
              decimals: 9,
              chainId: 101,
              logoURI: null
            });
          }
        });
      });
    }

    console.log(`✅ Raydium: ${tokens.length} new tokens`);
    return tokens;
  } catch (error) {
    console.error('❌ Raydium error:', error.message);
    return [];
  }
}

/**
 * DYNAMIC SOURCE: Orca Whirlpools
 */
async function fetchOrcaPools(knownAddresses) {
  console.log('📥 Fetching Orca whirlpools...');

  try {
    const data = await fetchJson('https://api.mainnet.orca.so/v1/whirlpool/list');

    const tokens = [];
    if (data && data.whirlpools) {
      data.whirlpools.slice(0, 50).forEach(pool => {
        [pool.tokenA, pool.tokenB].forEach(token => {
          if (token && token.mint && !knownAddresses.has(token.mint)) {
            knownAddresses.add(token.mint);
            tokens.push({
              address: token.mint,
              symbol: token.symbol || 'UNKNOWN',
              name: token.name || 'Unknown',
              decimals: token.decimals || 9,
              chainId: 101,
              logoURI: token.logoURI
            });
          }
        });
      });
    }

    console.log(`✅ Orca: ${tokens.length} new tokens`);
    return tokens;
  } catch (error) {
    console.error('❌ Orca error:', error.message);
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
 * Deduplicate by address with priority
 */
function deduplicateTokens(tokens) {
  const addressMap = new Map();

  // Priority 1: Popular tokens
  tokens.forEach(token => {
    if (POPULAR_TOKENS.includes(token.address)) {
      addressMap.set(token.address, token);
    }
  });

  // Priority 2: All other tokens
  tokens.forEach(token => {
    if (!addressMap.has(token.address)) {
      addressMap.set(token.address, token);
    }
  });

  return Array.from(addressMap.values());
}

/**
 * MAIN ORCHESTRATOR
 */
async function buildMegaTokenList() {
  console.log('');
  console.log('🚀 MEGA TOKEN LIST BUILDER v4 - ULTIMATE EDITION');
  console.log('📊 Multi-Source Discovery Engine');
  console.log('═══════════════════════════════════════════════');
  console.log('');

  const stats = {};
  const allTokens = [];

  // Load existing tokens for incremental discovery
  const existingTokens = loadExistingTokens();
  const knownAddresses = getKnownAddresses(existingTokens);

  console.log(`📚 Loaded ${existingTokens.length.toLocaleString()} existing tokens`);
  console.log('');

  // PHASE 1: Static sources (only fetch if we have < 10k tokens)
  if (existingTokens.length < 10000) {
    console.log('📦 PHASE 1: Static Sources');
    console.log('─────────────────────────────────────────────');

    const solanaTokens = await fetchSolanaLabs(knownAddresses);
    stats.solanaLabs = solanaTokens.length;
    solanaTokens.forEach(t => allTokens.push(normalizeToken(t)));

    const jupiterTokens = await fetchJupiterArchived(knownAddresses);
    stats.jupiter = jupiterTokens.length;
    jupiterTokens.forEach(t => allTokens.push(normalizeToken(t)));

    console.log('');
  } else {
    console.log('✅ Skipping static sources (already loaded)');
    console.log('');
    stats.solanaLabs = 0;
    stats.jupiter = 0;
  }

  // PHASE 2: Dynamic sources (always fetch for new tokens)
  console.log('🔥 PHASE 2: Dynamic Discovery');
  console.log('─────────────────────────────────────────────');

  const dexTokens = await fetchDexScreenerSmart(knownAddresses);
  stats.dexScreener = dexTokens.length;
  dexTokens.forEach(t => allTokens.push(normalizeToken(t)));

  const coinGeckoTokens = await fetchCoinGecko(knownAddresses);
  stats.coinGecko = coinGeckoTokens.length;
  coinGeckoTokens.forEach(t => allTokens.push(normalizeToken(t)));

  const raydiumTokens = await fetchRaydiumPools(knownAddresses);
  stats.raydium = raydiumTokens.length;
  raydiumTokens.forEach(t => allTokens.push(normalizeToken(t)));

  const orcaTokens = await fetchOrcaPools(knownAddresses);
  stats.orca = orcaTokens.length;
  orcaTokens.forEach(t => allTokens.push(normalizeToken(t)));

  console.log('');
  console.log('📊 PROCESSING & MERGING');
  console.log('═══════════════════════════════════════════════');

  // Merge with existing tokens
  const combined = [...existingTokens, ...allTokens];
  console.log(`   Combined:  ${combined.length.toLocaleString()} total tokens`);

  // Filter wrapped SOL
  const filtered = filterWrappedSOL(combined);
  console.log(`   Filtered:  ${filtered.length.toLocaleString()} (removed ${combined.length - filtered.length} wrapped SOL)`);

  // Deduplicate
  const unique = deduplicateTokens(filtered);
  console.log(`   Unique:    ${unique.length.toLocaleString()} (removed ${filtered.length - unique.length} duplicates)`);

  // Sort: popular first, then by volume
  const sorted = unique.sort((a, b) => {
    const aIsPopular = POPULAR_TOKENS.includes(a.address);
    const bIsPopular = POPULAR_TOKENS.includes(b.address);

    if (aIsPopular && !bIsPopular) return -1;
    if (!aIsPopular && bIsPopular) return 1;
    if (aIsPopular && bIsPopular) {
      return POPULAR_TOKENS.indexOf(a.address) - POPULAR_TOKENS.indexOf(b.address);
    }

    const aVol = a.volume24h || 0;
    const bVol = b.volume24h || 0;
    return bVol - aVol;
  });

  console.log(`   Sorted:    Top 50 popular tokens prioritized`);

  // Calculate discovery stats
  const newTokensAdded = sorted.length - existingTokens.length;
  const discoveryRate = allTokens.length > 0 ? ((newTokensAdded / allTokens.length) * 100).toFixed(1) : 0;

  console.log('');
  console.log('📈 DISCOVERY METRICS');
  console.log('═══════════════════════════════════════════════');
  console.log(`   Previous:        ${existingTokens.length.toLocaleString()} tokens`);
  console.log(`   New discovered:  ${newTokensAdded.toLocaleString()} tokens`);
  console.log(`   Discovery rate:  ${discoveryRate}%`);
  console.log(`   Total now:       ${sorted.length.toLocaleString()} tokens`);

  // Build final list
  const tokenList = {
    name: 'Tenet Wallet - MEGA Token List',
    description: 'Multi-source: Solana Labs + Jupiter + DexScreener + CoinGecko + Raydium + Orca',
    timestamp: new Date().toISOString(),
    version: {
      major: 4,
      minor: 0,
      patch: Date.now()
    },
    stats: {
      ...stats,
      total: sorted.length,
      newThisRun: newTokensAdded,
      discoveryRate: parseFloat(discoveryRate)
    },
    tokens: sorted,
    count: sorted.length
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
  console.log('📈 Sources This Run:');
  console.log(`   Solana Labs:  ${stats.solanaLabs?.toLocaleString() || 0}`);
  console.log(`   Jupiter:      ${stats.jupiter?.toLocaleString() || 0}`);
  console.log(`   DexScreener:  ${stats.dexScreener?.toLocaleString() || 0}`);
  console.log(`   CoinGecko:    ${stats.coinGecko?.toLocaleString() || 0}`);
  console.log(`   Raydium:      ${stats.raydium?.toLocaleString() || 0}`);
  console.log(`   Orca:         ${stats.orca?.toLocaleString() || 0}`);
  console.log('');
  console.log('💡 Running every 2 hours = 12x/day for continuous discovery!');
  console.log('');

  return tokenList;
}

// Run
buildMegaTokenList()
  .then(() => {
    console.log('🎉 DONE! Token list updated successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ FATAL:', error);
    console.error(error.stack);
    process.exit(1);
  });
