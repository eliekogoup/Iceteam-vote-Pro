# Configuration Azure Static Web Apps

## Variables d'environnement requises

Dans Azure Portal > Static Web Apps > Configuration :

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Déploiement automatique

Ce projet est configuré pour le déploiement automatique sur Azure Static Web Apps via GitHub Actions.

### Étapes de configuration :

1. **Créer une ressource Azure Static Web Apps**
   - Aller sur portal.azure.com
   - Créer > Static Web Apps
   - Connecter le repository GitHub

2. **Configuration automatique**
   - Azure génère le workflow GitHub Actions
   - Build et déploiement automatiques

3. **Variables d'environnement**
   - Ajouter les variables Supabase dans Azure Portal
   - Configuration > Application settings

## Structure du projet

- **Framework**: Next.js 15.5.4
- **Styling**: Tailwind CSS
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Hosting**: Azure Static Web Apps

## Fonctionnalités supportées

✅ Server-Side Rendering (SSR)
✅ API Routes
✅ Authentication flow
✅ Variables d'environnement
✅ Domaine personnalisé
✅ SSL automatique