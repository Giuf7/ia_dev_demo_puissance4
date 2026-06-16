// === MOTEUR PUISSANCE 4 (logique pure, sans DOM) ===
// Chargé tel quel par le navigateur (script classique → variables globales)
// ET par les tests Node (via module.exports en bas). Une seule source de vérité.

const ROWS = 6, COLS = 7;

function inBounds(r, c) {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS;
}

// Crée un plateau vide (0 = case libre, 1 = joueur 1, 2 = joueur 2).
function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

// Fait tomber un jeton dans la première case libre du bas de la colonne.
// Mute `board`. Retourne la ligne occupée, ou -1 si la colonne est pleine.
function dropPiece(board, col, player) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === 0) {
      board[r][col] = player;
      return r;
    }
  }
  return -1;
}

// Cherche un alignement de 4 passant par (row, col) pour `player`.
// Retourne le tableau des cases gagnantes [[r,c],...], ou null si aucun.
function findWin(board, row, col, player) {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (const [dr, dc] of directions) {
    const cells = [[row, col]];
    // On étend l'alignement dans un sens...
    for (let i = 1; i < 4; i++) {
      const r = row + dr * i, c = col + dc * i;
      if (inBounds(r, c) && board[r][c] === player) cells.push([r, c]);
      else break;
    }
    // ...puis dans le sens opposé.
    for (let i = 1; i < 4; i++) {
      const r = row - dr * i, c = col - dc * i;
      if (inBounds(r, c) && board[r][c] === player) cells.push([r, c]);
      else break;
    }
    if (cells.length >= 4) return cells;
  }
  return null;
}

// Plateau plein (toute la ligne du haut occupée) ?
function isDraw(board) {
  return board[0].every(cell => cell !== 0);
}

// Joueur ayant un alignement de 4 sur le plateau, ou 0 si personne n'a gagné.
// Sert à l'IA pour détecter sans ambiguïté une position terminale gagnée/perdue.
function getWinner(board) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p !== 0 && findWin(board, r, c, p)) return p;
    }
  }
  return 0;
}

// Colonnes encore jouables.
function getValidCols(board) {
  return Array.from({ length: COLS }, (_, c) => c).filter(c => board[0][c] === 0);
}

// === MODULE IA (minimax + alpha-beta) ===
const AI = {
  DEPTHS: { easy: 2, medium: 4, hard: 7 },

  // Évalue une fenêtre de 4 cases du point de vue de `player`.
  scoreWindow(window, player) {
    const opp = player === 1 ? 2 : 1;
    const pCount = window.filter(x => x === player).length;
    const oCount = window.filter(x => x === opp).length;
    const empty  = window.filter(x => x === 0).length;
    if (oCount > 0 && pCount > 0) return 0; // fenêtre mixte → inexploitable
    if (pCount === 4) return 100;
    if (pCount === 3 && empty === 1) return 5;
    if (pCount === 2 && empty === 2) return 2;
    if (oCount === 3 && empty === 1) return -4; // menace adverse
    return 0;
  },

  // Heuristique positionnelle : somme des fenêtres + bonus centre.
  scoreBoard(board, player) {
    let score = 0;
    const centerCol = board.map(row => row[Math.floor(COLS / 2)]);
    score += centerCol.filter(x => x === player).length * 3;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c <= COLS - 4; c++)
        score += this.scoreWindow(board[r].slice(c, c + 4), player);
    for (let c = 0; c < COLS; c++)
      for (let r = 0; r <= ROWS - 4; r++)
        score += this.scoreWindow([0, 1, 2, 3].map(i => board[r + i][c]), player);
    for (let r = 0; r <= ROWS - 4; r++)
      for (let c = 0; c <= COLS - 4; c++)
        score += this.scoreWindow([0, 1, 2, 3].map(i => board[r + i][c + i]), player);
    for (let r = 3; r < ROWS; r++)
      for (let c = 0; c <= COLS - 4; c++)
        score += this.scoreWindow([0, 1, 2, 3].map(i => board[r - i][c + i]), player);
    return score;
  },

  dropTemp(board, col, player) {
    const b = board.map(r => [...r]);
    for (let r = ROWS - 1; r >= 0; r--) {
      if (b[r][col] === 0) { b[r][col] = player; break; }
    }
    return b;
  },

  minimax(board, depth, alpha, beta, maximizing, aiPlayer) {
    // Position gagnée/perdue : on détecte le vrai vainqueur (et non via l'heuristique).
    // On préfère gagner vite et perdre tard → on module le score par la profondeur restante.
    const winner = getWinner(board);
    if (winner !== 0) {
      return { score: winner === aiPlayer ? 1000000 + depth : -1000000 - depth };
    }
    const validCols = getValidCols(board);
    if (depth === 0 || validCols.length === 0) {
      return { score: this.scoreBoard(board, aiPlayer) }; // nul ou horizon atteint
    }
    if (maximizing) {
      let best = { score: -Infinity, col: validCols[0] };
      for (const col of validCols) {
        const result = this.minimax(this.dropTemp(board, col, aiPlayer), depth - 1, alpha, beta, false, aiPlayer);
        if (result.score > best.score) best = { score: result.score, col };
        alpha = Math.max(alpha, best.score);
        if (alpha >= beta) break;
      }
      return best;
    } else {
      const opp = aiPlayer === 1 ? 2 : 1;
      let best = { score: Infinity, col: validCols[0] };
      for (const col of validCols) {
        const result = this.minimax(this.dropTemp(board, col, opp), depth - 1, alpha, beta, true, aiPlayer);
        if (result.score < best.score) best = { score: result.score, col };
        beta = Math.min(beta, best.score);
        if (alpha >= beta) break;
      }
      return best;
    }
  },

  getBestMove(board, level, aiPlayer) {
    const validCols = getValidCols(board);
    if (validCols.length === 0) return -1;
    const result = this.minimax(board, this.DEPTHS[level] || 4, -Infinity, Infinity, true, aiPlayer);
    return result.col !== undefined ? result.col : validCols[0];
  }
};

// === MODULE COMMENTAIRE (analyse pure d'un coup) ===
// Qualifie le dernier coup pour la narration en direct.
// `board` est l'état APRÈS le coup joué en (row, col) par `player`.
const Commentary = {
  // Le joueur a-t-il une victoire immédiate disponible au prochain tour ?
  _hasImmediateWin(board, player) {
    for (const c of getValidCols(board)) {
      const b = board.map(r => [...r]);
      const row = dropPiece(b, c, player);
      if (row !== -1 && findWin(b, row, c, player)) return true;
    }
    return false;
  },

  analyze(board, row, col, player) {
    const opp = player === 1 ? 2 : 1;

    // 1. Victoire : le coup complète un alignement de 4.
    if (findWin(board, row, col, player)) return { type: 'win', col };

    // 2. Blocage : sur le plateau d'avant, l'adversaire gagnait en jouant ici.
    const before = board.map(r => [...r]);
    before[row][col] = opp;
    if (findWin(before, row, col, opp)) return { type: 'block', col };

    // 3. Menace : le coup ouvre une victoire immédiate pour le joueur.
    if (this._hasImmediateWin(board, player)) return { type: 'threat', col };

    // 4. Centre : coup posé dans la colonne centrale.
    if (col === Math.floor(COLS / 2)) return { type: 'center', col };

    // 5. Coup ordinaire.
    return { type: 'move', col };
  }
};

// Export Node (les tests) — invisible côté navigateur.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ROWS, COLS, inBounds, createBoard, dropPiece, findWin, getWinner, isDraw, getValidCols, AI, Commentary };
}
