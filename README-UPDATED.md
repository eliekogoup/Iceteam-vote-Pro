# 🗳️ Iceteam Vote Pro - Système de Vote Collaboratif

Un système de vote moderne et complet utilisant **Next.js** et **Supabase** pour organiser des votes avec classement par glisser-déposer.

> 🚀 **Déployé sur Azure Container Apps** - Version stable v0.2

## ✨ Fonctionnalités

### 🎯 **Vote Interactif**
- **Glisser-déposer** pour classer les participants
- Interface intuitive et responsive
- Système anti-double vote
- Confirmation avant soumission

### 🛠️ **Administration Complète**
- **Dashboard admin** avec statistiques en temps réel
- **Gestion des groupes** : Créer, modifier, supprimer
- **Gestion des membres** : CRUD complet avec statuts admin
- **Gestion des éditions** : Configuration des sessions de vote
- **Gestion des questions** : Questions personnalisées
- **Association éditions/questions** flexible

### 📊 **Résultats et Analytics**
- **Page de résultats** avec podium et classements
- **Consultation détaillée des votes** avec tableau croisé
- **Calculs automatiques** des rangs moyens et points
- **Visualisations colorées** des classements

### 📥📤 **Import/Export**
- **Export CSV** de la liste des membres
- **Import CSV** pour ajout en masse de participants
- **Format standardisé** et validation des données

### 🎨 **Design Moderne**
- **Interface responsive** adaptée mobile/desktop
- **Thème cohérent** avec icônes et couleurs
- **Messages d'état** (succès, erreur, avertissement)
- **Navigation fluide** entre les sections

## 🚀 Déploiement

### 1. **Créer un projet Supabase**
- Aller sur [https://app.supabase.com](https://app.supabase.com/)
- Créer un nouveau projet
- Noter l'URL et la clé "anon public"

### 2. **Configuration base de données**
```sql
-- Tables principales (créer dans l'éditeur SQL de Supabase)

-- Table des groupes
CREATE TABLE groups (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des membres
CREATE TABLE members (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  group_id BIGINT REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des éditions
CREATE TABLE editions (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  group_id BIGINT REFERENCES groups(id) ON DELETE CASCADE,
  no_self_vote BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des questions
CREATE TABLE questions (
  id BIGSERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de liaison éditions/questions
CREATE TABLE editions_questions (
  id BIGSERIAL PRIMARY KEY,
  edition_id BIGINT REFERENCES editions(id) ON DELETE CASCADE,
  question_id BIGINT REFERENCES questions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(edition_id, question_id)
);

-- Table des votes
CREATE TABLE votes (
  id BIGSERIAL PRIMARY KEY,
  edition_id BIGINT REFERENCES editions(id) ON DELETE CASCADE,
  question_id BIGINT REFERENCES questions(id) ON DELETE CASCADE,
  voter_id BIGINT REFERENCES members(id) ON DELETE CASCADE,
  member_id BIGINT REFERENCES members(id) ON DELETE CASCADE,
  ranking INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. **Configuration du projet**
```bash
# Cloner le repository
git clone https://github.com/eliekogoup/Iceteam-vote-Pro.git
cd Iceteam-vote-Pro

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example.md .env.local
```

Éditer `.env.local` :
```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role
```

### 4. **Déploiement sur Vercel**
- Connecter le repository GitHub à [Vercel](https://vercel.com)
- Ajouter les variables d'environnement dans les settings Vercel
- Déployer automatiquement

### 5. **Créer un compte administrateur**
- Dans Supabase → Auth → Users → "Invite user"
- Créer un utilisateur avec email/mot de passe
- Dans la table `members`, ajouter un enregistrement avec `is_admin = true`

## 📋 Utilisation

### **Pour les administrateurs :**
1. Se connecter via `/login`
2. Accéder au dashboard admin via `/admin`
3. Créer des groupes et ajouter des membres
4. Créer des questions et des éditions
5. Associer questions et éditions
6. Consulter les résultats en temps réel

### **Pour les votants :**
1. Aller sur `/identite`
2. Sélectionner l'édition et s'identifier
3. Classer les participants par glisser-déposer
4. Valider le vote

## 🛠️ Technologies

- **Frontend :** Next.js 15, React 18, TypeScript
- **Backend :** Supabase (PostgreSQL + Auth + API)
- **UI/UX :** CSS custom responsive, react-beautiful-dnd
- **Déploiement :** Vercel + Supabase

## 📁 Structure du projet

```
src/
├── components/
│   └── AdminNav.tsx          # Navigation administrative
├── lib/
│   └── supabaseClient.ts     # Configuration Supabase
├── pages/
│   ├── _app.tsx              # Configuration Next.js
│   ├── index.tsx             # Page d'accueil
│   ├── identite.tsx          # Identification votant
│   ├── vote.tsx              # Interface de vote
│   ├── login.tsx             # Connexion
│   ├── admin/
│   │   ├── index.tsx         # Dashboard admin
│   │   ├── groupes.tsx       # Gestion groupes
│   │   ├── membres.tsx       # Gestion membres  
│   │   ├── editions.tsx      # Gestion éditions
│   │   ├── questions.tsx     # Gestion questions
│   │   ├── editions-questions.tsx # Associations
│   │   ├── votes.tsx         # Consultation votes
│   │   ├── resultats.tsx     # Résultats avec podium
│   │   └── import-export.tsx # Import/Export CSV
│   └── api/
│       └── admin-create-user.ts # API création utilisateurs
└── styles/
    └── globals.css           # Styles globaux
```

## 🔧 Personnalisation

### **Design**
- Modifier `src/styles/globals.css` pour personnaliser l'apparence
- Les icônes et couleurs sont facilement modifiables
- Interface responsive par défaut

### **Fonctionnalités**
- Ajouter de nouveaux types de questions
- Étendre les méthodes de calcul des résultats
- Intégrer d'autres systèmes d'authentification

## 🚦 Statut des fonctionnalités

✅ **Complètes :**
- Système de vote par glisser-déposer
- Administration complète (CRUD)
- Import/Export CSV
- Consultation des résultats avec podium
- Authentification et autorisations
- Interface responsive moderne

## 🆘 Support

Pour toute question ou aide :
1. Vérifier les logs dans la console développeur
2. Consulter les erreurs Supabase dans le dashboard
3. S'assurer que les variables d'environnement sont correctes

---

**Développé avec ❤️ pour faciliter l'organisation de votes collaboratifs**