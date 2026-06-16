# Puissance 4 — Design Spec

**Date :** 2026-06-16  
**Fichier cible :** `puissance4.html` (fichier unique, aucune dépendance)

---

## 1. Architecture générale

Un fichier HTML unique contenant HTML, CSS et JS.

Trois modules logiques en JS :

- **Game** — état du plateau (`board[6][7]`, tour actuel, détection victoire/match nul)
- **Renderer** — met à jour le DOM à partir de l'état du jeu
- **AI** — algorithme minimax avec alpha-beta pruning, profondeur variable selon le niveau

**Flux d'un coup :**
```
clic colonne → Game.dropPiece() → Renderer.update()
  → si mode IA : [délai 400ms] → AI.getBestMove() → Game.dropPiece() → Renderer.update()
```

---

## 2. Modes de jeu

- **2 Joueurs en local** : deux personnes sur le même écran, tour par tour
- **Joueur vs IA** : un seul joueur contre l'ordinateur avec choix du niveau

Sélection du mode au démarrage via un menu.

---

## 3. Interface utilisateur

### Écran de démarrage (menu)
- Affiché au chargement et après chaque partie
- Choix du mode : `2 Joueurs` / `Joueur vs IA`
- Si mode IA : sélection du niveau `Facile` / `Moyen` / `Difficile`
- Bouton `Jouer`

### Écran de jeu
- Grille 7 colonnes × 6 lignes, centrée à l'écran
- Indicateur du joueur actuel (couleur + nom)
- Survol de colonne : mise en évidence visuelle pour indiquer où le jeton tombera
- Animation CSS de chute du jeton lors du dépôt
- Mise en évidence des 4 jetons gagnants à la fin de la partie
- Boutons `Rejouer` et `Menu` accessibles en permanence

### Palette de couleurs
- Plateau : bleu foncé (`#1a237e` ou similaire)
- Joueur 1 / Rouge : `#e53935`
- Joueur 2 / IA : `#fdd835`
- Fond de page : neutre foncé

---

## 4. Logique de jeu

### Représentation du plateau
```
board[row][col]  — tableau 6×7
  0 = vide
  1 = Joueur 1 (rouge)
  2 = Joueur 2 / IA (jaune)
```

### Règles
- Les jetons tombent dans la colonne sélectionnée et occupent la case la plus basse disponible
- Une colonne pleine ne peut pas être jouée (curseur désactivé)
- La partie se termine par une victoire (4 jetons alignés) ou un match nul (plateau plein)

### Détection de victoire
Après chaque coup, vérification dans les 4 directions autour du dernier jeton posé :
- Horizontale
- Verticale
- Diagonale ↗
- Diagonale ↘

---

## 5. Intelligence artificielle

### Algorithme
Minimax avec élagage alpha-beta.

### Profondeurs selon le niveau
| Niveau   | Profondeur | Comportement attendu                        |
|----------|-----------|---------------------------------------------|
| Facile   | 2         | Commet des erreurs, accessible aux débutants|
| Moyen    | 4         | Joue correctement, peut être battu          |
| Difficile| 7         | Très fort, bloque et contre-attaque         |

### Fonction d'évaluation heuristique
- Analyse toutes les fenêtres de 4 cases consécutives (horizontales, verticales, diagonales)
- Score positif si l'IA y a des jetons, négatif si c'est l'adversaire
- Pondération plus forte pour les cases du centre (colonne 3) car elles offrent plus de combinaisons

### Timing
- L'IA joue 400ms après le coup du joueur pour simuler une réflexion

---

## 6. Gestion des états

| État        | Description                                      |
|-------------|--------------------------------------------------|
| `menu`      | Affichage du menu de sélection de mode/niveau   |
| `playing`   | Partie en cours                                  |
| `ai_thinking` | Tour de l'IA (entrées joueur désactivées)      |
| `ended`     | Partie terminée (victoire ou match nul)          |

---

## 7. Contraintes techniques

- Fichier HTML unique, aucune dépendance externe (pas de bibliothèque JS, pas de CDN)
- Compatible avec les navigateurs modernes (Chrome, Firefox, Edge, Safari)
- Responsive : jouable sur desktop et tablette
