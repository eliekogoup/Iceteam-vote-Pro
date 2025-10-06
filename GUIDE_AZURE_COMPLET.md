# 🚀 Guide complet : Déploiement Azure Static Web Apps

## 📋 Table des matières
1. [Prérequis](#prérequis)
2. [Création de la ressource Azure](#création-ressource-azure)
3. [Configuration GitHub](#configuration-github)
4. [Variables d'environnement](#variables-environnement)
5. [Déploiement automatique](#déploiement-automatique)
6. [Vérification et tests](#vérification-tests)
7. [Domaine personnalisé](#domaine-personnalisé)
8. [Dépannage](#dépannage)

---

## ✅ Prérequis

Avant de commencer, assurez-vous d'avoir :
- ✅ Un compte Azure actif
- ✅ Votre repository GitHub `Iceteam-vote-Pro` prêt
- ✅ Vos identifiants Supabase (URL et clé anonyme)
- ✅ Accès administrateur à votre compte Azure

---

## 🎯 Étape 1 : Création de la ressource Azure

### 1.1 Accéder au portail Azure
1. Ouvrir votre navigateur et aller sur **[portal.azure.com](https://portal.azure.com)**
2. Se connecter avec vos identifiants Azure
3. Une fois connecté, vous arrivez sur le tableau de bord Azure

### 1.2 Créer une nouvelle ressource
1. Cliquer sur **"Créer une ressource"** (bouton + en haut à gauche)
2. Dans la barre de recherche, taper : **"Static Web Apps"**
3. Sélectionner **"Static Web Apps"** dans les résultats
4. Cliquer sur **"Créer"**

### 1.3 Configuration de base
Remplir les informations suivantes :

**Onglet "De base" :**
- **Abonnement** : Sélectionner votre abonnement Azure
- **Groupe de ressources** : 
  - Cliquer sur "Créer nouveau"
  - Nom : `iceteam-vote-rg`
- **Nom** : `iceteam-vote-app`
- **Type de plan** : **Gratuit** (parfait pour commencer)
- **Région Azure Functions** : **West Europe** (recommandé pour l'Europe)
- **Région de déploiement** : **West Europe**

---

## 🔗 Étape 2 : Configuration GitHub

### 2.1 Connecter GitHub
Dans la section **"Détails du déploiement"** :

1. **Source** : Sélectionner **"GitHub"**
2. **Se connecter à GitHub** : Cliquer sur le bouton
   - Une fenêtre popup GitHub s'ouvre
   - Autoriser Azure à accéder à vos repositories
3. **Organisation** : Sélectionner votre nom d'utilisateur GitHub
4. **Repository** : Sélectionner **"Iceteam-vote-Pro"**
5. **Branche** : Sélectionner **"main"**

### 2.2 Configuration de build
1. **Présélections de build** : Sélectionner **"Next.js"**
2. **Emplacement de l'application** : Laisser **"/"**
3. **Emplacement de l'API** : Laisser vide (ou mettre **"api"** si vous avez des API routes)
4. **Emplacement de sortie** : Laisser vide (Next.js gère automatiquement)

### 2.3 Finaliser la création
1. Cliquer sur **"Examiner + créer"**
2. Vérifier toutes les informations
3. Cliquer sur **"Créer"**

⏱️ **Temps d'attente : 2-3 minutes** pour la création de la ressource.

---

## 🔐 Étape 3 : Variables d'environnement

### 3.1 Accéder à la configuration
1. Une fois la ressource créée, cliquer sur **"Accéder à la ressource"**
2. Dans le menu de gauche, cliquer sur **"Configuration"**
3. Vous verrez l'onglet **"Paramètres d'application"**

### 3.2 Ajouter les variables Supabase
Cliquer sur **"+ Ajouter"** pour chaque variable :

**Variable 1 :**
- **Nom** : `NEXT_PUBLIC_SUPABASE_URL`
- **Valeur** : Votre URL Supabase (ex: `https://votre-projet.supabase.co`)

**Variable 2 :**
- **Nom** : `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Valeur** : Votre clé anonyme Supabase

### 3.3 Sauvegarder
1. Cliquer sur **"Enregistrer"** en haut de la page
2. Confirmer l'enregistrement

---

## 🚀 Étape 4 : Déploiement automatique

### 4.1 Vérifier GitHub Actions
1. Aller sur votre repository GitHub : **github.com/eliekogoup/Iceteam-vote-Pro**
2. Cliquer sur l'onglet **"Actions"**
3. Vous devriez voir un workflow **"Azure Static Web Apps CI/CD"** en cours d'exécution

### 4.2 Suivre le déploiement
1. Cliquer sur le workflow en cours
2. Vous pouvez suivre les étapes :
   - ✅ Build Job
   - ✅ Deploy Job
3. **Temps total : 5-10 minutes**

### 4.3 Obtenir l'URL de votre application
1. Retourner sur Azure Portal
2. Dans votre ressource Static Web Apps
3. Dans l'**"Vue d'ensemble"**, vous verrez **"URL"**
4. C'est l'adresse de votre application ! (ex: `https://happy-rock-xyz.azurestaticapps.net`)

---

## ✅ Étape 5 : Vérification et tests

### 5.1 Tester l'application
1. Ouvrir l'URL de votre application
2. Vérifier que :
   - ✅ La page d'accueil se charge
   - ✅ Le design Tailwind fonctionne
   - ✅ La navigation est présente
   - ✅ Vous pouvez accéder à la page de login

### 5.2 Tester l'authentification
1. Aller sur `/login`
2. Essayer de vous connecter avec un compte Supabase
3. Vérifier que l'authentification fonctionne
4. Tester l'accès aux pages admin

### 5.3 En cas de problème
Si quelque chose ne fonctionne pas :
1. Vérifier les **"Journaux"** dans Azure Portal
2. Vérifier les variables d'environnement
3. Consulter la section [Dépannage](#dépannage)

---

## 🌐 Étape 6 : Domaine personnalisé (Optionnel)

### 6.1 Ajouter un domaine personnalisé
Si vous voulez utiliser votre propre domaine :

1. Dans Azure Portal → votre Static Web App
2. Menu de gauche → **"Domaines personnalisés"**
3. Cliquer sur **"+ Ajouter"**
4. Choisir **"Domaine personnalisé sur DNS externe"**
5. Entrer votre domaine (ex: `vote.mondomaine.com`)

### 6.2 Configuration DNS
Azure vous donnera des enregistrements DNS à ajouter :
- **Type** : CNAME
- **Nom** : vote (ou votre sous-domaine)
- **Valeur** : L'URL Azure fournie

### 6.3 Validation
- Azure vérifie automatiquement le domaine
- SSL est automatiquement configuré
- ⏱️ **Propagation DNS : 24-48h maximum**

---

## 🔧 Dépannage

### Problème : Application ne se charge pas
**Solutions :**
1. Vérifier les variables d'environnement dans Azure
2. Regarder les logs dans Azure Portal → Fonctions → Surveillance
3. Vérifier que le build GitHub Actions a réussi

### Problème : Authentification ne fonctionne pas
**Solutions :**
1. Vérifier que `NEXT_PUBLIC_SUPABASE_URL` est correct
2. Vérifier que `NEXT_PUBLIC_SUPABASE_ANON_KEY` est correct
3. Vérifier la configuration RLS dans Supabase

### Problème : Pages admin inaccessibles
**Solutions :**
1. Vérifier que vous êtes connecté
2. Vérifier que votre utilisateur a les droits admin dans Supabase
3. Vérifier les policies RLS dans Supabase

### Problème : Build échoue
**Solutions :**
1. Vérifier les erreurs dans GitHub Actions
2. Vérifier que toutes les dépendances sont dans package.json
3. Tester le build localement : `npm run build`

---

## 📞 Support

### Ressources utiles :
- 📖 [Documentation Azure Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/)
- 🐛 [GitHub Issues du projet](https://github.com/eliekogoup/Iceteam-vote-Pro/issues)
- 💬 [Support Azure](https://azure.microsoft.com/support/)

### Commandes utiles :
```bash
# Tester le build localement
npm run build

# Démarrer en mode développement
npm run dev

# Vérifier les variables d'environnement
echo $NEXT_PUBLIC_SUPABASE_URL
```

---

## 🎉 Félicitations !

Votre application Iceteam Vote Pro est maintenant déployée sur Azure Static Web Apps !

**Avantages de votre déploiement :**
- ✅ **Gratuit** jusqu'à 100GB/mois
- ✅ **SSL automatique** (HTTPS)
- ✅ **Déploiement automatique** à chaque push GitHub
- ✅ **Performance mondiale** avec CDN
- ✅ **Sauvegarde automatique** des versions
- ✅ **Surveillance intégrée**

**URL de votre application :** `https://votre-app.azurestaticapps.net`

🚀 **Votre application de vote est maintenant en production !**