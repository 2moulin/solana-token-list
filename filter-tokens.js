#!/usr/bin/env node
// Filter the mega token list into a verified-only list
// Run: node filter-tokens.js
// Output: tokens-verified.json (push to GitHub Pages)

const fs = require('fs');
const https = require('https');

const SOURCE_URL = 'https://2moulin.github.io/solana-token-list/tokens.json';
const OUTPUT_FILE = 'tokens-verified.json';

// Top ~100 Solana tokens by market cap — always include these (even without logo)
const TOP_TOKENS = new Set([
  'So11111111111111111111111111111111111111112',   // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',   // JUP
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', // PYTH
  'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',   // JTO
  'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk',   // WEN
  'HhJpBhRRn4g56VsyLuT8DL5Bv31HkXqsrahTTUCZeZg4', // MYRO
  'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5',  // MEW
  'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82',  // BOME
  '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', // POPCAT
  '27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4', // JLP
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // RAY
  'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',   // ORCA
  'RENDUMPKiMiDGJPe2c3d6BRFiLcj4B3shXSH8mEM2Qg',  // RENDER
  'SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y',  // SHDW
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',  // mSOL
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', // jitoSOL
  'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1',  // bSOL
  'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC',  // AI16Z
  '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', // WBTC
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // WETH
  '5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm', // INF
  'DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ', // DUST
  'TNSRxcUxoT9xBG3de7PiJyTDYu7kskLqcpddxnEJAS6',  // TNSR
  'nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7',  // NOS
  'A6FibNQSeqWPMECn1RGiPAz5GG1M1fRQTiSmJrhonBCd', // HONEY
  'kinXdEcpDQeHPEuQnqmUgtYykqKGVFq6CeVX5iAHJq6',  // KIN
  'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux',  // HNT
  'FidaB69LoEvEHZJL2eJmSe46hkEJkMqqzDHEqTShSJep', // FIDA
  'SLNDpmoWTVADgEdndyvWzroNKZvt2Jhiggs4w7Bqf6u',   // SLND
  'StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT',  // STEP
  'MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey',  // MNDE
  'marinade:staked-sol',
]);

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { rejectUnauthorized: false }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching token list from GitHub...');
  const raw = await fetch(SOURCE_URL);
  const data = JSON.parse(raw);
  const tokens = data.tokens || [];
  const popular = new Set(data.popularTokens || []);

  console.log(`Total tokens in source: ${tokens.length}`);

  // Filter: has a logo (any source) + mainnet only
  // Having a logo = the project made the effort = alive
  const filtered = tokens.filter(t => {
    const isMainnet = (t.chainId || 101) === 101 || t.chainId === 103;
    if (!isMainnet) return false;

    const hasLogo = !!t.logoURI;
    const isTop = TOP_TOKENS.has(t.address) || popular.has(t.address);

    return hasLogo || isTop;
  });

  // Deduplicate by address (keep first occurrence)
  const seen = new Set();
  const unique = filtered.filter(t => {
    if (seen.has(t.address)) return false;
    seen.add(t.address);
    return true;
  });

  // Sort: popular first, then alphabetically
  unique.sort((a, b) => {
    const aTop = popular.has(a.address) || TOP_TOKENS.has(a.address);
    const bTop = popular.has(b.address) || TOP_TOKENS.has(b.address);
    if (aTop && !bTop) return -1;
    if (!aTop && bTop) return 1;
    return a.symbol.localeCompare(b.symbol);
  });

  const output = JSON.stringify(unique);
  fs.writeFileSync(OUTPUT_FILE, output);

  const sizeMB = (output.length / 1024 / 1024).toFixed(2);
  console.log(`\nFiltered: ${unique.length} tokens (${sizeMB} MB)`);
  console.log(`Output: ${OUTPUT_FILE}`);
  console.log(`\nPush this file to your GitHub Pages repo (solana-token-list)`);
}

main().catch(console.error);
