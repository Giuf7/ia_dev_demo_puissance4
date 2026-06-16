// Tests du moteur réel (js/engine.js) — plus aucune copie de la logique ici.
// Exécuter avec : node tests/game.test.js

const {
  ROWS, COLS, createBoard, dropPiece, findWin, getWinner, isDraw, getValidCols, AI, Commentary
} = require('../js/engine.js');

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { console.log(`  ✓ ${msg}`); passed++; }
  else      { console.error(`  ✗ ${msg}`); failed++; }
}

console.log('\n=== Game Logic Tests ===\n');

// dropPiece
{
  const b = createBoard();
  const row = dropPiece(b, 3, 1);
  assert(row === 5, 'dropPiece: premier jeton en bas (row=5)');
  assert(b[5][3] === 1, 'dropPiece: valeur correcte dans le tableau');
  dropPiece(b, 3, 2);
  assert(b[4][3] === 2, 'dropPiece: deuxième jeton empilé (row=4)');
}

// colonne pleine
{
  const b = createBoard();
  for (let i = 0; i < ROWS; i++) dropPiece(b, 0, 1);
  assert(dropPiece(b, 0, 2) === -1, 'dropPiece: retourne -1 si colonne pleine');
  assert(getValidCols(b).includes(0) === false, 'getValidCols: col pleine exclue');
}

// findWin horizontal
{
  const b = createBoard();
  for (let c = 0; c < 4; c++) dropPiece(b, c, 1);
  assert(findWin(b, 5, 3, 1), 'findWin: victoire horizontale');
  assert(findWin(b, 5, 3, 1).length >= 4, 'findWin: renvoie les 4 cases gagnantes');
}

// findWin vertical
{
  const b = createBoard();
  for (let i = 0; i < 4; i++) dropPiece(b, 2, 1);
  assert(findWin(b, 2, 2, 1), 'findWin: victoire verticale');
}

// findWin diagonale
{
  const b = createBoard();
  dropPiece(b, 0, 1);
  dropPiece(b, 1, 2); dropPiece(b, 1, 1);
  dropPiece(b, 2, 2); dropPiece(b, 2, 2); dropPiece(b, 2, 1);
  dropPiece(b, 3, 2); dropPiece(b, 3, 2); dropPiece(b, 3, 2); dropPiece(b, 3, 1);
  assert(findWin(b, 2, 3, 1), 'findWin: victoire diagonale');
}

// findWin négatif
{
  const b = createBoard();
  dropPiece(b, 0, 1); dropPiece(b, 1, 1); dropPiece(b, 2, 1);
  assert(findWin(b, 5, 2, 1) === null, 'findWin: pas de victoire avec 3 jetons');
}

// isDraw
{
  const b = createBoard();
  for (let c = 0; c < COLS; c++)
    for (let r = 0; r < ROWS; r++)
      b[r][c] = (r + c) % 2 + 1;
  assert(isDraw(b), 'isDraw: plateau plein détecté');
  assert(!isDraw(createBoard()), 'isDraw: plateau vide non détecté comme draw');
}

// --- Tests IA ---
console.log('\n=== AI Tests ===\n');

// scoreWindow : menace adverse négative
{
  assert(AI.scoreWindow([1, 1, 1, 0], 2) < 0, 'AI scoreWindow: menace adverse détectée (score négatif)');
}

// scoreBoard : nombre
{
  assert(typeof AI.scoreBoard(createBoard(), 1) === 'number', 'AI scoreBoard: retourne un nombre');
}

// getWinner : identifie le gagnant d'une position terminale
{
  assert(getWinner(createBoard()) === 0, 'getWinner: plateau vide → 0');
  const b1 = createBoard();
  dropPiece(b1, 0, 1); dropPiece(b1, 1, 1); dropPiece(b1, 2, 1); dropPiece(b1, 3, 1);
  assert(getWinner(b1) === 1, 'getWinner: alignement du joueur 1 → 1');
  const b2 = createBoard();
  dropPiece(b2, 0, 2); dropPiece(b2, 1, 2); dropPiece(b2, 2, 2); dropPiece(b2, 3, 2);
  assert(getWinner(b2) === 2, 'getWinner: alignement du joueur 2 → 2');
}

// DÉFENSE : l'IA doit bloquer une menace unique imminente (régression bug #1)
{
  // P1 aligne cols 2-3-4 en bas ; seul blocage = col 5.
  const b = createBoard();
  dropPiece(b, 0, 1); dropPiece(b, 0, 2); dropPiece(b, 0, 2);
  dropPiece(b, 1, 2); dropPiece(b, 2, 1); dropPiece(b, 3, 1); dropPiece(b, 4, 1);
  assert(AI.getBestMove(b, 'medium', 2) === 5, 'AI: bloque la menace horizontale imminente (col 5)');
}

// ATTAQUE : l'IA prend une victoire immédiate quand elle en a une
{
  const b = createBoard();
  dropPiece(b, 1, 2); dropPiece(b, 2, 2); dropPiece(b, 3, 2); // IA aligne 1-2-3
  assert([0, 4].includes(AI.getBestMove(b, 'medium', 2)), 'AI: complète son alignement gagnant');
}

// --- Tests Commentaire ---
console.log('\n=== Commentary Tests ===\n');

// analyze prend le plateau APRÈS le coup joué en (row, col) par `player`.
{
  // VICTOIRE : le coup complète l'alignement
  const b = createBoard();
  dropPiece(b, 0, 1); dropPiece(b, 1, 1); dropPiece(b, 2, 1);
  const row = dropPiece(b, 3, 1);
  assert(Commentary.analyze(b, row, 3, 1).type === 'win', 'Commentary: coup gagnant → win');
}
{
  // BLOCAGE : le joueur 1 bouche la case où le joueur 2 allait gagner
  const b = createBoard();
  dropPiece(b, 0, 2); dropPiece(b, 1, 2); dropPiece(b, 2, 2);
  const row = dropPiece(b, 3, 1);
  assert(Commentary.analyze(b, row, 3, 1).type === 'block', 'Commentary: contre une menace → block');
}
{
  // MENACE : le coup crée un alignement de 3 avec victoire immédiate disponible
  const b = createBoard();
  dropPiece(b, 0, 1); dropPiece(b, 1, 1);
  const row = dropPiece(b, 2, 1);
  assert(Commentary.analyze(b, row, 2, 1).type === 'threat', 'Commentary: crée une menace → threat');
}
{
  // CENTRE : coup au centre sans rien de spécial
  const b = createBoard();
  const row = dropPiece(b, 3, 1);
  assert(Commentary.analyze(b, row, 3, 1).type === 'center', 'Commentary: coup au centre → center');
}
{
  // BANAL : coup ordinaire
  const b = createBoard();
  const row = dropPiece(b, 0, 1);
  assert(Commentary.analyze(b, row, 0, 1).type === 'move', 'Commentary: coup ordinaire → move');
}
{
  // analyze renvoie aussi la colonne jouée
  const b = createBoard();
  const row = dropPiece(b, 5, 1);
  assert(Commentary.analyze(b, row, 5, 1).col === 5, 'Commentary: expose la colonne jouée');
}

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
