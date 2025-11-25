# Solana Token List

Automated token list for Tenet Wallet. Updates daily via GitHub Actions.

## 🚀 How it works

1. GitHub Actions runs daily at 2 AM UTC
2. Crawler script fetches all Solana tokens
3. Generates `tokens.json` with metadata
4. Auto-commits and pushes to repo
5. GitHub Pages serves the JSON file

## 📊 Usage

The token list is available at:
```
https://[YOUR-USERNAME].github.io/solana-token-list/tokens.json
```

## 🔧 Setup

1. Create a new **public** GitHub repository
2. Push this code to the repo
3. Enable GitHub Pages:
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` / `root`
4. Add GitHub Secret:
   - Go to Settings → Secrets and variables → Actions
   - Add `HELIUS_API_KEY` with your Helius API key
5. Trigger the workflow manually or wait for daily run

## 📝 Token List Format

```json
{
  "name": "Tenet Wallet Token List",
  "timestamp": "2025-01-15T02:00:00.000Z",
  "version": {
    "major": 1,
    "minor": 0,
    "patch": 1737766800000
  },
  "tokens": [
    {
      "address": "So11111111111111111111111111111111111111112",
      "symbol": "SOL",
      "name": "Solana",
      "decimals": 9,
      "chainId": 101,
      "logoURI": "https://..."
    }
  ],
  "count": 30000
}
```

## 🔒 Security

- Repo can be public (just token data)
- No sensitive information stored
- GitHub Actions secrets for API keys
- Auto-updates without manual intervention

## 📈 Cost

**$0.00 per month**
- GitHub Actions: 2000 min/month free
- GitHub Pages: Free hosting
- Daily updates: ~2 min/day = 60 min/month

## 🛠️ Manual Update

To manually trigger an update:
```bash
npm install
npm run build
```

Or trigger via GitHub Actions:
- Go to Actions tab
- Select "Update Token List"
- Click "Run workflow"
