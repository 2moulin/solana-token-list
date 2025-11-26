# Solana Token List - Automated Discovery System

Comprehensive, automatically-updated list of Solana SPL tokens with maximum coverage and real-time trending tokens.

## 🚀 Features

- **14,400+ DexScreener queries per day** - Maximum token discovery
- **48 automated scans daily** (every 30 minutes)
- **300 search queries per scan** - 3x more coverage than standard implementations
- **Real-time trending tokens** - Top 33 tokens updated 3x daily
- **Multi-source aggregation** - DexScreener, Raydium, Orca, Jupiter
- **Incremental discovery** - Only fetches new tokens to avoid duplicates
- **100% automated** - GitHub Actions handles everything
- **Free forever** - No API costs, unlimited GitHub Actions for public repos

## 📊 Current Stats

- **Total tokens**: 13,700+ and growing
- **Update frequency**: Every 30 minutes (48x/day)
- **Discovery rate**: ~98% efficiency
- **Sources**: 5 major DEXs and token platforms

## 🔥 Live Token List

Access the always-up-to-date token list at:

```
https://2moulin.github.io/solana-token-list/tokens.json
```

## 📦 Usage

### JavaScript/TypeScript

```javascript
const response = await fetch('https://2moulin.github.io/solana-token-list/tokens.json');
const data = await response.json();

// Access all tokens
const tokens = data.tokens;

// Access trending tokens (top 33)
const trending = data.popularTokens;

console.log(`Loaded ${tokens.length} tokens`);
console.log(`Trending: ${trending.length} tokens`);
```

### React Example

```typescript
import { useEffect, useState } from 'react';

function TokenList() {
  const [tokens, setTokens] = useState([]);
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    fetch('https://2moulin.github.io/solana-token-list/tokens.json')
      .then(res => res.json())
      .then(data => {
        setTokens(data.tokens);
        setTrending(data.popularTokens);
      });
  }, []);

  return (
    <div>
      <h2>Trending Tokens ({trending.length})</h2>
      {/* Render trending tokens first */}

      <h2>All Tokens ({tokens.length})</h2>
      {/* Render all tokens */}
    </div>
  );
}
```

## 🏗️ Architecture

### Discovery System

**Phase 1: Static Sources** (cached)
- Solana Labs official list
- Jupiter aggregated list

**Phase 2: Dynamic Discovery** (every 30 min)
- 300 DexScreener search queries
- Raydium pools
- Orca whirlpools

**Trending Tokens** (updated 3x/day at 8h, 12h, 20h UTC)
- Top 33 tokens by 24h volume
- Hardcoded essentials (SOL, USDC, USDT, etc.)

### Search Categories

The system queries 300 diverse keywords across all niches:
- **DeFi**: lending, yield, staking, protocols
- **Memecoins**: animals, food, space themes
- **Gaming**: play-to-earn, NFTs, metaverse
- **AI/Data**: machine learning, oracles, storage
- **Regional**: multi-language, global coverage
- **Trending**: viral keywords, hype terms

## 🔒 Security

- No API keys required (public endpoints only)
- Automated via GitHub Actions (no manual intervention)
- Read-only operations (never modifies blockchain)
- No sensitive data stored

## ⚙️ Automation

Fully automated via GitHub Actions:
- **Schedule**: Every 30 minutes (`*/30 * * * *`)
- **Manual trigger**: Available via workflow_dispatch
- **Auto-commit**: Commits changes automatically when new tokens are found
- **Rate limiting**: 240 requests/minute (safe under 300/min DexScreener limit)

## 📈 Performance

**Daily Statistics:**
- 48 scans per day
- ~14,445 API requests per day
- ~450-500 new tokens discovered daily (initially)
- 1.5 minutes per scan
- 100% uptime via GitHub Actions

**Cost:** $0 (GitHub Actions free for public repos)

## 🛠️ Local Development

```bash
# Install dependencies
npm install @solana/web3.js

# Run discovery script
node scripts/update-token-list.js

# Output: tokens.json (3MB+)
```

## 📝 Token Format

```json
{
  "name": "Solana Token List",
  "timestamp": "2025-11-25T19:00:00.000Z",
  "version": {
    "major": 1,
    "minor": 0,
    "patch": 1732564800000
  },
  "popularTokens": [
    "So11111111111111111111111111111111111111112",
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    ...
  ],
  "tokens": [
    {
      "address": "So11111111111111111111111111111111111111112",
      "symbol": "SOL",
      "name": "Wrapped SOL",
      "decimals": 9,
      "chainId": 101,
      "logoURI": "https://...",
      "volume24h": 1234567.89,
      "liquidity": 9876543.21
    },
    ...
  ],
  "count": 13743
}
```

## 📄 License

MIT - Feel free to use in any project

## 🤝 Contributing

This is an automated system. To suggest improvements:
1. Open an issue
2. Describe the enhancement
3. Wait for automated updates to incorporate changes

## 🔗 Links

- **Live Token List**: https://2moulin.github.io/solana-token-list/tokens.json
- **GitHub Repository**: https://github.com/2moulin/solana-token-list
- **GitHub Actions**: Automated workflows run every 30 minutes

---

**Powered by**: DexScreener, Raydium, Orca, Jupiter, Solana Labs
**Maintained by**: Automated GitHub Actions
**Updated**: Every 30 minutes, 24/7
