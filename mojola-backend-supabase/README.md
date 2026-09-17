# Mojola Gardens — backend Supabase

Le site n'utilise plus le serveur Node.js sur Render (`mojola-backend/`) : il
parle désormais directement à Supabase depuis le navigateur. Plus de serveur
à héberger séparément, plus de veille après 15 min d'inactivité.

## 1. Créer le projet

1. Allez sur https://supabase.com → créez un compte gratuit → **New project**
2. Notez le mot de passe de la base (pas besoin de vous en souvenir après)
3. Attendez ~2 min que le projet soit prêt

## 2. Créer les tables

1. Dans le menu de gauche : **SQL Editor** → **New query**
2. Ouvrez le fichier `schema.sql` (à côté de ce README), copiez tout son
   contenu, collez-le dans l'éditeur
3. Cliquez **Run**. Vous devriez voir "Success. No rows returned."

## 3. Créer votre compte admin

1. Menu de gauche : **Authentication** → **Users** → **Add user** → **Create new user**
2. Email : `admin@mojolagardens.com` (ou une autre adresse si vous préférez —
   il faudra le reporter à l'étape 5)
3. Mot de passe : choisissez-en un solide — **c'est lui qui remplace le code
   d'accès au dashboard**
4. Cochez **Auto Confirm User** (sinon Supabase attend une confirmation par
   email qui ne partira jamais, vu que l'adresse n'est pas réelle)
5. Créez

## 4. Récupérer vos clés

1. Menu de gauche : **Settings** (⚙️) → **API**
2. Copiez :
   - **Project URL**
   - **anon public** (la clé publique — PAS la `service_role`, qui elle doit
     rester secrète)

## 5. Brancher le site

Dans `js/supabase-client.js`, remplacez les trois lignes en haut :

```js
const SUPABASE_URL = 'REPLACE_WITH_YOUR_SUPABASE_URL';       // → votre Project URL
const SUPABASE_ANON_KEY = 'REPLACE_WITH_YOUR_SUPABASE_ANON_KEY'; // → votre clé anon public
const SUPABASE_ADMIN_EMAIL = 'admin@mojolagardens.com';      // → l'email choisi à l'étape 3
```

Puis redéployez le site sur Netlify.

## 6. Tester

1. Ouvrez `admin.html` sur le site en ligne, connectez-vous avec le **mot de
   passe** choisi à l'étape 3 (pas l'email — un seul champ, comme avant)
2. Le bandeau doit passer au 🟢 "Connecté à la base de données en ligne"
3. Désactivez un produit → ouvrez `menu.html` depuis un autre appareil/navigateur
   → le produit doit apparaître indisponible partout

## Bon à savoir

- **Code de secours** : `MG_23dec_2026_Admin` fonctionne toujours si Supabase
  n'est pas configuré ou injoignable (mode local, données sur l'appareil
  uniquement) — pratique pour tester avant d'avoir terminé les étapes
  ci-dessus.
- **Gratuit** : le plan gratuit Supabase n'a pas de mise en veille comme
  Render — toujours disponible instantanément.
- **`mojola-backend/` (Render)** n'est plus nécessaire — vous pouvez
  supprimer ce service sur Render une fois Supabase testé et validé.
