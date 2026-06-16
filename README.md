# Puissance 4 — Neon Noir

Un jeu de Puissance 4 jouable dans le navigateur : **2 joueurs** ou **contre une IA** (minimax), avec un classement, des effets sonores synthétisés et un **commentaire des coups en direct**. Le tout dans un seul fichier HTML, sans build ni dépendance.

![Vanilla JS](https://img.shields.io/badge/vanilla-JS-f7df1e) ![No build](https://img.shields.io/badge/build-aucun-brightgreen) ![Tests](https://img.shields.io/badge/tests-25%20passing-success)

## ✨ Fonctionnalités

- **Deux modes** : joueur contre joueur, ou joueur contre IA.
- **IA à trois niveaux** : minimax + élagage alpha-bêta (profondeurs 2 / 4 / 7).
- **Commentaire en direct** : chaque coup est qualifié (victoire, blocage, menace, centre, coup simple) et narré à l'écran.
- **Classement** : score = `victoires × 3 + nuls`, joueur courant mis en évidence, persistance via `localStorage`.
- **Son** : effets générés à la volée avec la Web Audio API (dépose, victoire, nul, UI).
- **Accessibilité** : plateau jouable au **clavier** (← / → pour choisir la colonne, Entrée pour jouer) avec attributs ARIA.
- **Esthétique Neon Noir** : typographies Bebas Neue / DM Sans, halos lumineux, animations de chute.

## 🚀 Lancer le jeu

Le jeu fonctionne en ouvrant simplement le fichier :

```bash
# Ouvrir directement (un classement de démonstration intégré sert de repli)
xdg-open puissance4.html      # Linux
open puissance4.html          # macOS
```

Pour charger le classement depuis `data/players.json`, servir le dossier via un serveur local (le `fetch` ne fonctionne pas sous le protocole `file://`) :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000/puissance4.html
```

## 🧠 L'IA

L'IA utilise un **minimax avec élagage alpha-bêta**. L'évaluation repose sur :

- la détection directe du gagnant (`getWinner`) pour les positions terminales,
- une préférence de distance : gagner le plus tôt possible, perdre le plus tard possible,
- une heuristique positionnelle (fenêtres de 4 + contrôle du centre).

| Niveau    | Profondeur de recherche |
|-----------|:-----------------------:|
| Facile    | 2                       |
| Moyen     | 4                       |
| Difficile | 7                       |

## 🗂️ Structure

```
.
├── puissance4.html      # UI, styles et contrôleur (état, rendu, son, narration)
├── js/
│   └── engine.js        # Logique pure partagée : plateau, IA, analyse des coups
├── data/
│   └── players.json     # Classement de démonstration
└── tests/
    └── game.test.js     # Tests du moteur (sans navigateur)
```

Le module `js/engine.js` est chargé **à la fois** par le navigateur et par les tests Node : une seule source de vérité pour la logique de jeu et l'IA.

## ✅ Tests

Les tests couvrent la logique de plateau, la défense de l'IA, la détection du gagnant et l'analyse des commentaires — sur le code réellement embarqué.

```bash
node tests/game.test.js
```

## 🛠️ Stack

JavaScript vanilla · Web Audio API · `localStorage` · aucun framework, aucun outil de build.
