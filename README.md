# Levainier

Application mobile de minuterie pour boulangers, conçue pour gérer des protocoles de panification multi-étapes avec notifications, timeline visuelle et partage de recettes.

## Fonctionnalités

- **Protocoles structurés** — Créez des protocoles composés de sections et d'étapes minutées
- **Minuterie en temps réel** — Affichage du compte à rebours, de l'étape en cours et de l'heure de fin projetée
- **Notifications** — Alerte sonore et notification à chaque changement d'étape ou de section
- **Préréglages intégrés** — Deux protocoles inclus : Levain et Levure
- **Gestion des protocoles** — Sauvegardez, modifiez et réutilisez vos protocoles personnalisés
- **Partage** — Partagez un protocole via QR code, URL ou export JSON

## Stack technique

- [Expo](https://expo.dev) / React Native
- [Zustand](https://zustand-demo.pmnd.rs/) — gestion d'état
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) — persistance locale
- [React Navigation](https://reactnavigation.org/) — navigation
- `expo-camera` — scan QR
- `expo-av` — sons (cloche, alarme)
- `expo-notifications` — notifications

## Lancer le projet

```bash
npm install
npm start
```

Puis ouvrir dans Expo Go sur votre appareil, ou appuyer sur `a` pour Android / `i` pour iOS (simulateur).

## Build & distribution

Les builds Android (APK) sont générés automatiquement via GitHub Actions + [EAS Build](https://docs.expo.dev/build/introduction/) à chaque push sur `master`.

Les APKs sont disponibles sur [expo.dev/accounts/ermite/projects/levainier/builds](https://expo.dev/accounts/ermite/projects/levainier/builds).

### Lancer un build manuellement

```bash
eas build --platform android --profile preview
```

### Profils disponibles

| Profil | Format | Usage |
|---|---|---|
| `preview` | APK | Installation directe (sideload) |
| `production` | AAB | Google Play Store |
| `development` | APK | Dev client |
