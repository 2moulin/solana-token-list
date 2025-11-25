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

/**
 * Fetch top 50 popular tokens dynamically from CoinGecko by market cap
 * Updates every run to always have the most trending tokens
 */
async function fetchTop50PopularTokens() {
  console.log('🔥 Fetching top 50 trending Solana tokens from DexScreener...');

  try {
    // Use DexScreener's token boosts endpoint for trending tokens
    // This gives us the most actively traded/trending tokens on Solana
    const searches = [
      'bonk', 'wif', 'jup', 'jto', 'pyth', 'wen', 'myro', 'popcat',
      'mew', 'bome', 'slerf', 'smog', 'silly', 'nub', 'peng'
    ];

    const allTopTokens = [];
    const seen = new Set();

    // Add hardcoded essentials first (always in top 50)
    const essentials = [
      { address: 'So11111111111111111111111111111111111111112', priority: 1 },  // SOL
      { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', priority: 2 },  // USDC
      { address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', priority: 3 },  // USDT
      { address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', priority: 4 },  // BONK
      { address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', priority: 5 },  // JUP
      { address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', priority: 6 },  // WIF
      { address: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', priority: 7 },  // PYTH
      { address: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL', priority: 8 },  // JTO
      { address: 'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk', priority: 9 },   // WEN
      { address: 'HhJpBhRRn4g56VsyLuT8DL5Bv31HkXqsrahTTUCZeZg4', priority: 10 }, // MYRO
    ];

    essentials.forEach(token => {
      seen.add(token.address);
      allTopTokens.push(token);
    });

    // Fetch trending tokens from DexScreener
    for (const query of searches) {
      try {
        const url = `https://api.dexscreener.com/latest/dex/search?q=${query}`;
        const data = await fetchJson(url);

        if (data.pairs && data.pairs.length > 0) {
          // Get top pair by volume
          const topPairs = data.pairs
            .filter(p => p.chainId === 'solana')
            .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
            .slice(0, 3); // Top 3 per search

          topPairs.forEach(pair => {
            const address = pair.baseToken.address;
            if (!seen.has(address)) {
              seen.add(address);
              allTopTokens.push({
                address,
                priority: allTopTokens.length + 1
              });
            }
          });
        }

        await sleep(350); // DexScreener rate limit (300/min)
      } catch (error) {
        console.error(`  ❌ Error searching ${query}:`, error.message);
      }
    }

    // Take top 50
    const top50 = allTopTokens
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 50)
      .map(t => t.address);

    console.log(`✅ Loaded ${top50.length} trending tokens`);
    return top50;

  } catch (error) {
    console.error('❌ Failed to fetch trending tokens, using fallback list:', error.message);

    // Fallback to hardcoded essentials
    return [
      'So11111111111111111111111111111111111111112', // SOL
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
      'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // JUP
      'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
      'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', // PYTH
      'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL', // JTO
      'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk', // WEN
      'HhJpBhRRn4g56VsyLuT8DL5Bv31HkXqsrahTTUCZeZg4', // MYRO
      'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5', // MEW
      'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82', // BOME
    ];
  }
}

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
function deduplicateTokens(tokens, popularTokens) {
  const addressMap = new Map();

  // Priority 1: Popular tokens
  tokens.forEach(token => {
    if (popularTokens.includes(token.address)) {
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

  // Fetch top 50 popular tokens dynamically
  const POPULAR_TOKENS = await fetchTop50PopularTokens();
  console.log('');

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
  const unique = deduplicateTokens(filtered, POPULAR_TOKENS);
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
    popularTokens: POPULAR_TOKENS, // Top 50 by market cap
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
