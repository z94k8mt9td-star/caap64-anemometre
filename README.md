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
