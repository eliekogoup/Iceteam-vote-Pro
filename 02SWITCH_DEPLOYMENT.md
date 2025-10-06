# Configuration 02switch - Export statique

## ⚠️ Limitations importantes

02switch est un hébergement mutualisé qui ne supporte pas Node.js nativement.
Nous devons créer un export statique de l'application Next.js.

### Fonctionnalités qui NE MARCHERONT PAS :
- ❌ API Routes (`/api/*`)
- ❌ Server-Side Rendering (SSR)
- ❌ Authentication côté serveur
- ❌ Fonctions serverless

### Fonctionnalités qui MARCHERONT :
- ✅ Pages statiques
- ✅ Client-side routing
- ✅ Authentification côté client (Supabase)
- ✅ Styles CSS/Tailwind

## Configuration nécessaire

### 1. Modifier next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://votre-domaine.com' : ''
}

module.exports = nextConfig
```

### 2. Build pour 02switch

```bash
npm run build
```

Le dossier `out/` contient les fichiers à uploader sur 02switch.

### 3. Upload sur 02switch

- Uploader le contenu du dossier `out/` dans le dossier `www/` de 02switch
- Configurer les redirections .htaccess si nécessaire

## Variables d'environnement

Créer un fichier `.env.production` :

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Recommandation

**Azure Static Web Apps est fortement recommandé** car il supporte toutes les fonctionnalités de votre application sans compromis.