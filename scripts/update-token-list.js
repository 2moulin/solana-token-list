// MEGA Token List Crawler v3
// Aggressive DexScreener fetching: 300 requests per 15 minutes
// Fetches: Solana Labs + DexScreener (300 tokens per run)
// Updates daily via GitHub Actions

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

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

// 300 search queries to maximize DexScreener coverage
// These are trending tokens, memecoins, DeFi, and infrastructure projects
const SEARCH_QUERIES = [
  // Top tier memecoins & trending
  'bonk', 'wif', 'popcat', 'myro', 'bome', 'wen', 'tremp', 'mew',
  'sloth', 'ponke', 'billy', 'gme', 'smog', 'gecko', 'foxy', 'harambe',
  'duko', 'silly', 'nub', 'maneki', 'catwifhat', 'michi', 'hobbes',

  // DeFi protocols
  'jup', 'jto', 'pyth', 'orca', 'ray', 'mngo', 'fida', 'step',
  'saber', 'port', 'sunny', 'tulip', 'quarry', 'apricot', 'francium',
  'larix', 'mercurial', 'sencha', 'lifinity', 'hawksight', 'kamino',
  'drift', 'zeta', 'mango', 'zo', 'cypher', 'hxro', 'psyoptions',

  // Staking & Liquid staking
  'msol', 'stsol', 'jsol', 'scnsol', 'daosolsol', 'bsol', 'compasssol',

  // Infrastructure & oracles
  'render', 'rndr', 'helium', 'hnt', 'mobile', 'iot', 'shdw', 'nosana',
  'nos', 'render', 'livepeer', 'arweave', 'storj',

  // Gaming & metaverse
  'atlas', 'polis', 'genopets', 'gene', 'cheems', 'aurory', 'aury',
  'monkeydao', 'nyan', 'degen', 'cets', 'fronk', 'samoyedcoin',

  // Cross-chain bridges & wrapped assets
  'eth', 'btc', 'weth', 'wbtc', 'avax', 'bnb', 'matic', 'ftm',
  'usdc', 'usdt', 'dai', 'busd', 'usdh', 'uxd', 'usdd',

  // NFT & creators
  'dust', 'forge', 'cope', 'media', 'only1', 'grape', 'foxy', 'degods',

  // Exchanges & DEX tokens
  'serum', 'srm', 'oxy', 'prism', 'crema', 'aldrin', 'rin',

  // Additional trending searches for comprehensive coverage
  'pepe', 'doge', 'shib', 'floki', 'kishu', 'elon', 'dogelon',
  'babydoge', 'akita', 'hokk', 'ass', 'cum', 'pussy', 'tits',
  'chad', 'wojak', 'npc', 'cope', 'hopium', 'fud', 'ngmi', 'wagmi',

  // More DeFi & yields
  'tulip', 'jet', 'parrot', 'prt', 'slnd', 'socean', 'scnsol',
  'larix', 'liq', 'ratio', 'usdr', 'mai', 'usdh', 'cashio',

  // Additional protocols
  'ninja', 'sail', 'cope', 'maps', 'kin', 'gari', 'prism', 'psy',
  'basis', 'cash', 'grape', 'sny', 'synthetify', 'bonfida',

  // More meme searches
  'milady', 'remilio', 'trump', 'biden', 'elon', 'pepe', 'apu',
  'wojak', 'bobo', 'sminem', 'bogdanoff', 'moon', 'lambo', 'wen',

  // Extended coverage for max tokens
  'sol', 'solana', 'defi', 'nft', 'dao', 'coin', 'token', 'swap',
  'farm', 'stake', 'yield', 'pool', 'vault', 'lend', 'borrow',
  'trade', 'dex', 'amm', 'liquidity', 'finance', 'protocol',

  // Additional specific tokens
  'samo', 'cope', 'oogi', 'cheems', 'cato', 'solape', 'fida',
  'rope', 'tulip', 'sunny', 'slim', 'crema', 'aldrin', 'step',
  'larix', 'port', 'apricot', 'francium', 'quarry', 'jet',
  'parrot', 'ratio', 'basis', 'cashio', 'uxp', 'slnd', 'socean',

  // Even more coverage
  'media', 'sntr', 'audio', 'audius', 'maps', 'ninja', 'star',
  'atlas', 'polis', 'gene', 'aury', 'nyan', 'degen', 'cope',
  'oxy', 'mnde', 'liq', 'prism', 'psy', 'hxro', 'zo', 'cypher',
  'zeta', 'drift', 'entropy', '01', 'hedge', 'dual', 'friktion',

  // Final batch for 300 total
  'vader', 'sushi', 'uni', 'cake', 'joe', 'spell', 'ice', 'time',
  'ohm', 'klima', 'btrfly', 'inv', 'fxs', 'cvx', 'crv', 'bal',
  'aave', 'comp', 'mkr', 'snx', 'yfi', 'link', 'band', 'ocean',
  'grt', 'api3', 'trb', 'cel', 'nexo', 'astr', 'glmr', 'movr',
  'ftt', 'looks', 'blur', 'x2y2', 'gem', 'sudo', 'nftx', 'treasure'
];

/**
 * Load existing tokens from previous runs to avoid re-fetching
 */
function loadExistingTokens() {
  try {
    if (fs.existsSync('tokens.json')) {
      const data = fs.readFileSync('tokens.json', 'utf8');
      const tokenList = JSON.parse(data);
      return tokenList.tokens || [];
    }
  } catch (error) {
    console.log('⚠️  No existing tokens.json found, starting fresh');
  }
  return [];
}

/**
 * Aggressive DexScreener fetching - 300 requests per run
 * Rate limit: 300 requests per 15 minutes = 1 request per 3 seconds
 */
async function fetchDexScreenerAggressive() {
  console.log('');
  console.log('🔥 AGGRESSIVE DEXSCREENER FETCHING (300 requests)');
  console.log('═══════════════════════════════════════════════');
  console.log('');

  const allTokens = [];
  const seen = new Set();
  const totalQueries = Math.min(SEARCH_QUERIES.length, 300); // Cap at 300
  let requestCount = 0;

  console.log(`📊 Will execute ${totalQueries} search queries`);
  console.log(`⏱️  Rate limit: 1 request per 3 seconds (safe for 300/15min limit)`);
  console.log('');

  const startTime = Date.now();

  for (let i = 0; i < totalQueries; i++) {
    const query = SEARCH_QUERIES[i];

    try {
      const progress = Math.round((i / totalQueries) * 100);
      process.stdout.write(`\r[${progress}%] Query ${i + 1}/${totalQueries}: ${query.padEnd(20)} `);

      const data = await fetchJson(`https://api.dexscreener.com/latest/dex/search?q=${query}`);
      requestCount++;

      if (data && data.pairs) {
        // Take top 10 from each search to maximize unique tokens
        data.pairs.slice(0, 10).forEach(pair => {
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
                logoURI: pair.info?.imageUrl,
                volume24h: parseFloat(pair.volume?.h24 || 0),
                liquidity: parseFloat(pair.liquidity?.usd || 0)
              });
            }
          }
        });
      }

      // Rate limit: 3 seconds per request (safe for 300 requests / 15 minutes)
      await sleep(3000);

    } catch (error) {
      console.error(`\n  ❌ Error on query "${query}":`, error.message);
    }
  }

  const elapsedTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log('');
  console.log('');
  console.log(`✅ Completed ${requestCount} DexScreener requests in ${elapsedTime} minutes`);
  console.log(`📊 Found ${allTokens.length} unique tokens from DexScreener`);
  console.log('');

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

  // First: popular tokens get priority
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
  console.log('🚀 MEGA TOKEN LIST BUILDER v3');
  console.log('🔥 AGGRESSIVE MODE: 300 DexScreener requests per run');
  console.log('═══════════════════════════════════════════════');
  console.log('');

  const allTokens = [];
  const stats = {};

  // Step 1: Solana Labs base (~13k tokens)
  const solanaTokens = await fetchSolanaLabs();
  stats.solanaLabs = solanaTokens.length;
  solanaTokens.forEach(t => allTokens.push(normalizeToken(t)));

  console.log('');

  // Step 2: Aggressive DexScreener fetching (300 requests)
  const dexTokens = await fetchDexScreenerAggressive();
  stats.dexScreener = dexTokens.length;
  dexTokens.forEach(t => allTokens.push(normalizeToken(t)));

  console.log('');
  console.log('📊 PROCESSING & DEDUPLICATION');
  console.log('═══════════════════════════════════════════════');
  console.log(`   Fetched:  ${allTokens.length.toLocaleString()} total tokens`);

  // Filter wrapped SOL
  const filtered = filterWrappedSOL(allTokens);
  console.log(`   Filtered: ${filtered.length.toLocaleString()} (removed ${allTokens.length - filtered.length} wrapped SOL)`);

  // Deduplicate
  const unique = deduplicateTokens(filtered);
  console.log(`   Unique:   ${unique.length.toLocaleString()} (removed ${filtered.length - unique.length} duplicates)`);

  // Sort: popular tokens first, then by volume/liquidity
  const sorted = unique.sort((a, b) => {
    const aIsPopular = POPULAR_TOKENS.includes(a.address);
    const bIsPopular = POPULAR_TOKENS.includes(b.address);

    if (aIsPopular && !bIsPopular) return -1;
    if (!aIsPopular && bIsPopular) return 1;
    if (aIsPopular && bIsPopular) {
      return POPULAR_TOKENS.indexOf(a.address) - POPULAR_TOKENS.indexOf(b.address);
    }

    // Sort by volume if available
    const aVol = a.volume24h || 0;
    const bVol = b.volume24h || 0;
    return bVol - aVol;
  });

  console.log(`   Sorted:   Top 50 popular tokens prioritized`);

  // Build final list
  const tokenList = {
    name: 'Tenet Wallet - MEGA Token List',
    description: 'Solana Labs + DexScreener (300 requests/day) - Growing daily',
    timestamp: new Date().toISOString(),
    version: {
      major: 3,
      minor: 0,
      patch: Date.now()
    },
    stats: stats,
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
  console.log('📈 Sources:');
  console.log(`   Solana Labs:  ${stats.solanaLabs.toLocaleString()}`);
  console.log(`   DexScreener:  ${stats.dexScreener.toLocaleString()}`);
  console.log('');
  console.log('💡 This list grows by ~300 unique tokens per day!');
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
    process.exit(1);
  });
