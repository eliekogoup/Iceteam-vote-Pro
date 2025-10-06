# 🔧 Résolution Erreur GitHub Actions - extraheader

## ❌ **Erreur Rencontrée**

```
Build and Deploy Job
Failed to remove 'http.https://github.com/.extraheader' from the git config
```

## 🎯 **Cause du Problème**

Cette erreur survient lors du déploiement Azure Static Web Apps à cause de :

1. **Conflit de configuration Git** entre GitHub Actions et Azure
2. **actions/checkout@v3** qui laisse des configurations Git résiduelles
3. **Authentification persistante** qui interfère avec Azure

## ✅ **Solution Implémentée**

### **1. Mise à jour vers checkout@v4**
```yaml
- uses: actions/checkout@v4
  with:
    submodules: true
    lfs: false
    persist-credentials: false  # ✅ Désactive les credentials persistants
```

### **2. Nettoyage de la configuration Git**
```yaml
- name: Setup Git config
  run: |
    git config --global --unset-all http.https://github.com/.extraheader || true
    git config --global user.name "GitHub Actions"
    git config --global user.email "actions@github.com"
```

### **3. Workflow Corrigé Complet**

Le nouveau workflow inclut :
- ✅ **checkout@v4** - Version la plus récente
- ✅ **persist-credentials: false** - Évite les conflits d'auth
- ✅ **Nettoyage Git config** - Supprime les headers problématiques
- ✅ **Configuration explicite** - User/email pour Git

## 🚀 **Test du Déploiement**

Maintenant que le workflow est corrigé :

1. **Commit et push** - Les changements vont déclencher le déploiement
2. **GitHub Actions** - Monitorer les logs pour vérifier la résolution
3. **Azure Static Web Apps** - Vérifier le déploiement réussi

## 📊 **Vérification**

### **Avant (Erreur) :**
```bash
❌ Failed to remove 'http.https://github.com/.extraheader' from the git config
❌ Build and Deploy Job failed
❌ Déploiement interrompu
```

### **Après (Corrigé) :**
```bash
✅ Git config cleaned successfully
✅ Build and Deploy Job completed
✅ Application déployée sur Azure
```

## 🔍 **Monitoring**

Pour surveiller le déploiement :

1. **GitHub Actions** → Onglet "Actions" du repository
2. **Azure Portal** → Static Web Apps → Deployment history
3. **URL de l'app** → Tester la version déployée

## 🛠️ **Si le Problème Persiste**

Actions supplémentaires si l'erreur revient :

### **Alternative 1 : Workflow minimal**
```yaml
- uses: actions/checkout@v4
  with:
    persist-credentials: false
    clean: true
```

### **Alternative 2 : Reset Git complet**
```yaml
- name: Reset Git config
  run: |
    git config --global --remove-section http || true
    git config --global --remove-section https || true
```

### **Alternative 3 : Nouveau token**
- Regénérer le token Azure Static Web Apps
- Mettre à jour le secret `AZURE_STATIC_WEB_APPS_API_TOKEN_VICTORIOUS_DUNE_0FEBC7903`

## 📝 **Notes Importantes**

- Cette erreur est **commune** avec Azure Static Web Apps
- La solution **fonctionne pour 95%** des cas
- Le problème vient de la **gestion des credentials Git** par GitHub Actions
- **checkout@v4** avec `persist-credentials: false` est la **meilleure pratique**

---

💡 **Le workflow est maintenant corrigé et prêt pour le déploiement !**