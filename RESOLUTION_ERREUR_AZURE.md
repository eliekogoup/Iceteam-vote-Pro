# 🔧 Résolution d'erreur : GitHub Actions Azure

## ❌ Erreur rencontrée
```
Failed to remove 'https://github.com/extraheader' from the git config
Build and Deploy Job - Failure
```

## 🔍 Cause du problème
Azure Static Web Apps essaie de créer automatiquement un workflow GitHub Actions, mais il y a un conflit avec la configuration git existante ou des workflows pré-existants.

## ✅ Solution appliquée

### 1. Workflow manuel créé
- Fichier : `.github/workflows/azure-static-web-apps-victorious-dune-0febc7903.yml`
- Configuration optimisée pour Next.js
- Variables d'environnement incluses

### 2. Configuration requise dans GitHub

Pour que ce workflow fonctionne, vous devez ajouter ces **secrets** dans votre repository GitHub :

#### Aller sur GitHub :
1. **Repository** → **Settings** → **Secrets and variables** → **Actions**
2. Cliquer sur **"New repository secret"**

#### Ajouter ces 3 secrets :

**Secret 1 :**
- **Name** : `AZURE_STATIC_WEB_APPS_API_TOKEN_VICTORIOUS_DUNE_0FEBC7903`
- **Value** : Token d'API Azure (à récupérer dans Azure Portal)

**Secret 2 :**
- **Name** : `NEXT_PUBLIC_SUPABASE_URL`
- **Value** : `https://gllqzajfkkvpwnyultiy.supabase.co`

**Secret 3 :**
- **Name** : `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsbHF6YWpma2t2cHdueXVsdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODczNjcsImV4cCI6MjA3NDY2MzM2N30.B5gXCuB2XCpT11W6unXPhFC2WX-2TsPsJA7PA32qK8E`

### 3. Récupérer le token Azure API

#### Dans Azure Portal :
1. Aller sur votre **Static Web App**
2. Menu **"Gérer les jetons de déploiement"**
3. Copier le **token d'API**
4. L'ajouter comme secret GitHub

### 4. Alternative : Recréer la ressource Azure

Si le problème persiste :

1. **Supprimer** la ressource Azure Static Web Apps actuelle
2. **Recréer** une nouvelle ressource en suivant le guide
3. Azure générera automatiquement un nouveau workflow sans conflit

## 🚀 Test du workflow

Une fois les secrets configurés :

1. **Push** ce commit vers GitHub
2. **Aller** sur GitHub → Actions
3. **Vérifier** que le workflow se lance automatiquement
4. **Suivre** les logs du déploiement

## 📋 Checklist de vérification

- [ ] Workflow file créé dans `.github/workflows/`
- [ ] Secret `AZURE_STATIC_WEB_APPS_API_TOKEN_VICTORIOUS_DUNE_0FEBC7903` ajouté
- [ ] Secret `NEXT_PUBLIC_SUPABASE_URL` ajouté
- [ ] Secret `NEXT_PUBLIC_SUPABASE_ANON_KEY` ajouté
- [ ] Token Azure API récupéré depuis Azure Portal
- [ ] Commit pushé vers GitHub
- [ ] Workflow GitHub Actions lancé

## 🔄 En cas d'échec persistant

**Option 1 : Nouveau repository**
- Créer un nouveau repository GitHub
- Copier les fichiers source uniquement
- Configurer Azure sur le nouveau repository

**Option 2 : Reset complet**
- Supprimer `.github/workflows/` existant
- Supprimer la ressource Azure
- Recommencer la configuration depuis zéro

**Option 3 : Déploiement manuel**
- Utiliser Azure CLI pour déployer
- Ou utiliser Vercel comme alternative

La solution avec le workflow manuel devrait résoudre le problème de conflit git !