# CAAP64 Anémomètre

Application mobile **iOS et Android** (React Native + Expo) qui affiche en direct les mesures de
l'anémomètre du **CAAP64** (station OpenWindMap n° 986) :
https://www.openwindmap.org/owm-986

## Fonctionnalités

- **En direct** : vitesse moyenne du vent (grosse lecture), min/max sur les 4 dernières minutes,
  direction sur une rose des vents (origine du vent + direction vers laquelle il souffle),
  échelle de Beaufort, état de la station (en ligne / hors ligne, SNR, dernier contact).
- **Temps réel** : réception des mesures via l'API Push (Socket.IO) d'OpenWindMap, en complément
  d'un rafraîchissement toutes les 60 s (limite de l'API Live) et du tirer-pour-rafraîchir.
- **Historique** : graphiques min/moyen/max sur 1 h, 2 h, 24 h, 48 h ou 7 jours (API Archive),
  avec rafale max et moyenne de la période.
- **Unités** : km/h, m/s ou nœuds (choix mémorisé).
- Liens vers la page OpenWindMap de la station et le site du CAAP64.

## Données

Toutes les données proviennent de l'API publique d'OpenWindMap (licence CC-BY 4.0, attribution
« (c) contributors of the Openwindmap wind network ») :

- Live : `GET https://api.openwindmap.org/v1/live-with-meta/986`
- Archive : `GET https://api.openwindmap.org/v1/archive/986?start=...&stop=now&format=json`
- Push : Socket.IO sur `https://api.openwindmap.org/v1/push` (événement `measurement`)

## Lancer le projet

```bash
npm install
npx expo start          # puis scanner le QR code avec Expo Go (Android/iOS)
npx expo start --android
npx expo start --ios    # build iOS natif : nécessite macOS, ou utiliser EAS
```

Toutes les dépendances utilisées (expo-router, react-native-svg, AsyncStorage, socket.io-client)
sont compatibles Expo Go ; pour la production, faire un build avec EAS :

```bash
npx eas-cli@latest build --profile production --platform all
```

## Vérifications

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
```

## Régénérer les icônes

```bash
node scripts/generate-icons.js
```

## CI et builds EAS

- `.github/workflows/ci.yml` : à chaque PR et chaque push sur `main`, exécute `npm ci`,
  `npx tsc --noEmit`, `npx expo lint` et un export Metro Android (smoke test du bundle).
- `.github/workflows/eas-build.yml` : build EAS déclenché manuellement (*Actions → EAS Build → Run workflow*),
  avec les profils définis dans `eas.json`. Nécessite le secret `EXPO_TOKEN` dans
  *Settings → Secrets and variables → Actions* (token créé sur https://expo.dev/settings/access-tokens).

Builds manuels en local :

```bash
npx eas-cli@latest login
npx eas-cli@latest device:register                        # enregistrer son iPhone (UDID) pour le profil development
npx eas-cli@latest build --profile development --platform ios
npx eas-cli@latest build --profile preview --platform all  # apk/aab + ipa internes (TestFlight)
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit --platform ios                   # TestFlight / App Store (compte Apple Developer requis)
```

### Premier build EAS (à faire une fois, sur ton Mac)

1. Se connecter avec le compte Expo (celui d'Expo Go, ex. `regisc`) — **tes identifiants ne sont jamais demandés ni stockés ailleurs que chez toi** :
   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest whoami    # doit afficher ton compte
   ```
2. Lier le projet à EAS (écrit le `projectId` dans `app.json` — committer ce changement ensuite) :
   ```bash
   npx eas-cli@latest build:configure
   ```
3. Premier build **Android** (aucun compte payant requis, produit un APK installable) :
   ```bash
   npx eas-cli@latest build --profile preview --platform android
   ```
   EAS génère automatiquement le keystore Android. À la fin, un **lien de téléchargement de l'APK** est affiché :
   copier ce lien dans le shortcode WordPress `apk="..."` (ou uploader l'APK dans *Médias* de caap64.fr).
4. Premier build **iOS** : nécessite un compte Apple Developer (99 $/an, [developer.apple.com](https://developer.apple.com)) — pendant le build, EAS demande ton Apple ID + un mot de passe d'application (généré sur [appleid.apple.com](https://appleid.apple.com) → Connexion et sécurité → Mots de passe d'application) :
   ```bash
   npx eas-cli@latest build --profile preview --platform ios
   npx eas-cli@latest submit --platform ios    # envoie sur App Store Connect → TestFlight
   ```
   Le lien TestFlight public (ou le lien d'invitation) va dans le shortcode `testflight="..."`.

### Builds automatiques via GitHub Actions

Ajouter le secret `EXPO_TOKEN` : [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens) → créer un token →
dans le dépôt GitHub : *Settings → Secrets and variables → Actions → New repository secret* → nom `EXPO_TOKEN`.
Ensuite *Actions → EAS Build → Run workflow* (profil `preview`, plateforme `all`). Le token ne doit jamais être partagé ni commité.

## Intégrer l'anémomètre et l'app sur caap64.fr (WordPress)

Trois méthodes, de la plus simple à la plus complète :

### Méthode 1 — plugin WordPress (recommandé)

Le dossier `wordpress/caap64-anemometre/` contient un plugin prêt à l'emploi.

**Télécharger le zip tout fait** (reconstruit automatiquement à chaque push sur `main`) :
https://github.com/z94k8mt9td-star/caap64-anemometre/releases/download/plugin-wordpress/caap64-anemometre-wp.zip

Ou le fabriquer soi-même depuis le dépôt :

```bash
cd wordpress
zip -r ../caap64-anemometre-wp.zip caap64-anemometre/
```

**Installation pas à pas sur caap64.fr** :

1. Connecte-toi à l'admin : https://caap64.fr/wp-admin
2. Menu **Extensions → Ajouter → Téléverser un plugin** → choisis `caap64-anemometre-wp.zip` → **Installer maintenant** → **Activer l'extension**
3. Menu **Pages → Ajouter une page**, titre : « Anémomètre »
4. Dans l'éditeur, ajoute un bloc **Shortcode** et tape : `[caap64_wind]`
5. Ajoute un deuxième bloc **Shortcode** et tape : `[caap64_app apk="https://caap64.fr/wp-content/uploads/caap64-anemometre.apk"]`
   - Pour l'APK : menu **Médias → Ajouter** → uploade le fichier APK obtenu via EAS → clique dessus → copie l'URL du fichier → colle-la dans `apk="..."`
   - Quand les liens App Store / TestFlight / Play seront prêts, ajoute-les : `appstore="..." testflight="..." play="..."`
6. **Publier** la page, puis menu **Apparence → Menus** → ajoute la page « Anémomètre » au menu principal
7. Vérifie le rendu en navigation privée (déconnecté) : https://caap64.fr/anemometre (ou l'URL choisie)

Les shortcodes :

- `[caap64_wind]` : carte du vent en direct (vitesse moyenne, min/max, rose des vents, échelle de Beaufort,
  état de la station), rafraîchie toutes les 60 s directement depuis l'API OpenWindMap (CORS ouvert, aucune clé).
  **Aucun serveur local requis** : chaque visiteur appelle l'API publique depuis son navigateur.
- `[caap64_app ...]` : boutons de téléchargement de l'app. Seuls les liens renseignés s'affichent.

### Méthode 1 bis — bloc Elementor prêt à copier-coller (sans plugin)

`web/elementor-block.html` : copier **tout le contenu** de ce fichier dans un widget **HTML** d'Elementor
(« Modifier avec Elementor » → + → recherche « html »). Le bloc affiche le vent en direct + les boutons
de téléchargement, et charge le CSS/JS depuis ce dépôt GitHub : aucun plugin requis. Remplacer les liens
placeholders (`XXXXXXXX` TestFlight, URL de l'APK) par les vrais liens une fois les builds EAS faits.

### Méthode 2 — page statique `web/`

Le dossier `web/` (`index.html` + `wind-widget.js` + `wind-widget.css`) est une page autonome :
vent en direct + boutons de téléchargement. Renseigner les liens dans `CAAP64_LINKS` en haut du script
de `index.html`, puis héberger le dossier (GitHub Pages, ou un sous-dossier de caap64.fr) et linker
la page depuis le menu WordPress.

### Méthode 3 — widget officiel OpenWindMap

Dans un bloc HTML personnalisé de WordPress :

```html
<script src="https://www.openwindmap.org/js/widget-v1.js"></script>
<div class="owm-widget" data-id="OWM986" data-show-live="yes" data-show-2h="yes"></div>
```

## Structure

```
src/
  app/                  # écrans (Expo Router)
    _layout.tsx         # provider d'unités + pile de navigation
    (tabs)/_layout.tsx  # onglets « En direct » / « Historique »
    (tabs)/index.tsx    # écran en direct
    (tabs)/history.tsx  # écran historique
  api/openwindmap.ts    # client typé de l'API OpenWindMap (live, archive, push)
  components/           # Compass, WindChart, UnitToggle
  context/              # unité de vent persistée (AsyncStorage)
  hooks/                # useLiveStation, useArchive
  utils/                # conversions, rose des vents, Beaufort, formats de date
```
