# 🚀 Guide de Setup - Token List Automatique

## ✅ Ce qui a été créé

Tous les fichiers nécessaires sont dans `c:\Users\Admin\OneDrive\Bureau\solana-token-list\`:

```
solana-token-list/
├── .github/
│   └── workflows/
│       └── update-tokens.yml    # GitHub Actions workflow
├── scripts/
│   └── crawl-tokens.js         # Script de crawling des tokens
├── package.json                 # Dependencies Node.js
├── README.md                    # Documentation
├── .gitignore                   # Git ignore rules
└── SETUP_GUIDE.md              # Ce fichier
```

## 📝 ÉTAPES DE SETUP (10 minutes)

### 1️⃣ Créer le Repo GitHub (PUBLIC)

**Pourquoi public?**
- GitHub Pages gratuit seulement sur repos publics
- Le JSON est juste de la data publique (pas de secrets)
- Ton code de wallet reste dans un repo privé séparé

**Étapes:**

1. Va sur https://github.com/new
2. Nom du repo: `solana-token-list`
3. **⚠️ IMPORTANT**: Sélectionne **Public**
4. Ne crée PAS de README (on va push le nôtre)
5. Clique "Create repository"

### 2️⃣ Push le Code sur GitHub

Ouvre un terminal dans `c:\Users\Admin\OneDrive\Bureau\solana-token-list\`:

```bash
cd "c:\Users\Admin\OneDrive\Bureau\solana-token-list"

# Initialize git
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit: Automated Solana token list"

# Add remote (REMPLACE 'YOUR-USERNAME' avec ton username GitHub)
git remote add origin https://github.com/YOUR-USERNAME/solana-token-list.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3️⃣ Configurer GitHub Pages

1. Va sur ton repo GitHub: `https://github.com/YOUR-USERNAME/solana-token-list`
2. Clique sur **Settings** (en haut à droite)
3. Dans le menu de gauche, clique sur **Pages**
4. Sous "Build and deployment":
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/ (root)`
5. Clique **Save**

✅ GitHub Pages va maintenant servir tes fichiers à:
```
https://YOUR-USERNAME.github.io/solana-token-list/tokens.json
```

### 4️⃣ Ajouter le Secret Helius API Key

1. Va sur ton repo GitHub
2. Clique sur **Settings** → **Secrets and variables** → **Actions**
3. Clique **New repository secret**
4. Name: `HELIUS_API_KEY`
5. Value: `59601059-d3d2-4170-9a1d-ccb7f2415393` (ou ton API key)
6. Clique **Add secret**

### 5️⃣ Tester le Workflow GitHub Actions

**Option A: Trigger manuel (recommandé pour tester)**

1. Va sur ton repo GitHub
2. Clique sur l'onglet **Actions**
3. Clique sur "Update Token List" dans la liste de gauche
4. Clique **Run workflow** → **Run workflow**
5. Attends 2-3 minutes
6. ✅ Le workflow devrait être vert (succès)

**Option B: Attends le run automatique**

Le workflow run automatiquement:
- Chaque jour à 2 AM UTC
- À chaque push sur `main`

### 6️⃣ Vérifier que ça Fonctionne

Après que le workflow soit complété:

1. Va sur `https://YOUR-USERNAME.github.io/solana-token-list/tokens.json`
2. Tu devrais voir le JSON avec tous les tokens
3. Si ça marche pas immédiatement, attends 5-10 minutes (GitHub Pages prend du temps)

**Test dans le terminal:**
```bash
curl https://YOUR-USERNAME.github.io/solana-token-list/tokens.json
```

### 7️⃣ Mettre à Jour le Wallet

Dans ton wallet (`Solana-Wallet/src/core/services/jupiter.ts`):

1. Trouve la ligne avec `'https://YOUR-USERNAME.github.io/...'`
2. Remplace `YOUR-USERNAME` avec ton vrai username GitHub
3. Uncomment la ligne (enlève les `//`)

**Avant:**
```typescript
const endpoints = [
  // TODO: Update this URL with your GitHub username after repo setup
  // 'https://YOUR-USERNAME.github.io/solana-token-list/tokens.json',

  // Fallback to Solana Labs CDN
  'https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json',
```

**Après:**
```typescript
const endpoints = [
  // Your custom GitHub Pages token list (updated daily)
  'https://MON-USERNAME.github.io/solana-token-list/tokens.json',

  // Fallback to Solana Labs CDN
  'https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json',
```

### 8️⃣ Build et Teste le Wallet

```bash
cd "c:\Users\Admin\OneDrive\Bureau\Solana-Wallet"
npm run build
```

Ouvre le wallet et teste le Swap:
- Les tokens devraient loader rapidement
- Tu devrais avoir ~30,000 tokens
- Le search devrait fonctionner par nom/symbol

## 🎯 RÉSULTAT FINAL

### ✅ Ce que tu as maintenant:

1. **Repo GitHub public** avec token list
2. **GitHub Actions** qui update automatiquement 1x/jour
3. **GitHub Pages** qui serve le JSON gratuitement
4. **Ton wallet** qui fetch la liste de ton propre CDN
5. **Coût total**: $0.00/mois
6. **Scale**: Illimité (GitHub CDN handle millions de requests)

### 📊 Architecture:

```
GitHub Actions (2 AM daily)
    ↓
Crawl Solana + Helius API
    ↓
Generate tokens.json
    ↓
Commit & Push to GitHub
    ↓
GitHub Pages CDN
    ↓
Ton Wallet Extension (fetch 1x au load)
    ↓
Cache en IndexedDB
    ↓
User search instantané (local)
```

## 🔧 Maintenance

**Aucune maintenance nécessaire!**

- Updates automatiques 1x/jour
- Si un endpoint fail, fallback automatique
- Logs visibles dans GitHub Actions
- Aucun serveur à maintenir

## ⚠️ Troubleshooting

### Problème: GitHub Pages 404

**Solution:**
- Attends 10 minutes après la première activation
- Vérifie que `tokens.json` existe dans le repo
- Vérifie que GitHub Pages est enabled dans Settings

### Problème: Workflow fail

**Solution:**
- Check les logs dans Actions tab
- Vérifie que `HELIUS_API_KEY` secret est configuré
- Vérifie que le repo a les permissions d'écriture

### Problème: Token list vide

**Solution:**
- Le script utilise Solana Labs list comme base
- Si ça fail, il retourne les 8 tokens populaires en fallback
- Check les logs du workflow pour voir l'erreur

## 📈 Future Améliorations

Si tu veux améliorer plus tard:

1. **Plus de metadata**: Ajouter prix, market cap, etc.
2. **Filtres**: Ajouter tags, verified badges
3. **Multi-network**: Support devnet, testnet
4. **API endpoints**: Exposer d'autres endpoints (prix, stats)

## 💰 Coût Breakdown

| Service | Usage | Coût |
|---------|-------|------|
| GitHub Actions | 60 min/mois | $0 (2000 min free) |
| GitHub Pages | Unlimited | $0 (free) |
| Helius API | ~100 calls/jour | $0 (100k free) |
| **TOTAL** | | **$0.00/mois** |

## 🎉 C'est Tout!

Une fois setup, tout est automatique. Le token list se met à jour 1x/jour sans que tu touches rien.

**Questions? Check les logs dans GitHub Actions tab!**
