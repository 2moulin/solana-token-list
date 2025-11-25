// Token List Crawler - Fetches all Solana tokens with metadata
// Runs daily via GitHub Actions

const { Connection, PublicKey } = require('@solana/web3.js');
const fs = require('fs');

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '59601059-d3d2-4170-9a1d-ccb7f2415393';
const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// Token Program ID
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

// Popular tokens to prioritize
const POPULAR_TOKENS = [
  'So11111111111111111111111111111111111111112', // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // JUP
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', // PYTH
  'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL', // JTO
];

async function fetchTokenMetadata(mintAddresses) {
  console.log(`Fetching metadata for ${mintAddresses.length} tokens...`);

  try {
    const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'metadata-batch',
        method: 'getAssetBatch',
        params: {
          ids: mintAddresses
        }
      })
    });

    if (!response.ok) {
      console.error('Helius API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error('Error fetching metadata:', error.message);
    return [];
  }
}

async function getAllTokenMints(connection) {
  console.log('Fetching all token mints from Solana blockchain...');

  try {
    // This is a heavy query - fetches all token mints
    // In production, you might want to use a more efficient approach
    const accounts = await connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
      filters: [
        { dataSize: 165 }, // Mint account size
      ],
      dataSlice: { offset: 0, length: 0 }, // We only need the pubkey
    });

    console.log(`Found ${accounts.length} token mints`);
    return accounts.map(account => account.pubkey.toBase58());
  } catch (error) {
    console.error('Error fetching token mints:', error.message);
    return [];
  }
}

async function buildTokenList() {
  console.log('Starting token list build...');
  console.log(`Using RPC: ${RPC_URL}`);

  const connection = new Connection(RPC_URL, 'confirmed');

  // Strategy: Use Solana Labs token list as base, then augment with new tokens
  console.log('Fetching Solana Labs token list...');

  let baseTokenList = [];
  try {
    const response = await fetch('https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json');
    const data = await response.json();
    baseTokenList = data.tokens || [];
    console.log(`Loaded ${baseTokenList.length} tokens from Solana Labs list`);
  } catch (error) {
    console.error('Error loading base list:', error.message);
  }

  // For now, just use the base list (querying all tokens is too expensive)
  // In future, you can add logic to discover new tokens

  const tokenList = {
    name: 'Tenet Wallet Token List',
    timestamp: new Date().toISOString(),
    version: {
      major: 1,
      minor: 0,
      patch: Date.now()
    },
    tokens: baseTokenList,
    count: baseTokenList.length
  };

  // Write to file
  const outputPath = 'tokens.json';
  fs.writeFileSync(outputPath, JSON.stringify(tokenList, null, 2));
  console.log(`✅ Token list written to ${outputPath}`);
  console.log(`📊 Total tokens: ${tokenList.count}`);

  return tokenList;
}

// Run the script
buildTokenList()
  .then(() => {
    console.log('✅ Token list build completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error building token list:', error);
    process.exit(1);
  });
