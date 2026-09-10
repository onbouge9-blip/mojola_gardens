# Mojola Gardens — Backend

API + base de données (SQLite) pour centraliser les **réservations**, **commandes** et **messages** reçus depuis le site, accessibles depuis n'importe quel appareil via le tableau de bord `admin.html`.

## Ce que ça remplace

Avant : les données étaient stockées dans le navigateur de chaque visiteur (localStorage) — invisibles pour vous.
Maintenant : chaque réservation/commande/message est envoyé à ce serveur et stocké dans une vraie base de données (`mojola.db`), consultable depuis `admin.html` peu importe l'appareil utilisé.

## 1. Installation locale (pour tester)

Prérequis : [Node.js](https://nodejs.org) version 18 ou plus.

```bash
cd mojola-backend
npm install
cp .env.example .env
```

Ouvrez `.env` et vérifiez/ajustez :
- `ADMIN_KEY` — doit être **exactement le même** que `ADMIN_PASSCODE` dans `mojola-gardens/js/admin.js`.
- `ALLOWED_ORIGINS` — laissez `*` pour tester en local.

Démarrez le serveur :

```bash
npm start
```

Vous devriez voir : `Mojola backend démarré sur http://localhost:4000`

Testez qu'il répond :

```bash
curl http://localhost:4000/api/health
# {"ok":true,"service":"mojola-backend"}
```

La base de données `mojola.db` est créée automatiquement au premier démarrage (fichier SQLite, rien à installer séparément).

## 2. Endpoints disponibles

| Méthode | Route                  | Accès  | Description                          |
|---------|-------------------------|--------|---------------------------------------|
| POST    | `/api/reservations`     | public | Créer une réservation                 |
| GET     | `/api/reservations`     | admin  | Lister toutes les réservations        |
| PATCH   | `/api/reservations/:id` | admin  | Changer le statut d'une réservation   |
| POST    | `/api/orders`           | public | Créer une commande                    |
| GET     | `/api/orders`           | admin  | Lister toutes les commandes           |
| PATCH   | `/api/orders/:id`       | admin  | Changer le statut d'une commande      |
| POST    | `/api/messages`         | public | Créer un message de contact           |
| GET     | `/api/messages`         | admin  | Lister tous les messages              |
| PATCH   | `/api/messages/:id`     | admin  | Changer le statut d'un message        |

Les routes **admin** exigent un en-tête HTTP `x-admin-key: <votre ADMIN_KEY>`. Le tableau de bord (`admin.html`) l'envoie automatiquement avec le code que vous saisissez à la connexion.

## 3. Brancher le site sur ce backend

Dans `mojola-gardens/js/script.js` et `mojola-gardens/js/admin.js`, tout en haut, vous trouverez :

```js
const MOJOLA_API_BASE = 'REPLACE_WITH_YOUR_BACKEND_URL/api';
```

Remplacez `REPLACE_WITH_YOUR_BACKEND_URL` par l'adresse réelle de votre backend :
- En local : `http://localhost:4000`
- Une fois déployé (étape 4) : l'URL fournie par votre hébergeur, ex. `https://mojola-backend.onrender.com`

Tant que cette valeur contient `REPLACE_WITH_YOUR_BACKEND_URL`, le site continue de fonctionner comme avant (stockage local uniquement) — rien ne casse si vous n'avez pas encore déployé le backend.

## 4. Déploiement (rendre le backend accessible en ligne)

Ce backend est un serveur Node.js classique. Je ne peux pas l'héberger moi-même, mais voici l'option la plus simple et gratuite pour démarrer :

### Option recommandée : Render.com
1. Créez un compte sur [render.com](https://render.com) et un dépôt Git (GitHub/GitLab) contenant ce dossier `mojola-backend/`.
2. Sur Render : **New +** → **Web Service** → connectez votre dépôt.
3. Render détecte Node.js automatiquement :
   - Build command : `npm install`
   - Start command : `npm start`
4. Dans l'onglet **Environment**, ajoutez les variables :
   - `ADMIN_KEY` = le même code que dans `admin.js`
   - `ALLOWED_ORIGINS` = l'URL où votre site est hébergé (ou `*` pour commencer)
5. Déployez. Render vous donne une URL du type `https://mojola-backend.onrender.com`.
6. Collez cette URL + `/api` dans `MOJOLA_API_BASE` (étape 3) et republiez votre site.

⚠️ Sur le plan gratuit de Render, le serveur "s'endort" après 15 min d'inactivité et met quelques secondes à redémarrer à la première requête — normal, pas un bug.

### Alternatives
- **Railway.app** — workflow très similaire à Render.
- **Un VPS** (Hostinger, DigitalOcean...) — plus de contrôle, nécessite de gérer vous-même le serveur (PM2, nginx, HTTPS).

### Important — la base de données SQLite et les hébergeurs gratuits
SQLite stocke tout dans un simple fichier (`mojola.db`) à côté du code. Sur certains hébergeurs gratuits (dont Render sans disque persistant payant), ce fichier peut être **réinitialisé à chaque redéploiement**. Pour une utilisation sérieuse à long terme, deux options :
1. Activer un disque persistant sur Render (payant, quelques dollars/mois), ou
2. Migrer vers une base hébergée gratuite comme [Supabase](https://supabase.com) (PostgreSQL) — je peux vous aider à adapter le code si vous choisissez cette voie.

## 5. Sauvegarder vos données

Le fichier `mojola.db` contient tout. Copiez-le régulièrement pour faire une sauvegarde :

```bash
cp mojola.db mojola-backup-$(date +%Y%m%d).db
```