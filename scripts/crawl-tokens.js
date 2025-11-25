// MEGA Token List Crawler - Combines multiple sources
// 100% Free - Scales to 1000s of users
// Runs daily via GitHub Actions

const fs = require('fs');

// Sources that are 100% free and unlimited
const SOURCES = [
  {
    name: 'Solana Labs',
    url: 'https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json',
    format: 'solana-labs'
  },
  {
    name: 'Jupiter Verified',
    url: 'https://tokens.jup.ag/tokens?tags=verified',
    format: 'jupiter'
  },
  {
    name: 'Jupiter Strict',
    url: 'https://tokens.jup.ag/tokens?tags=strict',
    format: 'jupiter'
  }
];

// Popular tokens to always include at top
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
 * Fetch tokens from a single source
 */
async function fetchSource(source) {
  console.log(`📥 Fetching from ${source.name}...`);

  try {
    const response = await fetch(source.url);

    if (!response.ok) {
      console.error(`❌ ${source.name} returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    let tokens = [];

    // Parse based on format
    if (source.format === 'solana-labs') {
      tokens = data.tokens || [];
    } else if (source.format === 'jupiter') {
      tokens = Array.isArray(data) ? data : [];
    }

    console.log(`✅ Loaded ${tokens.length} tokens from ${source.name}`);
    return tokens;

  } catch (error) {
    console.error(`❌ Error fetching ${source.name}:`, error.message);
    return [];
  }
}

/**
 * Normalize token format (different sources have different formats)
 */
function normalizeToken(token) {
  return {
    address: token.address || token.mint,
    symbol: token.symbol || 'UNKNOWN',
    name: token.name || 'Unknown Token',
    decimals: token.decimals || 9,
    chainId: token.chainId || 101,
    logoURI: token.logoURI || token.image,
    tags: token.tags || []
  };
}

/**
 * Deduplicate tokens by address (keep first occurrence)
 */
function deduplicateTokens(tokens) {
  const seen = new Map();
  const deduplicated = [];

  // First pass: add all popular tokens
  tokens.forEach(token => {
    if (POPULAR_TOKENS.includes(token.address)) {
      if (!seen.has(token.address)) {
        seen.set(token.address, true);
        deduplicated.push(token);
      }
    }
  });

  // Second pass: add remaining tokens
  tokens.forEach(token => {
    if (!seen.has(token.address)) {
      seen.set(token.address, true);
      deduplicated.push(token);
    }
  });

  return deduplicated;
}

/**
 * Remove wrapped SOL duplicates - keep only official
 */
function filterWrappedSOL(tokens) {
  const OFFICIAL_SOL = 'So11111111111111111111111111111111111111112';

  return tokens.filter(token => {
    // Remove any SOL/WSOL that's not the official address
    if ((token.symbol === 'SOL' || token.symbol === 'WSOL' || token.symbol.includes('SOL')) &&
        token.address !== OFFICIAL_SOL) {
      return false;
    }
    return true;
  });
}

/**
 * Main function - Build mega token list
 */
async function buildMegaTokenList() {
  console.log('🚀 Starting MEGA Token List Build...');
  console.log('📊 Sources:', SOURCES.length);
  console.log('');

  const allTokens = [];

  // Fetch from all sources in parallel
  const results = await Promise.all(
    SOURCES.map(source => fetchSource(source))
  );

  // Combine all results
  results.forEach(tokens => {
    tokens.forEach(token => {
      allTokens.push(normalizeToken(token));
    });
  });

  console.log('');
  console.log(`📦 Total tokens fetched: ${allTokens.length}`);

  // Filter wrapped SOL duplicates
  const filteredTokens = filterWrappedSOL(allTokens);
  console.log(`🔍 After filtering wrapped SOL: ${filteredTokens.length}`);

  // Deduplicate by address
  const uniqueTokens = deduplicateTokens(filteredTokens);
  console.log(`✨ After deduplication: ${uniqueTokens.length}`);

  // Build final token list
  const tokenList = {
    name: 'Tenet Wallet - MEGA Token List',
    description: 'Combined from Solana Labs + Jupiter (verified + strict)',
    timestamp: new Date().toISOString(),
    version: {
      major: 1,
      minor: 0,
      patch: Date.now()
    },
    sources: SOURCES.map(s => s.name),
    tokens: uniqueTokens,
    count: uniqueTokens.length
  };

  // Write to file
  const outputPath = 'tokens.json';
  fs.writeFileSync(outputPath, JSON.stringify(tokenList, null, 2));

  console.log('');
  console.log('✅ MEGA Token List built successfully!');
  console.log(`📁 Output: ${outputPath}`);
  console.log(`📊 Total unique tokens: ${tokenList.count}`);
  console.log('');
  console.log('📈 Breakdown:');
  SOURCES.forEach((source, i) => {
    console.log(`   - ${source.name}: ${results[i].length} tokens`);
  });

  return tokenList;
}

// Run the script
buildMegaTokenList()
  .then(() => {
    console.log('');
    console.log('🎉 All done! Token list ready to deploy.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
