const https = require('https');

const fetchJson = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Parse error: ' + data.substring(0, 100) + '...'));
        }
      });
    }).on('error', reject);
  });
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchTop50PopularTokens() {
  console.log('🔥 Fetching top 50 popular tokens by market cap...');

  try {
    const categories = [
      'solana-meme-coins',
      'solana-ecosystem',
    ];

    const allTopTokens = [];
    const seen = new Set();

    for (const category of categories) {
      try {
        const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=${category}&order=market_cap_desc&per_page=50&page=1&sparkline=false`;
        console.log('  Fetching:', category);
        const data = await fetchJson(url);

        data.forEach(coin => {
          const solAddress = coin.platforms?.solana;
          if (solAddress && !seen.has(solAddress)) {
            seen.add(solAddress);
            allTopTokens.push({
              address: solAddress,
              symbol: coin.symbol?.toUpperCase(),
              name: coin.name,
              marketCap: coin.market_cap || 0
            });
          }
        });

        console.log(`  ✅ Got ${data.length} tokens from ${category}`);
        await sleep(2000); // 2 second delay
      } catch (error) {
        console.error(`  ❌ Error fetching ${category}:`, error.message);
      }
    }

    const top50 = allTopTokens
      .sort((a, b) => b.marketCap - a.marketCap)
      .slice(0, 50)
      .map(t => t.address);

    console.log(`✅ Loaded ${top50.length} top tokens by market cap`);
    console.log('First 10:', JSON.stringify(top50.slice(0, 10), null, 2));

    return top50;

  } catch (error) {
    console.error('❌ Failed to fetch top 50, using fallback list:', error.message);

    const fallback = [
      'So11111111111111111111111111111111111111112', // SOL
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
      'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // JUP
      'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
      'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', // PYTH
      'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL', // JTO
    ];

    console.log('Using fallback list:', fallback.length, 'tokens');
    return fallback;
  }
}

fetchTop50PopularTokens().then((result) => {
  console.log('\n✅ DONE! Got', result.length, 'popular tokens');
});
