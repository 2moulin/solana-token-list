# Solana Token List

Automated Solana SPL token discovery system. Scans multiple DEXs every 30 minutes and maintains a comprehensive token list.

## Stats

- **88,000+** tokens discovered
- **20,000+** verified (with logo)
- **48 scans/day** (every 30 min)
- **14,400 DexScreener queries/day**
- **5 sources**: DexScreener, Raydium, Orca, Jupiter, CoinGecko
- **0 API costs** — all free-tier endpoints

## Endpoints

```
https://2moulin.github.io/solana-token-list/tokens.json           # full list
https://2moulin.github.io/solana-token-list/tokens-verified.json  # filtered
```

## Filtering

`tokens-verified.json` keeps tokens that have a logo (any source). No logo = dead project = excluded.

```bash
node filter-tokens.js
```

## License

MIT
