# Solana Token List — Automated Discovery & Filtering

A self-hosted, automatically updated Solana token list powering the [Tenet Wallet](https://github.com/2moulin) Chrome extension.

## How It Works

1. **Discovery** (`tokens.json`) — Automated GitHub Actions scan 48x/day across multiple DEXs and token platforms to discover new SPL tokens
2. **Filtering** (`tokens-verified.json`) — A filter script removes dead/spam tokens and outputs a clean, verified list ready for wallet use

## Files

| File | Description | Size |
|------|-------------|------|
| `tokens.json` | Raw mega list — every token ever discovered | ~88k+ tokens |
| `tokens-verified.json` | Filtered list — tokens with logos only (alive projects) | ~20k tokens |

### `tokens.json` (raw)
The full unfiltered token list aggregated from all sources. Updated every 30 minutes via GitHub Actions.

### `tokens-verified.json` (filtered)
The curated list used by Tenet Wallet. Tokens pass if they meet **any** of these criteria:
- Have a logo URI (from any source — solana-labs, CoinGecko, DexScreener, etc.)
- Are in the hardcoded top ~100 Solana tokens by market cap

Tokens are excluded if:
- No logo (dead/abandoned projects)
- Not on mainnet (devnet/testnet tokens)

## Discovery Sources

- DexScreener (trending + search)
- Raydium pools
- Orca pools
- Jupiter token registry
- CoinGecko Solana ecosystem

## Stats

- **Discovery**: ~14,400 DexScreener queries/day
- **Update frequency**: Every 30 minutes (48x/day)
- **Discovery rate**: ~98% efficiency
- **100% automated** — GitHub Actions, free forever on public repos

## Usage

### As a token list
```
# Full list (raw, unfiltered)
https://2moulin.github.io/solana-token-list/tokens.json

# Verified list (filtered, recommended)
https://2moulin.github.io/solana-token-list/tokens-verified.json
```

### Re-generate the filtered list
```bash
node filter-tokens.js
# Output: tokens-verified.json
```

## Token Format

Each token entry follows the SPL token list standard:

```json
{
  "address": "So11111111111111111111111111111111111111112",
  "symbol": "SOL",
  "name": "Wrapped SOL",
  "decimals": 9,
  "chainId": 101,
  "logoURI": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
}
```

## License

MIT
