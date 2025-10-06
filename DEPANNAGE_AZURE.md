# 🔧 Guide de dépannage Azure Static Web Apps

## 🚨 Problèmes courants et solutions

### ❌ Problème 1 : Application ne se charge pas du tout

**Symptômes :**
- Page blanche ou erreur 404
- "Cette page n'existe pas"
- Timeout de connexion

**Solutions à essayer :**

1. **Vérifier l'état du déploiement**
   ```bash
   # Aller sur GitHub → votre repo → Actions
   # Vérifier que le dernier workflow a réussi
   ```

2. **Vérifier les logs Azure**
   - Azure Portal → votre Static Web App
   - Menu "Fonctions" → "Surveillance"
   - Regarder les erreurs récentes

3. **Redéployer manuellement**
   - GitHub → Actions → "Re-run jobs"
   - Ou faire un nouveau commit pour déclencher le build

---

### ❌ Problème 2 : Erreurs d'authentification Supabase

**Symptômes :**
- "Impossible de se connecter"
- Erreurs dans la console : `Failed to fetch`
- Redirection infinie sur la page de login

**Solutions :**

1. **Vérifier les variables d'environnement**
   ```bash
   # Dans Azure Portal → Configuration → Paramètres d'application
   # Vérifier que ces variables existent et sont correctes :
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. **Vérifier l'URL Supabase**
   - Format correct : `https://votre-projet.supabase.co`
   - Pas de slash final `/`
   - Pas de sous-chemin `/auth` ou autre

3. **Tester la clé Supabase**
   ```bash
   # Ouvrir la console navigateur (F12)
   # Aller sur l'onglet Console
   # Coller et exécuter :
   console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
   console.log(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
   # Les valeurs doivent s'afficher correctement
   ```

---

### ❌ Problème 3 : Pages admin inaccessibles

**Symptômes :**
- "Accès refusé" sur les pages `/admin/*`
- Utilisateur connecté mais pas d'accès admin
- Erreurs de permissions

**Solutions :**

1. **Vérifier les droits utilisateur dans Supabase**
   ```sql
   -- Aller dans Supabase → SQL Editor
   -- Exécuter cette requête pour vérifier votre utilisateur :
   SELECT u.email, m.is_admin, m.is_active 
   FROM auth.users u
   JOIN members m ON u.id = m.user_id
   WHERE u.email = 'votre-email@exemple.com';
   ```

2. **Activer les droits admin**
   ```sql
   -- Si votre utilisateur n'est pas admin :
   UPDATE members 
   SET is_admin = true, is_active = true
   WHERE user_id = (
     SELECT id FROM auth.users 
     WHERE email = 'votre-email@exemple.com'
   );
   ```

3. **Vérifier les policies RLS**
   ```sql
   -- Vérifier que les policies permettent l'accès :
   SELECT schemaname, tablename, policyname, cmd, roles 
   FROM pg_policies 
   WHERE tablename = 'members';
   ```

---

### ❌ Problème 4 : Build échoue sur GitHub Actions

**Symptômes :**
- Workflow GitHub Actions en rouge (failed)
- Erreurs TypeScript
- Dépendances manquantes

**Solutions :**

1. **Lire les logs détaillés**
   - GitHub → Actions → cliquer sur le workflow échoué
   - Regarder la section "Build" pour voir l'erreur exacte

2. **Erreurs TypeScript communes**
   ```bash
   # Si erreur "Property does not exist" :
   # Ajouter des casts (as any) pour les propriétés dynamiques
   
   # Si erreur de dépendance manquante :
   npm install la-dependance-manquante
   git add package.json package-lock.json
   git commit -m "Fix: ajouter dépendance manquante"
   git push
   ```

3. **Tester le build localement**
   ```bash
   cd votre-projet
   npm install
   npm run build
   # Si ça échoue localement, corrigez avant de push
   ```

---

### ❌ Problème 5 : Styles CSS ne s'appliquent pas

**Symptômes :**
- Page sans style, aspect "brut"
- Tailwind CSS ne fonctionne pas
- Mise en page cassée

**Solutions :**

1. **Vérifier les imports CSS**
   ```typescript
   // Dans _app.tsx, vérifier que vous avez :
   import '../styles/globals.css'
   ```

2. **Vérifier la configuration Tailwind**
   ```javascript
   // tailwind.config.js doit exister et contenir :
   module.exports = {
     content: [
       "./src/pages/**/*.{js,ts,jsx,tsx}",
       "./src/components/**/*.{js,ts,jsx,tsx}",
     ],
     // ...
   }
   ```

3. **Forcer le recache**
   - Ctrl+Shift+R pour recharger sans cache
   - Ou ouvrir en navigation privée

---

### ❌ Problème 6 : Variables d'environnement ne se mettent pas à jour

**Symptômes :**
- Changement des variables Azure mais pas d'effet
- Anciennes valeurs encore utilisées

**Solutions :**

1. **Redémarrer l'application**
   - Azure Portal → votre Static Web App
   - Menu "Vue d'ensemble" → "Redémarrer"

2. **Vérifier la propagation**
   ```bash
   # Attendre 5-10 minutes après changement des variables
   # Puis tester à nouveau
   ```

3. **Forcer un nouveau déploiement**
   - Faire un commit vide pour déclencher un rebuild :
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push
   ```

---

## 🔍 Outils de diagnostic

### 1. Console navigateur (F12)
```javascript
// Tester la connectivité Supabase :
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

// Tester l'authentification :
import { supabase } from './lib/supabaseClient'
supabase.auth.getUser().then(console.log)
```

### 2. Logs Azure
- Azure Portal → votre Static Web App
- Menu "Fonctions" → "Surveillance"
- Regarder les erreurs et warnings

### 3. GitHub Actions
- Repository → Actions
- Cliquer sur le workflow pour voir les détails
- Chercher les erreurs en rouge

---

## 📞 Demander de l'aide

### Informations à fournir :
1. **URL de votre application Azure**
2. **Message d'erreur exact** (copier-coller)
3. **Logs GitHub Actions** (si build échoue)
4. **Console navigateur** (capture d'écran)
5. **Étapes pour reproduire** le problème

### Où demander de l'aide :
- [Support Azure](https://portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade)
- [GitHub Issues](https://github.com/eliekogoup/Iceteam-vote-Pro/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/azure-static-web-apps)

---

## ✅ Checklist de vérification rapide

Avant de demander de l'aide, vérifier :

- [ ] Variables d'environnement correctement configurées
- [ ] Dernier déploiement GitHub Actions a réussi
- [ ] Aucune erreur dans la console navigateur (F12)
- [ ] URL Supabase accessible dans un navigateur
- [ ] Utilisateur a les droits appropriés dans Supabase
- [ ] Pas de cache navigateur qui interfère

**Dans 90% des cas, le problème vient des variables d'environnement ou des droits utilisateur Supabase !**