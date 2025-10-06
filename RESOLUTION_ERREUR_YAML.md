# 🔧 Résolution Erreur YAML Workflow GitHub Actions

## ❌ **Erreur Rencontrée**

```
Invalid workflow file: .github/workflows/azure-static-web-apps-victorious-dune-0febc7903.yml#L1
You have an error in your yaml syntax
```

## 🎯 **Cause du Problème**

L'erreur YAML était due à :

1. **Duplication de contenu** - Le fichier contenait des lignes dupliquées
2. **Corruption du fichier** lors de la création/édition
3. **Mauvais encodage** ou caractères invisibles

### **Exemple de Corruption Détectée :**
```yaml
name: Azure Static Web Apps CI/CDname: Azure Static Web Apps CI/CD  # ❌ Duplication
on:on:  # ❌ Duplication
```

## ✅ **Solution Appliquée**

### **1. Suppression du Fichier Corrompu**
```bash
Remove-Item .github\workflows\azure-static-web-apps-victorious-dune-0febc7903.yml -Force
```

### **2. Recréation avec Syntaxe Correcte**
```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true
          lfs: false
          persist-credentials: false
```

### **3. Points Clés de la Syntaxe YAML :**

- ✅ **Indentation uniforme** (2 espaces)
- ✅ **Pas de duplication** de lignes
- ✅ **Encodage UTF-8** correct
- ✅ **Syntaxe des secrets** : `${{ secrets.NOM_SECRET }}`

## 🔍 **Validation YAML**

### **Outils de Vérification :**

1. **GitHub Actions Tab** - Vérification automatique
2. **YAML Validator Online** - https://yamlchecker.com/
3. **VS Code Extension** - YAML Language Support

### **Commandes de Test Local :**
```bash
# Vérifier la syntaxe basique
Get-Content .github\workflows\*.yml | Select-String "name:"

# Vérifier les tokens
Get-Content .github\workflows\*.yml | Select-String "secrets\."
```

## 🚀 **Workflow Corrigé et Fonctionnel**

Le nouveau workflow inclut :

- ✅ **Syntaxe YAML valide** - Pas d'erreurs de parsing
- ✅ **checkout@v4** - Version récente
- ✅ **persist-credentials: false** - Évite les conflits Git
- ✅ **Configuration Git** - Nettoyage des headers
- ✅ **Variables d'environnement** - Supabase correctement configuré

## 📊 **Résultat Attendu**

### **Avant (Erreur) :**
```
❌ Invalid workflow file
❌ YAML syntax error
❌ Déploiement bloqué
```

### **Après (Corrigé) :**
```
✅ Workflow file valid
✅ GitHub Actions running
✅ Azure deployment successful
```

## 🛠️ **Bonnes Pratiques YAML**

### **Structure Recommandée :**
```yaml
name: Nom du Workflow

on:
  push:
    branches: [main]

jobs:
  job_name:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Action Name
        run: command
```

### **Éviter les Erreurs Communes :**
- ❌ **Tabs** au lieu d'espaces
- ❌ **Indentation** incorrecte
- ❌ **Caractères spéciaux** non échappés
- ❌ **Quotes manquantes** pour les strings avec espaces

## 🔄 **Si le Problème Persiste**

### **Actions de Dépannage :**

1. **Copier un workflow fonctionnel** depuis GitHub
2. **Utiliser l'éditeur Azure** pour régénérer
3. **Valider avec yamllint** :
   ```bash
   pip install yamllint
   yamllint .github/workflows/
   ```

4. **Redéployer depuis Azure Portal** si nécessaire

---

💡 **Le workflow est maintenant syntaxiquement correct et prêt pour le déploiement !**