# Iceteam Vote (Next.js + Supabase)

## Déploiement 🚀

1. **Créer un projet Supabase** (https://app.supabase.com)
   - Copier l’URL et la clé “anon public” dans `.env` (voir `.env.example`)
   - Coller le schéma SQL dans l’onglet SQL de Supabase

2. **Créer un repo GitHub avec ce code**

3. **Connecter ce repo à Vercel** (https://vercel.com)
   - Ajouter les variables d’environnement (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) dans les settings du projet Vercel

4. **Déployer** (Vercel se charge de tout)

5. **Créer un compte admin sur Supabase** (page Auth → Users → “Invite user”)

6. **Se connecter à /login avec cet email**

## Personnalisation du design

- Utilise Mantine, Material UI ou Chakra UI (ajoute via `package.json`)
- CSS dans `src/styles/globals.css`

## Import/export

- Tu pourras importer/exporter des CSV via l’admin (bientôt)

---

Tu n’as rien à installer en local, tout se fait en ligne !

Besoin d’aide ? Demande-moi ici.