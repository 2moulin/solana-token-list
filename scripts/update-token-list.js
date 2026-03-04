const https = require('https');
const http = require('http');
const fs = require('fs');
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
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
async function fetchTop100PopularTokens() {
  console.log('🔥 Fetching top 100+ popular Solana tokens...');

  const seen = new Set();
  const result = [];

  function addToken(address) {
    if (!seen.has(address)) {
      seen.add(address);
      result.push(address);
    }
  }

  // ── Tier 1: Hardcoded essentials (always first, never changes) ──
  const essentials = [
    'So11111111111111111111111111111111111111112',   // SOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  ];
  essentials.forEach(addToken);

  // ── Tier 2: CoinGecko top Solana tokens by market cap ──
  // Fetch market list (IDs) + full coin list (addresses) in parallel
  try {
    console.log('   📊 Fetching CoinGecko top 200 Solana tokens by market cap...');
    // Sequential to avoid CoinGecko free tier rate limiting (~10 req/min)
    const marketsPage1 = await fetchJson('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=solana-ecosystem&order=market_cap_desc&per_page=100&page=1&sparkline=false');
    await sleep(1500);
    const marketsPage2 = await fetchJson('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=solana-ecosystem&order=market_cap_desc&per_page=100&page=2&sparkline=false');
    await sleep(1500);
    const coinList = await fetchJson('https://api.coingecko.com/api/v3/coins/list?include_platform=true');

    // Guard: CoinGecko might return error objects instead of arrays when rate-limited
    if (!Array.isArray(coinList) || !Array.isArray(marketsPage1)) {
      throw new Error('CoinGecko returned non-array (rate limited?)');
    }

    // Build ID → Solana address map
    const idToAddr = {};
    coinList.forEach(c => {
      if (c.platforms && c.platforms.solana) {
        idToAddr[c.id] = c.platforms.solana;
      }
    });

    // Add tokens in market cap order
    const markets = [...marketsPage1, ...(Array.isArray(marketsPage2) ? marketsPage2 : [])];
    let cgCount = 0;
    markets.forEach(coin => {
      const addr = idToAddr[coin.id];
      if (addr) {
        addToken(addr);
        cgCount++;
      }
    });
    console.log(`   ✅ CoinGecko: ${cgCount} tokens added by market cap rank`);
  } catch (error) {
    console.error('   ❌ CoinGecko popular fetch failed:', error.message);
  }

  // ── Tier 3: DexScreener trending (fresh meme/hype tokens) ──
  try {
    console.log('   🔥 Fetching DexScreener trending tokens...');
    const searches = [
      'bonk', 'wif', 'jup', 'jto', 'pyth', 'popcat', 'mew',
      'pengu', 'trump', 'melania', 'fartcoin', 'grass', 'render',
      'ray', 'orca', 'drift', 'marinade', 'raydium', 'jupiter',
      'helium', 'virtual', 'pippin', 'pump', 'ban', 'arc'
    ];

    let dexCount = 0;
    for (const query of searches) {
      try {
        const data = await fetchJson(`https://api.dexscreener.com/latest/dex/search?q=${query}`);
        if (data && data.pairs) {
          data.pairs
            .filter(p => p.chainId === 'solana')
            .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
            .slice(0, 3)
            .forEach(pair => {
              if (pair.baseToken && pair.baseToken.address) {
                const before = result.length;
                addToken(pair.baseToken.address);
                if (result.length > before) dexCount++;
              }
            });
        }
        await sleep(350);
      } catch (e) {
        // skip individual search errors
      }
    }
    console.log(`   ✅ DexScreener: ${dexCount} extra trending tokens added`);
  } catch (error) {
    console.error('   ❌ DexScreener trending fetch failed:', error.message);
  }

  console.log(`   📋 Total popular tokens: ${result.length}`);
  return result;
}
function loadExistingTokens() {
  try {
    if (fs.existsSync('tokens.json')) {
      const data = JSON.parse(fs.readFileSync('tokens.json', 'utf8'));
      return data.tokens || [];
    }
  } catch (error) {
    console.log('Starting fresh, no existing tokens.js');
  }
  return [];
}
function getKnownAddresses(existingTokens) {
  return new Set(existingTokens.map(t => t.address));
}
async function fetchSolanaLabs(knownAddresses) {
  console.log('Fetching Solana Labs token list..');
  try {
    const data = await fetchJson('https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json');
    const tokens = data.tokens || [];
    const newTokens = tokens.filter(t => !knownAddresses.has(t.address));
    console.log(`Solana Labs: ${tokens.length} total, ${newTokens.length} new`);
    return newTokens;
  } catch (error) {
    console.error('Solana Labs error:', error.message);
    return [];
  }
}
async function fetchJupiterArchived(knownAddresses) {
  console.log('Fetching Jupiter archived list..');
  try {
    const data = await fetchJson('https://token.jup.ag/all');
    const tokens = data || [];
    const newTokens = tokens.filter(t => !knownAddresses.has(t.address));
    console.log(`Jupiter: ${tokens.length} total, ${newTokens.length} new`);
    return newTokens;
  } catch (error) {
    console.error('Jupiter error:', error.message);
    return [];
  }
}
async function fetchDexScreenerSmart(knownAddresses) {
  const allTokens = [];
  const hour = new Date().getUTCHours();
  let queries = [];
  if (hour >= 0 && hour < 8) {
    console.log('🌙 Night Mode: Latest pairs + new launches');
    queries = [
      'solana', 'new', 'launch', 'latest', 'bonk', 'wif', 'popcat',
      'meme', 'coin', 'token', 'defi', 'dex', 'pump', 'moon',
      'pepe', 'doge', 'shib', 'floki', 'wen', 'tremp', 'bome'
    ];
  } else if (hour >= 8 && hour < 16) {
    console.log('Day Mode: Trending + high volume');
    queries = [
      'jup', 'pyth', 'jto', 'orca', 'ray', 'mango', 'drift',
      'trending', 'volume', 'top', 'popular', 'hot', 'trade',
      'usdc', 'usdt', 'sol', 'btc', 'eth', 'stablecoin'
    ];
  } else {
    console.log('Evening Mode: Niche + gaming + NFT');
    queries = [
      'atlas', 'polis', 'genopets', 'stepn', 'nft', 'gaming',
      'metaverse', 'render', 'helium', 'nosana', 'shdw',
      'dao', 'governance', 'staking', 'yield', 'farm'
    ];
  }
  const additionalQueries = [
    'samo', 'cope', 'foxy', 'grape', 'dust', 'media', 'kin',
    'msol', 'stsol', 'jsol', 'liquid', 'stake', 'validator',
    'bridge', 'wormhole', 'portal', 'allbridge', 'cross',
    'lend', 'borrow', 'loan', 'protocol', 'vault', 'pool',
    'swap', 'amm', 'orderbook', 'perp', 'derivative', 'option',
    'real', 'world', 'asset', 'rwa', 'commodity', 'gold',
    'ai', 'artificial', 'intelligence', 'data', 'oracle',
    'machine', 'learning', 'neural', 'model', 'compute',
    'cloud', 'storage', 'ipfs', 'arweave', 'filecoin',
    'music', 'art', 'creator', 'social', 'community',
    'fan', 'ticket', 'event', 'merchandise', 'collectible',
    'digital', 'identity', 'profile', 'reputation', 'badge',
    'privacy', 'zero', 'knowledge', 'zk', 'rollup',
    'encryption', 'secure', 'anonymous', 'private', 'stealth',
    'mobile', 'phone', 'iot', 'device', 'hardware',
    'sensor', 'network', 'mesh', 'wireless', 'bluetooth',
    'energy', 'green', 'carbon', 'climate', 'esg',
    'renewable', 'solar', 'wind', 'sustainable', 'eco',
    'insurance', 'predict', 'betting', 'lottery', 'game',
    'sport', 'fantasy', 'esport', 'streaming', 'video',
    'play', 'earn', 'reward', 'quest', 'battle',
    'racing', 'card', 'rpg', 'strategy', 'puzzle',
    'arcade', 'casual', 'adventure', 'shooter', 'sandbox',
    'launchpad', 'ido', 'ico', 'presale', 'fundraise',
    'crowdfund', 'seed', 'round', 'investor', 'venture',
    'aggregator', 'analytics', 'explorer', 'wallet', 'tool',
    'dashboard', 'monitor', 'tracker', 'scanner', 'alert',
    'cat', 'dog', 'frog', 'penguin', 'monkey', 'ape',
    'bear', 'bull', 'wolf', 'shark', 'whale', 'fish',
    'bird', 'dragon', 'tiger', 'lion', 'panda', 'koala',
    'hamster', 'rabbit', 'fox', 'raccoon', 'squirrel', 'hedgehog',
    '100x', '1000x', 'moon', 'mars', 'rocket', 'gem',
    'diamond', 'gold', 'silver', 'platinum', 'rare', 'legendary',
    'viral', 'hype', 'fomo', 'hodl', 'degen', 'alpha',
    'beta', 'gamma', 'sigma', 'omega', 'ultra', 'mega',
    'super', 'hyper', 'max', 'pro', 'elite', 'premium',
    'marinade', 'lido', 'jupiter', 'raydium', 'orca', 'lifinity',
    'phoenix', 'zeta', 'mango', 'drift', 'marginfi', 'solend',
    'port', 'francium', 'tulip', 'sunny', 'saber', 'mercurial',
    'japan', 'korea', 'china', 'asia', 'europe', 'america',
    'latin', 'africa', 'middle', 'east', 'global', 'world',
    'fund', 'index', 'etf', 'yield', 'apy', 'apr',
    'leverage', 'margin', 'collateral', 'debt', 'credit', 'equity',
    'quantum', 'blockchain', 'web3', 'metaverse', 'virtual',
    'augmented', 'reality', 'vr', 'ar', 'xr', '3d',
    'banana', 'pizza', 'sushi', 'burger', 'coffee', 'beer',
    'wine', 'water', 'fire', 'ice', 'lightning', 'thunder',
    'storm', 'wave', 'ocean', 'mountain', 'forest', 'desert',
    'space', 'star', 'galaxy', 'planet', 'comet', 'asteroid'
  ];
  queries = [...queries, ...additionalQueries].slice(0, 300);
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
      await sleep(250);
    } catch (error) {
      console.error(`\n  ❌ Error on "${query}":`, error.message);
    }
  }
  const elapsedTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log('');
  console.log(`DexScreener: ${requestCount} requests in ${elapsedTime} min, ${newFound} new tokens`);
  console.log('');
  return allTokens;
}
async function fetchCoinGecko(knownAddresses) {
  console.log('📥 Fetching CoinGecko Solana tokens...');
  try {
    const data = await fetchJson('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=solana-ecosystem&order=market_cap_desc&per_page=250&page=1&sparkline=false');
    const tokens = [];
    data.forEach(coin => {
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
    console.log(`CoinGecko: ${tokens.length} new tokens`);
    return tokens;
  } catch (error) {
    console.error('❌ CoinGecko error:', error.message);
    return [];
  }
}
async function fetchRaydiumPools(knownAddresses) {
  console.log('Fetching Raydium pools...');
  try {
    const data = await fetchJson('https://api.raydium.io/v2/main/pairs');
    const tokens = [];
    if (Array.isArray(data)) {
      data.slice(0, 100).forEach(pool => {
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
    console.log(`Raydium: ${tokens.length} new tokens`);
    return tokens;
  } catch (error) {
    console.error('Raydium error:', error.message);
    return [];
  }
}
async function fetchOrcaPools(knownAddresses) {
  console.log('Fetching Orca whirlpools...');
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
    console.log(`Orca: ${tokens.length} new tokens`);
    return tokens;
  } catch (error) {
    console.error('Orca error:', error.message);
    return [];
  }
}
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
function deduplicateTokens(tokens, popularTokens) {
  const addressMap = new Map();
  tokens.forEach(token => {
    if (popularTokens.includes(token.address)) {
      addressMap.set(token.address, token);
    }
  });
  tokens.forEach(token => {
    if (!addressMap.has(token.address)) {
      addressMap.set(token.address, token);
    }
  });
  return Array.from(addressMap.values());
}
async function buildMegaTokenList() {
  const stats = {};
  const allTokens = [];
  const POPULAR_TOKENS = await fetchTop100PopularTokens();
  console.log('');
  const existingTokens = loadExistingTokens();
  const knownAddresses = getKnownAddresses(existingTokens);
  if (existingTokens.length < 10000) {
    const solanaTokens = await fetchSolanaLabs(knownAddresses);
    stats.solanaLabs = solanaTokens.length;
    solanaTokens.forEach(t => allTokens.push(normalizeToken(t)));
    const jupiterTokens = await fetchJupiterArchived(knownAddresses);
    stats.jupiter = jupiterTokens.length;
    jupiterTokens.forEach(t => allTokens.push(normalizeToken(t)));
    console.log('');
  } else {
    console.log('Skipping static sources (already loaded)');
    console.log('');
    stats.solanaLabs = 0;
    stats.jupiter = 0;
  }
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
  const combined = [...existingTokens, ...allTokens];
  console.log(`   Combined:  ${combined.length.toLocaleString()} total tokens`);
  const filtered = filterWrappedSOL(combined);
  console.log(`   Filtered:  ${filtered.length.toLocaleString()} (removed ${combined.length - filtered.length} wrapped SOL)`);
  const unique = deduplicateTokens(filtered, POPULAR_TOKENS);
  console.log(`   Unique:    ${unique.length.toLocaleString()} (removed ${filtered.length - unique.length} duplicates)`);
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
  console.log(`   Sorted:    Top ${POPULAR_TOKENS.length} popular tokens prioritized`);
  const newTokensAdded = sorted.length - existingTokens.length;
  const discoveryRate = allTokens.length > 0 ? ((newTokensAdded / allTokens.length) * 100).toFixed(1) : 0;
  console.log('');
  console.log(`   Previous:        ${existingTokens.length.toLocaleString()} tokens`);
  console.log(`   New discovered:  ${newTokensAdded.toLocaleString()} tokens`);
  console.log(`   Discovery rate:  ${discoveryRate}%`);
  console.log(`   Total now:       ${sorted.length.toLocaleString()} tokens`);
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
    popularTokens: POPULAR_TOKENS,
    tokens: sorted,
    count: sorted.length
  };
  fs.writeFileSync('tokens.json', JSON.stringify(tokenList, null, 2));
  console.log('');
  console.log('SUCCESS');
  console.log(`File:tokens.json`);
  console.log(`Tokens: ${tokenList.count.toLocaleString()}`);
  console.log(`Size: ${(Buffer.byteLength(JSON.stringify(tokenList)) / 1024 / 1024).toFixed(2)} MB`);
  console.log('');
  console.log('Sources This Run:');
  console.log(`Solana Labs:  ${stats.solanaLabs?.toLocaleString() || 0}`);
  console.log(`Jupiter:      ${stats.jupiter?.toLocaleString() || 0}`);
  console.log(`DexScreener:  ${stats.dexScreener?.toLocaleString() || 0}`);
  console.log(`CoinGecko:    ${stats.coinGecko?.toLocaleString() || 0}`);
  console.log(`Raydium:      ${stats.raydium?.toLocaleString() || 0}`);
  console.log(`Orca:         ${stats.orca?.toLocaleString() || 0}`);
  console.log('');
  console.log('Running every 2 hours');
  console.log('');
  return tokenList;
}
buildMegaTokenList()
  .then(() => {
    console.log('DONE! Token list updated successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('FATAL:', error);
    console.error(error.stack);
    process.exit(1);
  });
