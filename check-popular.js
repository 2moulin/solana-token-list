const fs = require('fs');

const data = JSON.parse(fs.readFileSync('tokens.json', 'utf8'));

console.log('✅ popularTokens exists:', 'popularTokens' in data);
console.log('✅ popularTokens length:', data.popularTokens?.length || 0);
console.log('\nFirst 10 popular tokens:');

data.popularTokens?.slice(0, 10).forEach((addr, i) => {
  const token = data.tokens.find(t => t.address === addr);
  console.log(`  ${i+1}. ${token?.symbol || 'UNKNOWN'} - ${addr.substring(0, 8)}...`);
});
