# ✅ Checklist Azure Static Web Apps - Iceteam Vote Pro

## 📋 Préparation (5 minutes)

- [ ] Compte Azure actif et fonctionnel
- [ ] Repository GitHub `Iceteam-vote-Pro` accessible
- [ ] Identifiants Supabase sous la main :
  - [ ] URL Supabase : `https://votre-projet.supabase.co`
  - [ ] Clé anonyme Supabase
- [ ] Navigateur ouvert sur [portal.azure.com](https://portal.azure.com)

---

## 🚀 Création ressource Azure (10 minutes)

### Étape 1 : Créer la ressource
- [ ] Se connecter à Azure Portal
- [ ] Cliquer "Créer une ressource"
- [ ] Rechercher "Static Web Apps"
- [ ] Cliquer "Créer"

### Étape 2 : Configuration de base
- [ ] **Abonnement** : Sélectionner votre abonnement
- [ ] **Groupe de ressources** : Créer `iceteam-vote-rg`
- [ ] **Nom** : `iceteam-vote-app`
- [ ] **Plan** : Gratuit
- [ ] **Région** : West Europe

### Étape 3 : GitHub
- [ ] **Source** : GitHub
- [ ] Autoriser Azure à accéder à GitHub
- [ ] **Repository** : `Iceteam-vote-Pro`
- [ ] **Branche** : `main`
- [ ] **Preset** : Next.js
- [ ] Cliquer "Créer"

---

## 🔐 Variables d'environnement (5 minutes)

- [ ] Aller dans la ressource créée
- [ ] Menu "Configuration" → "Paramètres d'application"
- [ ] Ajouter `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] Coller votre URL Supabase
- [ ] Ajouter `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] Coller votre clé anonyme
- [ ] Cliquer "Enregistrer"

---

## 🎯 Déploiement automatique (10 minutes)

- [ ] Aller sur GitHub → votre repository
- [ ] Onglet "Actions"
- [ ] Vérifier que le workflow Azure s'exécute
- [ ] Attendre la fin du déploiement (5-10 min)
- [ ] ✅ Build Job terminé
- [ ] ✅ Deploy Job terminé

---

## ✅ Tests de validation (5 minutes)

### Tests de base
- [ ] Récupérer l'URL Azure (dans Vue d'ensemble)
- [ ] Ouvrir l'URL dans un navigateur
- [ ] ✅ Page d'accueil se charge
- [ ] ✅ Design Tailwind visible
- [ ] ✅ Menu de navigation présent

### Tests d'authentification
- [ ] Aller sur `/login`
- [ ] Essayer de se connecter
- [ ] ✅ Connexion fonctionne
- [ ] ✅ Redirection après login
- [ ] Tester l'accès aux pages admin

---

## 🌐 Configuration avancée (Optionnel)

### Domaine personnalisé
- [ ] Menu "Domaines personnalisés"
- [ ] Ajouter votre domaine
- [ ] Configurer DNS chez votre hébergeur
- [ ] Attendre validation (24-48h)

### Surveillance
- [ ] Activer Application Insights
- [ ] Configurer les alertes
- [ ] Vérifier les métriques

---

## 🔧 En cas de problème

### Application ne charge pas
- [ ] Vérifier variables d'environnement
- [ ] Regarder les logs Azure
- [ ] Vérifier GitHub Actions

### Authentification échoue
- [ ] Vérifier URL Supabase
- [ ] Vérifier clé anonyme
- [ ] Tester connexion Supabase

### Build échoue
- [ ] Voir détails dans GitHub Actions
- [ ] Vérifier erreurs TypeScript
- [ ] Tester `npm run build` localement

---

## 🎉 Succès !

### Votre application est en ligne ! 🚀

- [ ] **URL Azure** : `https://votre-app.azurestaticapps.net`
- [ ] **Repository GitHub** : Déploiement automatique configuré
- [ ] **SSL** : Activé automatiquement
- [ ] **Variables** : Configurées et sécurisées
- [ ] **Performance** : CDN mondial activé

### Prochaines étapes
- [ ] Partager l'URL avec votre équipe
- [ ] Configurer domaine personnalisé si souhaité
- [ ] Surveiller les métriques d'utilisation
- [ ] Planifier les mises à jour futures

---

## 📱 Contacts utiles

- **Documentation Azure** : [docs.microsoft.com/azure/static-web-apps](https://docs.microsoft.com/azure/static-web-apps/)
- **Support Azure** : Via le portail Azure
- **Repository GitHub** : [github.com/eliekogoup/Iceteam-vote-Pro](https://github.com/eliekogoup/Iceteam-vote-Pro)

**Temps total estimé : 35 minutes**
**Coût : Gratuit (plan Free d'Azure)**

🎯 **Votre application de vote professionnelle est maintenant déployée sur Azure !**