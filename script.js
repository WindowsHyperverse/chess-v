document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const statusDisplay = document.getElementById('status-display');
    const restartButton = document.getElementById('restart-button');
    const boardSize = 8;

    let board = [];
    let selectedPiece = null;
    let turn = 'white';

    const pieces = {
        'white': { 'rook': '♖', 'knight': '♘', 'bishop': '♗', 'queen': '♕', 'king': '♔', 'pawn': '♙' },
        'black': { 'rook': '♜', 'knight': '♞', 'bishop': '♝', 'queen': '♛', 'king': '♚', 'pawn': '♟' }
    };

    function initializeBoard() {
        board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));
        const initialPositions = {
            0: ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'],
            1: Array(8).fill('pawn'),
            6: Array(8).fill('pawn'),
            7: ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']
        };

        for (let row in initialPositions) {
            const color = row < 2 ? 'black' : 'white';
            for (let col = 0; col < boardSize; col++) {
                board[row][col] = { type: initialPositions[row][col], color: color };
            }
        }
    }

    function renderBoard() {
        gameBoard.innerHTML = '';
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                const square = document.createElement('div');
                square.classList.add('square', (row + col) % 2 === 0 ? 'light' : 'dark');
                square.dataset.row = row;
                square.dataset.col = col;

                const piece = board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('span');
                    pieceElement.classList.add('piece');
                    pieceElement.textContent = pieces[piece.color][piece.type];
                    pieceElement.style.color = piece.color === 'white' ? '#fff' : '#000';
                    square.appendChild(pieceElement);
                }
                
                square.addEventListener('click', () => onSquareClick(row, col));
                gameBoard.appendChild(square);
            }
        }
    }

    function onSquareClick(row, col) {
        if (selectedPiece) {
            const validMoves = getValidMoves(selectedPiece.piece, selectedPiece.row, selectedPiece.col);
            const move = validMoves.find(m => m.row === row && m.col === col);
            if (move) {
                movePiece({ row: selectedPiece.row, col: selectedPiece.col }, { row, col });
                resetSelection();
            } else if (board[row][col] && board[row][col].color === turn) {
                resetSelection();
                selectPiece(row, col);
            } else {
                resetSelection();
            }
        } else {
            const piece = board[row][col];
            if (piece && piece.color === turn) {
                selectPiece(row, col);
            }
        }
    }

    function selectPiece(row, col) {
        selectedPiece = { row, col, piece: board[row][col] };
        highlightSelection();
    }

    function resetSelection() {
        selectedPiece = null;
        removeHighlights();
    }

    function highlightSelection() {
        removeHighlights();
        if (!selectedPiece) return;

        const validMoves = getValidMoves(selectedPiece.piece, selectedPiece.row, selectedPiece.col);
        const originSquare = document.querySelector(`[data-row='${selectedPiece.row}'][data-col='${selectedPiece.col}']`);
        originSquare.classList.add('selected');
        
        validMoves.forEach(move => {
            const moveSquare = document.querySelector(`[data-row='${move.row}'][data-col='${move.col}']`);
            if (moveSquare) {
                 const moveIndicator = document.createElement('div');
                 moveIndicator.classList.add('valid-move');
                 moveSquare.appendChild(moveIndicator);
            }
        });
    }

    function removeHighlights() {
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        document.querySelectorAll('.valid-move').forEach(el => el.remove());
    }

    function movePiece(from, to) {
        const piece = board[from.row][from.col];
        board[to.row][to.col] = piece;
        board[from.row][from.col] = null;
        
        if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
            piece.type = 'queen'; // Auto-promote to Queen
        }
        
        turn = turn === 'white' ? 'black' : 'white';
        statusDisplay.textContent = `${turn.charAt(0).toUpperCase() + turn.slice(1)}'s Turn`;
        
        renderBoard();
    }

    function getValidMoves(piece, row, col) {
        switch (piece.type) {
            case 'pawn': return getPawnMoves(row, col, piece.color);
            case 'rook': return getSlidingMoves(row, col, piece.color, [[0, 1], [0, -1], [1, 0], [-1, 0]]);
            case 'knight': return getKnightMoves(row, col, piece.color);
            case 'bishop': return getSlidingMoves(row, col, piece.color, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
            case 'queen': return getSlidingMoves(row, col, piece.color, [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
            case 'king': return getKingMoves(row, col, piece.color);
            default: return [];
        }
    }

    function getPawnMoves(row, col, color) {
        const moves = [];
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;

        if (board[row + direction] && !board[row + direction][col]) {
            moves.push({ row: row + direction, col });
        }
        if (row === startRow && !board[row + direction][col] && !board[row + 2 * direction][col]) {
            moves.push({ row: row + 2 * direction, col });
        }
        [-1, 1].forEach(side => {
            if (col + side >= 0 && col + side < 8) {
                if (board[row + direction] && board[row + direction][col + side] && board[row + direction][col + side].color !== color) {
                    moves.push({ row: row + direction, col: col + side });
                }
            }
        });
        return moves;
    }
    
    function getKnightMoves(row, col, color) {
        const moves = [];
        const offsets = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]];
        offsets.forEach(([r_off, c_off]) => {
            const newRow = row + r_off;
            const newCol = col + c_off;
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const target = board[newRow][newCol];
                if (!target || target.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });
        return moves;
    }

    function getKingMoves(row, col, color) {
        const moves = [];
        const offsets = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        offsets.forEach(([r_off, c_off]) => {
            const newRow = row + r_off;
            const newCol = col + c_off;
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const target = board[newRow][newCol];
                if (!target || target.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });
        return moves;
    }

    function getSlidingMoves(row, col, color, directions) {
        const moves = [];
        directions.forEach(([r_dir, c_dir]) => {
            for (let i = 1; i < 8; i++) {
                const newRow = row + i * r_dir;
                const newCol = col + i * c_dir;
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    const target = board[newRow][newCol];
                    if (target) {
                        if (target.color !== color) {
                            moves.push({ row: newRow, col: newCol }); // Can capture
                        }
                        break; // Blocked by a piece
                    }
                    moves.push({ row: newRow, col: newCol }); // Empty square
                } else {
                    break; // Off board
                }
            }
        });
        return moves;
    }
    
    function startGame() {
        initializeBoard();
        renderBoard();
        turn = 'white';
        statusDisplay.textContent = "White's Turn";
        resetSelection();
    }
    
    restartButton.addEventListener('click', startGame);
    startGame();
});