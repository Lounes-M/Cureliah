# Cureliah

Une plateforme de mise en relation entre médecins et établissements de santé pour la gestion des vacations médicales.

## 🚀 Fonctionnalités

- **Planning Médical** : Interface de gestion des créneaux horaires avec FullCalendar
- **Gestion des Vacations** : Création, modification et suppression des vacations
- **Recherche Avancée** : Filtrage par spécialité, localisation, tarifs
- **Système de Réservation** : Réservation et gestion des rendez-vous
- **Profils** : Gestion des profils médecins et établissements
- **Administration** : Interface d'administration complète
- **Notifications** : Système de notifications en temps réel
- **Messagerie** : Communication entre médecins et établissements

## 🛠️ Technologies

- **Frontend** : React, TypeScript, TailwindCSS
- **Backend** : Supabase
- **Base de données** : PostgreSQL
- **Authentification** : Supabase Auth
- **Stockage** : Supabase Storage
- **Paiements** : Stripe
- **Calendrier** : FullCalendar

## 📋 Prérequis

- Node.js (v18 ou supérieur)
- npm ou yarn
- Compte Supabase
- Compte Stripe (pour les paiements)

## 🚀 Installation

1. Clonez le repository :
```bash
git clone https://github.com/Lounes-M/cureliah.git
cd cureliah
```

2. Installez les dépendances :
```bash
npm install
# ou
yarn install
```

3. Configurez les variables d'environnement :
```bash
cp .env.example .env
```
Remplissez les variables dans le fichier `.env` avec vos propres valeurs.

4. Lancez le serveur de développement :
```bash
npm run dev
# ou
yarn dev
```

## 📁 Structure du Projet

```
src/
├── components/         # Composants React
│   ├── admin/         # Composants d'administration
│   ├── establishment/ # Composants établissement
│   ├── vacation/      # Composants vacation
│   └── ui/           # Composants UI réutilisables
├── hooks/            # Custom hooks
├── integrations/     # Intégrations externes
├── pages/           # Pages de l'application
├── services/        # Services et API
├── styles/          # Styles globaux
└── types/           # Types TypeScript
```

## 🔧 Configuration

### Variables d'Environnement

```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_anon_supabase
VITE_STRIPE_PUBLIC_KEY=votre_clé_publique_stripe
```

### Base de Données

Les migrations Supabase sont disponibles dans le dossier `supabase/migrations/`.

## 🤝 Contribution

1. Fork le projet
2. Créez votre branche de fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'feat: Add some AmazingFeature'`)
4. Poussez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👥 Auteurs

- **Lounes Moumou** - *Développeur Principal*

## 🙏 Remerciements

- [Supabase](https://supabase.io)
- [FullCalendar](https://fullcalendar.io)
- [TailwindCSS](https://tailwindcss.com)
- [React](https://reactjs.org)
