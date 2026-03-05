// Piece mappings for images
const pieceImages = {
  'br': 'images/br_1758290767074.png', // black rook
  'bn': 'images/bn_1758290767072.png', // black knight  
  'bb': 'images/bb_1758290767070.png', // black bishop
  'bq': 'images/bq_1758290767073.png', // black queen
  'bk': 'images/bk_1758290767071.png', // black king
  'bp': 'images/bp_1758290767073.png', // black pawn
  'wr': 'images/wr_1758290767077.png', // white rook
  'wn': 'images/wn_1758290767075.png', // white knight
  'wb': 'images/wb_1758290767074.png', // white bishop
  'wq': 'images/wq_1758290767077.png', // white queen
  'wk': 'images/wk_1758290767075.png', // white king
  'wp': 'images/wp_1758290767076.png'  // white pawn
};

// Game state with persistence
let gameState = {
  board: [
    ["br","bn","bb","bq","bk","bb","bn","br"],
    ["bp","bp","bp","bp","bp","bp","bp","bp"],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["wp","wp","wp","wp","wp","wp","wp","wp"],
    ["wr","wn","wb","wq","wk","wb","wn","wr"]
  ],
  currentPlayer: 'white',
  selectedSquare: null,
  moveHistory: [],
  lastMoveBy: null,
  previousGameState: null,
  gameEnded: false,
  // Castling tracking
  kingMoved: { white: false, black: false },
  rookMoved: { 
    white: { left: false, right: false }, 
    black: { left: false, right: false } 
  },
  // En passant tracking
  enPassantTarget: null,
  // Draw condition tracking
  halfmoveClock: 0,
  fullmoveNumber: 1,
  positionHistory: []
};

// DOM elements
const chessboard = document.getElementById('chessboard');
const currentTurnSpanTop = document.getElementById('current-turn-top');
const currentTurnSpanBottom = document.getElementById('current-turn-bottom');
const resetBtnTop = document.getElementById('reset-game-top');
const resetBtnBottom = document.getElementById('reset-game-bottom');
const flipBtnTop = document.getElementById('flip-board-top');
const flipBtnBottom = document.getElementById('flip-board-bottom');
const moveLogTop = document.getElementById('move-log-top');
const moveLogBottom = document.getElementById('move-log-bottom');
const moveCounterTop = document.getElementById('move-counter-top');
const moveCounterBottom = document.getElementById('move-counter-bottom');
const gameTimerTop = document.getElementById('game-timer-top');
const gameTimerBottom = document.getElementById('game-timer-bottom');
let whiteUndoBtn, blackUndoBtn;

// Chess tips for beginners
const chessTips = [
  "🎯 Try to control the center of the board with your pawns and knights early in the game!",
  "🏰 Castle early to keep your king safe - move your king and rook at the same time!",
  "👀 Always look for what your opponent is planning before making your move!",
  "♞ Knights are tricky - they can jump over other pieces in an L-shape!",
  "🛡️ Protect your pieces by having other pieces defend them!",
  "⚖️ When you capture a piece, make sure you're not losing a more valuable piece!",
  "🚀 Try to develop all your pieces early instead of moving the same piece twice!",
  "👑 The queen is powerful but don't bring her out too early - she might get attacked!"
];

let currentTipIndex = 0;
let gameStartTime = Date.now();
let timerInterval;

// User preferences
let userPrefs = {
  theme: 'dark',
  uppercaseCoords: true
};

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  userPrefs.theme = theme;
  saveUserPrefs();
}

function applyUserPrefsToUI() {
  document.documentElement.setAttribute('data-theme', userPrefs.theme);
  const board = document.getElementById('chessboard');
  if (board) {
    board.classList.toggle('coords-uppercase', userPrefs.uppercaseCoords);
  }
}

function saveUserPrefs() {
  localStorage.setItem('chessUserPrefs', JSON.stringify(userPrefs));
}

function loadUserPrefs() {
  const saved = localStorage.getItem('chessUserPrefs');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      userPrefs = { ...userPrefs, ...parsed };
    } catch {}
  } else {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      userPrefs.theme = 'light';
    }
  }
}

// Toast notification system
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container-bottom');
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
    <div class="toast-description">${message}</div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showToastForPlayer(message, type, player) {
  const containerId = player === 'black' ? 'toast-container-top' : 'toast-container-bottom';
  const toastContainer = document.getElementById(containerId);
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
    <div class="toast-description">${message}</div>
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Game state persistence
function saveGameState() {
  const stateToSave = {
    board: gameState.board,
    currentPlayer: gameState.currentPlayer,
    moveHistory: gameState.moveHistory,
    lastMoveBy: gameState.lastMoveBy,
    previousGameState: gameState.previousGameState,
    gameEnded: gameState.gameEnded,
    kingMoved: gameState.kingMoved,
    rookMoved: gameState.rookMoved,
    enPassantTarget: gameState.enPassantTarget,
    halfmoveClock: gameState.halfmoveClock,
    fullmoveNumber: gameState.fullmoveNumber,
    positionHistory: gameState.positionHistory
  };
  localStorage.setItem('chessGameState', JSON.stringify(stateToSave));
}

function loadGameState() {
  const savedState = localStorage.getItem('chessGameState');
  if (savedState) {
    const parsedState = JSON.parse(savedState);
    gameState.board = parsedState.board;
    gameState.currentPlayer = parsedState.currentPlayer;
    gameState.moveHistory = parsedState.moveHistory || [];
    gameState.lastMoveBy = parsedState.lastMoveBy || null;
    gameState.previousGameState = parsedState.previousGameState || null;
    gameState.gameEnded = parsedState.gameEnded || false;
    gameState.kingMoved = parsedState.kingMoved || { white: false, black: false };
    gameState.rookMoved = parsedState.rookMoved || { 
      white: { left: false, right: false }, 
      black: { left: false, right: false } 
    };
    gameState.enPassantTarget = parsedState.enPassantTarget || null;
    gameState.halfmoveClock = parsedState.halfmoveClock || 0;
    gameState.fullmoveNumber = parsedState.fullmoveNumber || 1;
    gameState.positionHistory = parsedState.positionHistory || [];
    return true;
  }
  return false;
}

function clearSavedGame() {
  localStorage.removeItem('chessGameState');
}

// Timer functionality
function startTimer() {
  gameStartTime = Date.now();
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  if (gameTimerTop) gameTimerTop.textContent = timeText;
  if (gameTimerBottom) gameTimerBottom.textContent = timeText;
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Undo functionality
function saveGameStateBeforeMove() {
  gameState.previousGameState = {
    board: JSON.parse(JSON.stringify(gameState.board)),
    currentPlayer: gameState.currentPlayer,
    moveHistory: [...gameState.moveHistory],
    lastMoveBy: gameState.lastMoveBy
  };
}

function undoPlayerMove(player) {
  if (gameState.lastMoveBy !== player) {
    return;
  }

  if (!gameState.previousGameState) {
    return;
  }

  gameState.board = JSON.parse(JSON.stringify(gameState.previousGameState.board));
  gameState.currentPlayer = gameState.previousGameState.currentPlayer;
  gameState.moveHistory = [...gameState.previousGameState.moveHistory];
  gameState.lastMoveBy = gameState.previousGameState.lastMoveBy;
  gameState.previousGameState = null;

  clearSelection();
  updateBoard();
  updateCurrentTurn();
  updateMoveLog();
  updateUndoRedoButtons();
  updateMoveCounter();

  gameState.gameEnded = false;
  saveGameState();

}

function updateUndoRedoButtons() {
  const canUndo = gameState.previousGameState && gameState.lastMoveBy;

  if (whiteUndoBtn) {
    whiteUndoBtn.disabled = !(gameState.lastMoveBy === 'white' && canUndo);
  }
  if (blackUndoBtn) {
    blackUndoBtn.disabled = !(gameState.lastMoveBy === 'black' && canUndo);
  }
}

// Initialize the game
function init() {
  const hasLoadedGame = loadGameState();

  loadUserPrefs();
  initializeBoard();
  updateVisualHelpButtonState();
  updateCurrentTurn();
  createUndoRedoButtons();
  setupEventListeners();
  updateUndoRedoButtons();
  updateMoveCounter();
  startTimer();
  applyUserPrefsToUI();

  if (hasLoadedGame) {
    updateMoveLog();
  }
}

function setupEventListeners() {
  if (resetBtnTop) resetBtnTop.addEventListener('click', resetGame);
  if (resetBtnBottom) resetBtnBottom.addEventListener('click', resetGame);
  if (flipBtnTop) flipBtnTop.addEventListener('click', flipBoard);
  if (flipBtnBottom) flipBtnBottom.addEventListener('click', flipBoard);
  const prefThemeTop = document.getElementById('pref-theme-top');
  const prefThemeBottom = document.getElementById('pref-theme-bottom');

  function syncPreferenceControls() {
    if (prefThemeTop) prefThemeTop.checked = userPrefs.theme === 'light';
    if (prefThemeBottom) prefThemeBottom.checked = userPrefs.theme === 'light';
  }

  function bindPreferenceControls() {
    if (prefThemeTop) prefThemeTop.addEventListener('change', (e) => { setTheme(e.target.checked ? 'light' : 'dark'); applyUserPrefsToUI(); syncPreferenceControls(); });
    if (prefThemeBottom) prefThemeBottom.addEventListener('change', (e) => { setTheme(e.target.checked ? 'light' : 'dark'); applyUserPrefsToUI(); syncPreferenceControls(); });
  }

  syncPreferenceControls();
  bindPreferenceControls();
}

// Create player-specific undo buttons
function createUndoRedoButtons() {
  whiteUndoBtn = document.getElementById('undo-btn-bottom');
  if (whiteUndoBtn) {
    whiteUndoBtn.addEventListener('click', () => undoPlayerMove('white'));
  }

  blackUndoBtn = document.getElementById('undo-btn-top');
  if (blackUndoBtn) {
    blackUndoBtn.addEventListener('click', () => undoPlayerMove('black'));
  }
}

// Initialize chess board
function initializeBoard() {
  chessboard.innerHTML = '';
  chessboard.style.gridTemplateColumns = 'repeat(8, 1fr)';
  chessboard.style.gridTemplateRows = 'repeat(8, 1fr)';

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement('div');
      square.classList.add('square');
      square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
      square.dataset.row = row;
      square.dataset.col = col;
      square.dataset.coord = String.fromCharCode(97 + col) + (8 - row);

      const piece = gameState.board[row][col];
      if (piece) {
        const pieceEl = createPieceElement(piece);
        square.appendChild(pieceEl);
      }

      square.addEventListener('click', handleSquareClick);
      chessboard.appendChild(square);
    }
  }
}

function createPieceElement(piece) {
  const pieceEl = document.createElement('div');
  pieceEl.classList.add('piece');

  if (piece && pieceImages[piece]) {
    const img = document.createElement('img');
    img.src = pieceImages[piece];
    img.alt = piece;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.draggable = false;
    pieceEl.appendChild(img);

    // Rotate black pieces 180 degrees to face the opponent
    if (piece.startsWith('b')) {
      pieceEl.style.transform = 'rotate(180deg)';
    }

    if (piece.startsWith('w')) {
      pieceEl.classList.add('white-piece');
    } else {
      pieceEl.classList.add('black-piece');
    }
  }

  return pieceEl;
}

function handleSquareClick(e) {
  e.preventDefault();

  if (gameState.gameEnded) {
    return;
  }

  let square = e.target;
  while (square && !square.classList.contains('square')) {
    square = square.parentElement;
  }

  if (!square) return;

  const row = parseInt(square.dataset.row);
  const col = parseInt(square.dataset.col);

  if (isNaN(row) || isNaN(col)) return;

  if (navigator.vibrate) {
    navigator.vibrate(50);
  }

  if (gameState.selectedSquare) {
    const fromRow = gameState.selectedSquare.row;
    const fromCol = gameState.selectedSquare.col;

    if (fromRow === row && fromCol === col) {
      clearSelection();
      return;
    }

    if (isValidMove(fromRow, fromCol, row, col)) {
      makeMove(fromRow, fromCol, row, col);
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } else {
      clearSelection();
      selectSquare(row, col);
    }
  } else {
    selectSquare(row, col);
  }
}

function selectSquare(row, col) {
  if (row < 0 || row >= 8 || col < 0 || col >= 8) return;

  const piece = gameState.board[row][col];

  if (piece && isPieceOwnedByCurrentPlayer(piece)) {
    gameState.selectedSquare = { row, col };

    const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (square) {
      square.classList.add('selected');
      showValidMoves(row, col);
      showVisualAids(row, col);
    }
  }
}

function clearSelection() {
  gameState.selectedSquare = null;

  document.querySelectorAll('.square').forEach(square => {
    square.classList.remove('selected', 'valid-move', 'king-in-check');
  });
  
  clearVisualAids();
}

function isKingInCheck(player) {
  const kingPiece = player === 'white' ? 'wk' : 'bk';
  let kingRow = -1, kingCol = -1;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (gameState.board[row][col] === kingPiece) {
        kingRow = row;
        kingCol = col;
        break;
      }
    }
    if (kingRow !== -1) break;
  }

  if (kingRow === -1) return false;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = gameState.board[row][col];
      if (piece && !isPieceOfPlayer(piece, player)) {
        if (isValidPieceMove(piece, row, col, kingRow, kingCol, kingPiece)) {
          return true;
        }
      }
    }
  }

  return false;
}

function isPieceOfPlayer(piece, player) {
  if (!piece) return false;

  if (player === 'white') {
    return piece.startsWith('w');
  } else {
    return piece.startsWith('b');
  }
}

function highlightKingInCheck(player) {
  const kingPiece = player === 'white' ? 'wk' : 'bk';

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (gameState.board[row][col] === kingPiece) {
        const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        square.classList.add('check');

        setTimeout(() => {
          square.classList.remove('check');
        }, 3000);
        break;
      }
    }
  }
}

function showValidMoves(fromRow, fromCol) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (isValidMove(fromRow, fromCol, row, col)) {
        const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (gameState.board[row][col]) {
          square.classList.add('valid-capture');
        } else {
          square.classList.add('valid-move');
        }
      }
    }
  }
}

function makeMove(fromRow, fromCol, toRow, toCol) {
  const piece = gameState.board[fromRow][fromCol];
  const capturedPiece = gameState.board[toRow][toCol];

  saveGameStateBeforeMove();

  let enPassantCaptured = false;
  if (piece.slice(1) === 'p' && Math.abs(toCol - fromCol) === 1 && !capturedPiece) {
    if (isValidEnPassant(fromRow, fromCol, toRow, toCol)) {
      gameState.board[fromRow][toCol] = '';
      enPassantCaptured = true;
    }
  }

  gameState.board[toRow][toCol] = piece;
  gameState.board[fromRow][fromCol] = '';

  const moveNotation = `${getMoveNotation(piece, fromRow, fromCol, toRow, toCol, capturedPiece || enPassantCaptured)}`;
  gameState.moveHistory.push(moveNotation);

  const movingPlayer = gameState.currentPlayer;
  gameState.lastMoveBy = movingPlayer;

  if (piece.slice(1) === 'k') {
    gameState.kingMoved[movingPlayer] = true;
  } else if (piece.slice(1) === 'r') {
    const side = fromCol === 0 ? 'left' : 'right';
    gameState.rookMoved[movingPlayer][side] = true;
  }

  updateMoveCounters(piece, capturedPiece || enPassantCaptured);
  updateEnPassantTarget(fromRow, fromCol, toRow, toCol);

  gameState.currentPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';

  const opponentPlayer = gameState.currentPlayer;
  if (isKingInCheck(opponentPlayer)) {
    if (isCheckmate(opponentPlayer)) {
      const winner = opponentPlayer === 'white' ? 'black' : 'white';
      const lastIdxMate = gameState.moveHistory.length - 1;
      if (lastIdxMate >= 0) {
        gameState.moveHistory[lastIdxMate] = `${gameState.moveHistory[lastIdxMate]}#`;
      }
      showGameOverModal(winner, false, false, null, winner);
      return;
    } else {
      const lastIdxCheck = gameState.moveHistory.length - 1;
      if (lastIdxCheck >= 0 && !gameState.moveHistory[lastIdxCheck].endsWith('#')) {
        gameState.moveHistory[lastIdxCheck] = `${gameState.moveHistory[lastIdxCheck]}+`;
      }
      showToastForPlayer(`Check! ${opponentPlayer} king is in danger!`, 'warning', 'white');
      showToastForPlayer(`Check! ${opponentPlayer} king is in danger!`, 'warning', 'black');
      highlightKingInCheck(opponentPlayer);
    }
  } else if (isStalemate(opponentPlayer)) {
    showGameOverModal(null, true, false, null, null);
    return;
  }

  if (capturedPiece) {
    const pieceColor = piece.startsWith('w') ? 'white' : 'black';
    const capturedColor = capturedPiece.startsWith('w') ? 'white' : 'black';
    const captureMessage = `${pieceColor} ${getPieceName(piece).toLowerCase()} took ${capturedColor} ${getPieceName(capturedPiece).toLowerCase()}`;
    showToastForPlayer(captureMessage, 'info', 'white');
    showToastForPlayer(captureMessage, 'info', 'black');
  }

  clearSelection();
  updateBoard();
  updateCurrentTurn();
  updateMoveLog();
  updateUndoRedoButtons();
  updateMoveCounter();

  if (piece.slice(1) === 'p') {
    const promotionRow = piece.startsWith('w') ? 0 : 7;
    if (toRow === promotionRow) {
      const pieceColor = piece.startsWith('w') ? 'white' : 'black';
      showPawnPromotionModal(toRow, toCol, pieceColor);
      return;
    }
  }

  saveGameState();
}

function getMoveNotation(piece, fromRow, fromCol, toRow, toCol, captured) {
  const pieceSymbol = getPieceSymbol(piece);
  const fromSquare = String.fromCharCode(97 + fromCol) + (8 - fromRow);
  const toSquare = String.fromCharCode(97 + toCol) + (8 - toRow);
  const captureSymbol = captured ? 'x' : '';
  
  return `${pieceSymbol}${fromSquare}${captureSymbol}${toSquare}`;
}

function getPieceSymbol(piece) {
  const symbols = {
    'k': 'K', 'q': 'Q', 'r': 'R', 'b': 'B', 'n': 'N', 'p': ''
  };
  return symbols[piece.slice(1)] || '';
}

function getPieceName(piece) {
  const names = {
    'k': 'King', 'q': 'Queen', 'r': 'Rook', 'b': 'Bishop', 'n': 'Knight', 'p': 'Pawn'
  };
  return names[piece.slice(1)] || 'Piece';
}

function isValidMove(fromRow, fromCol, toRow, toCol) {
  if (toRow < 0 || toRow >= 8 || toCol < 0 || toCol >= 8) return false;

  const piece = gameState.board[fromRow][fromCol];
  const targetPiece = gameState.board[toRow][toCol];

  if (!piece) return false;
  if (!isPieceOwnedByCurrentPlayer(piece)) return false;
  if (targetPiece && isPieceOwnedByCurrentPlayer(targetPiece)) return false;
  if (fromRow === toRow && fromCol === toCol) return false;

  if (!isValidPieceMove(piece, fromRow, fromCol, toRow, toCol, targetPiece)) {
    return false;
  }

  const originalBoard = JSON.parse(JSON.stringify(gameState.board));
  gameState.board[toRow][toCol] = piece;
  gameState.board[fromRow][fromCol] = '';

  const wouldBeInCheck = isKingInCheck(gameState.currentPlayer);

  gameState.board = originalBoard;

  return !wouldBeInCheck;
}

function isValidPieceMove(piece, fromRow, fromCol, toRow, toCol, targetPiece) {
  const rowDiff = toRow - fromRow;
  const colDiff = toCol - fromCol;
  const absRowDiff = Math.abs(rowDiff);
  const absColDiff = Math.abs(colDiff);
  const pieceType = piece.slice(1);

  switch (pieceType) {
    case 'p':
      const isWhite = piece.startsWith('w');
      const direction = isWhite ? -1 : 1;
      const startRow = isWhite ? 6 : 1;

      if (colDiff === 0 && rowDiff === direction && !targetPiece) return true;
      if (colDiff === 0 && rowDiff === 2 * direction && fromRow === startRow && !targetPiece && !gameState.board[fromRow + direction][fromCol]) return true;
      if (absColDiff === 1 && rowDiff === direction && targetPiece) return true;
      if (absColDiff === 1 && rowDiff === direction && !targetPiece) {
        return isValidEnPassant(fromRow, fromCol, toRow, toCol);
      }
      return false;

    case 'r':
      if (rowDiff === 0 || colDiff === 0) {
        return isPathClear(fromRow, fromCol, toRow, toCol);
      }
      return false;

    case 'b':
      if (absRowDiff === absColDiff) {
        return isPathClear(fromRow, fromCol, toRow, toCol);
      }
      return false;

    case 'q':
      if (rowDiff === 0 || colDiff === 0 || absRowDiff === absColDiff) {
        return isPathClear(fromRow, fromCol, toRow, toCol);
      }
      return false;

    case 'n':
      return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2);

    case 'k':
      return absRowDiff <= 1 && absColDiff <= 1;

    default:
      return false;
  }
}

function isPathClear(fromRow, fromCol, toRow, toCol) {
  const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
  const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;

  let currentRow = fromRow + rowStep;
  let currentCol = fromCol + colStep;

  while (currentRow !== toRow || currentCol !== toCol) {
    if (gameState.board[currentRow][currentCol] !== '') {
      return false;
    }
    currentRow += rowStep;
    currentCol += colStep;
  }

  return true;
}

function isPieceOwnedByCurrentPlayer(piece) {
  if (!piece) return false;

  if (gameState.currentPlayer === 'white') {
    return piece.startsWith('w');
  } else {
    return piece.startsWith('b');
  }
}

function updateBoard() {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
      square.innerHTML = '';

      const piece = gameState.board[row][col];
      if (piece) {
        const pieceEl = createPieceElement(piece);
        square.appendChild(pieceEl);
      }
    }
  }
}

function updateCurrentTurn() {
  const turnText = gameState.currentPlayer.charAt(0).toUpperCase() + gameState.currentPlayer.slice(1);
  if (currentTurnSpanTop) {
    currentTurnSpanTop.textContent = turnText;
    currentTurnSpanTop.className = `turn-badge ${gameState.currentPlayer}`;
  }
  if (currentTurnSpanBottom) {
    currentTurnSpanBottom.textContent = turnText;
    currentTurnSpanBottom.className = `turn-badge ${gameState.currentPlayer}`;
  }

  const whiteStatus = document.getElementById('white-status');
  const blackStatus = document.getElementById('black-status');

  if (!whiteStatus || !blackStatus) return;

  requestAnimationFrame(() => {
    if (gameState.currentPlayer === 'white') {
      whiteStatus.textContent = "Your turn! 🎯";
      whiteStatus.className = "player-status active";
      blackStatus.textContent = "Waiting...";
      blackStatus.className = "player-status";
    } else {
      blackStatus.textContent = "Your turn! 🎯";
      blackStatus.className = "player-status active";
      whiteStatus.textContent = "Waiting...";
      whiteStatus.className = "player-status";
    }
  });
}

function updateMoveLog() {
  const lastMoves = gameState.moveHistory.slice(-3);
  const logContent = lastMoves.map((move, index) => {
    const moveNum = gameState.moveHistory.length - lastMoves.length + index + 1;
    return `${moveNum}. ${move}`;
  }).join(' • ');
  const displayText = logContent || 'Game started!';

  if (moveLogTop) {
    moveLogTop.innerHTML = displayText;
    moveLogTop.scrollTop = moveLogTop.scrollHeight;
  }
  if (moveLogBottom) {
    moveLogBottom.innerHTML = displayText;
    moveLogBottom.scrollTop = moveLogBottom.scrollHeight;
  }
}

function updateMoveCounter() {
  const counterText = `${gameState.moveHistory.length} moves`;
  if (moveCounterTop) moveCounterTop.textContent = counterText;
  if (moveCounterBottom) moveCounterBottom.textContent = counterText;
}

function resetGame() {
  if (gameState.moveHistory.length > 0) {
    if (!confirm("Are you sure you want to start a new game? All progress will be lost!")) {
      return;
    }
  }

  stopTimer();
  
  gameState = {
    board: [
      ["br","bn","bb","bq","bk","bb","bn","br"],
      ["bp","bp","bp","bp","bp","bp","bp","bp"],
      ["","","","","","","",""],
      ["","","","","","","",""],
      ["","","","","","","",""],
      ["","","","","","","",""],
      ["wp","wp","wp","wp","wp","wp","wp","wp"],
      ["wr","wn","wb","wq","wk","wb","wn","wr"]
    ],
    currentPlayer: 'white',
    selectedSquare: null,
    moveHistory: [],
    lastMoveBy: null,
    previousGameState: null,
    gameEnded: false,
    kingMoved: { white: false, black: false },
    rookMoved: { 
      white: { left: false, right: false }, 
      black: { left: false, right: false } 
    },
    enPassantTarget: null,
    halfmoveClock: 0,
    fullmoveNumber: 1,
    positionHistory: []
  };

  clearSavedGame();

  clearSelection();
  initializeBoard();
  updateCurrentTurn();
  updateUndoRedoButtons();
  updateMoveCounter();
  startTimer();

  if (moveLogTop) moveLogTop.innerHTML = 'Game started!';
  if (moveLogBottom) moveLogBottom.innerHTML = 'Game started!';
  
  
}

// Board flip functionality
function flipBoard() {
  const board = document.getElementById('chessboard');
  if (!board) return;
  
  board.classList.toggle('flipped');
  const isFlipped = board.classList.contains('flipped');
  const flipText = isFlipped ? '🔄 Normal' : '🔄 Flip';

  if (flipBtnTop) flipBtnTop.textContent = flipText;
  if (flipBtnBottom) flipBtnBottom.textContent = flipText;

  
}

// Toggle player controls
function togglePlayerControls(player) {
  const controls = document.getElementById(`${player}-controls`);
  const arrow = document.getElementById(`${player}-arrow`);

  controls.classList.remove('collapsed');
  if (arrow) {
    arrow.classList.add('rotated');
  }
}

function updateVisualHelpButtonState() {
  const board = document.getElementById('chessboard');
  const isEnabled = board ? board.classList.contains('visual-help') : false;
  
  const visualHelpBtnTop = document.getElementById('visual-help-top');
  const visualHelpBtnBottom = document.getElementById('visual-help-bottom');
  
  const buttonIcon = isEnabled ? '👁️' : '🙈';
  const buttonText = `${buttonIcon} Help`;

  if (visualHelpBtnTop) {
    visualHelpBtnTop.textContent = buttonText;
  }
  if (visualHelpBtnBottom) {
    visualHelpBtnBottom.textContent = buttonText;
  }
}

// Visual help toggle
function toggleVisualHelp() {
  const board = document.getElementById('chessboard');
  if (!board) return;
  
  board.classList.toggle('visual-help');
  
  updateVisualHelpButtonState();

  if (!board.classList.contains('visual-help')) {
    clearVisualAids();
    return;
  }

  if (gameState.selectedSquare) {
    showValidMoves(gameState.selectedSquare.row, gameState.selectedSquare.col);
    showVisualAids(gameState.selectedSquare.row, gameState.selectedSquare.col);
  }
  
}

function showVisualAids(selectedRow, selectedCol) {
  if (!document.getElementById('chessboard').classList.contains('visual-help')) {
    clearVisualAids();
    return;
  }

  const piece = gameState.board[selectedRow][selectedCol];
  if (!piece || !isPieceOwnedByCurrentPlayer(piece)) {
    return;
  }

  clearVisualAids();

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (isValidPieceMove(piece, selectedRow, selectedCol, row, col, gameState.board[row][col])) {
        const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (square) {
          square.classList.add('attack-pattern');
          
          if (gameState.board[row][col]) {
            square.classList.add('capture-indicator');
          } else {
            square.classList.add('move-indicator');
          }
        }
      }
    }
  }

  showDangerZones();
}

function clearVisualAids() {
  document.querySelectorAll('.square').forEach(square => {
    square.classList.remove('attack-pattern', 'capture-indicator', 'move-indicator', 'danger-zone', 'valid-move', 'valid-capture', 'selected');
  });
}

function showDangerZones() {
  const currentPlayerPieces = [];
  const opponentPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = gameState.board[row][col];
      if (piece && isPieceOwnedByCurrentPlayer(piece)) {
        currentPlayerPieces.push({ piece, row, col });
      }
    }
  }

  currentPlayerPieces.forEach(({ piece, row, col }) => {
    let isUnderAttack = false;

    for (let opRow = 0; opRow < 8; opRow++) {
      for (let opCol = 0; opCol < 8; opCol++) {
        const opponentPiece = gameState.board[opRow][opCol];
        if (opponentPiece && isPieceOfPlayer(opponentPiece, opponentPlayer)) {
          if (isValidPieceMove(opponentPiece, opRow, opCol, row, col, piece)) {
            isUnderAttack = true;
            break;
          }
        }
      }
      if (isUnderAttack) break;
    }

    if (isUnderAttack) {
      const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
      if (square) {
        square.classList.add('danger-zone');
      }
    }
  });
}

// Game over and special moves
function isCheckmate(player) {
  return isKingInCheck(player) && !hasLegalMoves(player);
}

function isStalemate(player) {
  return !isKingInCheck(player) && !hasLegalMoves(player);
}

function hasLegalMoves(player) {
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = gameState.board[fromRow][fromCol];
      if (piece && isPieceOfPlayer(piece, player)) {
        for (let toRow = 0; toRow < 8; toRow++) {
          for (let toCol = 0; toCol < 8; toCol++) {
            if (isValidMove(fromRow, fromCol, toRow, toCol)) {
              return true;
            }
          }
        }
      }
    }
  }
  return false;
}

function showGameOverModal(winner, isStalemate = false, isResignation = false, resigningPlayer = null, viewingPlayer = null) {
  const modal = document.getElementById('game-over-modal');
  if (!modal) return;

  let title, message;
  if (isStalemate) {
    title = 'STALEMATE!';
    message = 'The game ends in a draw!';
  } else if (isResignation) {
    title = 'RESIGNATION!';
    // Display message from winner's perspective
    message = `${winner.toUpperCase()} WINS!`;
  } else {
    title = 'CHECKMATE!';
    message = `${winner.toUpperCase()} WINS!`;
  }

  modal.querySelector('.game-over-title').textContent = title;
  modal.querySelector('.game-over-message').textContent = message;
  
  // Apply orientation based on viewing player
  modal.classList.remove('black-player-view');
  if (viewingPlayer === 'black') {
    modal.classList.add('black-player-view');
  }
  
  modal.style.display = 'flex';
  gameState.gameEnded = true;
  stopTimer();
}

function startNewGame() {
  const modal = document.getElementById('game-over-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('black-player-view');
  }
  resetGame();
}

function showPawnPromotionModal(row, col, playerColor) {
  const modal = document.createElement('div');
  modal.className = 'promotion-modal';
  modal.id = 'promotion-modal';

  const pieces = ['q', 'r', 'b', 'n'];
  const pieceNames = ['Queen', 'Rook', 'Bishop', 'Knight'];

  const piecesHtml = pieces.map((piece, index) => {
    const pieceCode = playerColor.charAt(0) + piece;
    const imageSrc = pieceImages[pieceCode];
    return `
      <div class="promotion-piece" onclick="promotePawn(${row}, ${col}, '${pieceCode}')">
        <img src="${imageSrc}" alt="${pieceNames[index]}" title="${pieceNames[index]}">
      </div>
    `;
  }).join('');

  modal.innerHTML = `
    <div class="promotion-content">
      <div class="promotion-title">Choose a piece to promote your pawn:</div>
      <div class="promotion-pieces">
        ${piecesHtml}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function promotePawn(row, col, newPiece) {
  gameState.board[row][col] = newPiece;

  const modal = document.getElementById('promotion-modal');
  if (modal) {
    modal.remove();
  }

  updateBoard();

  const lastMoveIndex = gameState.moveHistory.length - 1;
  gameState.moveHistory[lastMoveIndex] += `=${getPieceSymbol(newPiece)}`;
  updateMoveLog();

  const opponentPlayer = gameState.currentPlayer;
  if (isKingInCheck(opponentPlayer)) {
    if (isCheckmate(opponentPlayer)) {
      const winner = opponentPlayer === 'white' ? 'black' : 'white';
      showGameOverModal(winner, false, false, null, winner);
      return;
    } else {
      showToastForPlayer(`Check! ${opponentPlayer} king is in danger!`, 'warning', 'white');
      showToastForPlayer(`Check! ${opponentPlayer} king is in danger!`, 'warning', 'black');
      highlightKingInCheck(opponentPlayer);
    }
  }

  saveGameState();
}

// En passant
function isValidEnPassant(fromRow, fromCol, toRow, toCol) {
  const piece = gameState.board[fromRow][fromCol];
  if (!piece || piece.slice(1) !== 'p') return false;
  
  const isWhite = piece.startsWith('w');
  const direction = isWhite ? -1 : 1;
  const expectedRow = isWhite ? 3 : 4;
  
  if (fromRow !== expectedRow) return false;
  
  if (Math.abs(toCol - fromCol) !== 1 || (toRow - fromRow) !== direction) {
    return false;
  }
  
  if (!gameState.enPassantTarget) return false;
  
  return (gameState.enPassantTarget.row === toRow && 
          gameState.enPassantTarget.col === toCol);
}

function updateEnPassantTarget(fromRow, fromCol, toRow, toCol) {
  const piece = gameState.board[toRow][toCol];
  
  gameState.enPassantTarget = null;
  
  if (piece && piece.slice(1) === 'p') {
    const isWhite = piece.startsWith('w');
    const startRow = isWhite ? 6 : 1;
    
    if (fromRow === startRow && Math.abs(toRow - fromRow) === 2) {
      gameState.enPassantTarget = {
        row: fromRow + (isWhite ? -1 : 1),
        col: toCol
      };
    }
  }
}

// Draw conditions
function updateMoveCounters(piece, capturedPiece) {
  if (piece.slice(1) === 'p' || capturedPiece) {
    gameState.halfmoveClock = 0;
  } else {
    gameState.halfmoveClock++;
  }
  
  if (gameState.currentPlayer === 'black') {
    gameState.fullmoveNumber++;
  }
}

// Resignation and draw
function resignGame(resigningPlayer) {
  const winner = resigningPlayer === 'white' ? 'black' : 'white';
  
  gameState.moveHistory.push(`${resigningPlayer} resigned`);
  showGameOverModal(winner, false, true, resigningPlayer, winner);
  gameState.gameEnded = true;
  
  // Show different messages for each player based on their perspective
  showToastForPlayer(`You resigned. ${winner} wins!`, 'info', resigningPlayer);
  showToastForPlayer(`${resigningPlayer} resigned. You win!`, 'success', winner);
}

function offerDraw() {
  const offeringPlayer = gameState.currentPlayer;
  
  if (confirm(`${offeringPlayer} offers a draw. Do you accept?`)) {
    gameState.moveHistory.push('Draw by mutual agreement');
    showGameOverModal(null, true, false, null, null);
    gameState.gameEnded = true;
    showToastForPlayer("Draw accepted!", 'info', 'white');
    showToastForPlayer("Draw accepted!", 'info', 'black');
  } else {
    const opponentPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';
    showToastForPlayer(`Draw declined by ${opponentPlayer}`, 'warning', 'white');
    showToastForPlayer(`Draw declined by ${opponentPlayer}`, 'warning', 'black');
  }
}

// Initialize the game when page loads
init();
