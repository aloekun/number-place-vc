import { EMPTY_CELL } from '../models/Grid.js';
import { CELL_TYPE, GAME_STATUS } from '../models/GameState.js';

class UIController {
    constructor(gameState, ruleEngine) {
        this.gameState = gameState;
        this.ruleEngine = ruleEngine;
        this.selectedCell = null;
        this.gridElement = null;
        this.timerInterval = null;
        
        this.initializeUI();
        this.bindEvents();
    }

    initializeUI() {
        this.gridElement = document.getElementById('sudoku-grid');
        this.renderGrid();
        this.startTimer();
    }

    bindEvents() {
        document.getElementById('new-game').addEventListener('click', () => {
            this.handleNewGame();
        });

        document.getElementById('reset-game').addEventListener('click', () => {
            this.handleResetGame();
        });

        document.getElementById('undo-move').addEventListener('click', () => {
            this.handleUndoMove();
        });

        document.addEventListener('keydown', (event) => {
            this.handleKeyInput(event);
        });

        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', (event) => {
                const number = parseInt(event.target.dataset.number);
                this.handleNumberInput(number);
            });
        });
    }

    renderGrid() {
        if (!this.gridElement) return;

        this.gridElement.innerHTML = '';

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = this.createCellElement(row, col);
                this.gridElement.appendChild(cell);
            }
        }
    }

    createCellElement(row, col) {
        const cell = document.createElement('div');
        cell.className = 'sudoku-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;

        const value = this.gameState.getCellValue(row, col);
        const cellType = this.gameState.getCellType(row, col);

        if (value !== EMPTY_CELL) {
            cell.textContent = value;
        }

        if (cellType === CELL_TYPE.GIVEN) {
            cell.classList.add('given');
        } else if (cellType === CELL_TYPE.USER) {
            cell.classList.add('user-input');
        }

        cell.addEventListener('click', () => {
            this.handleCellClick(row, col);
        });

        return cell;
    }

    handleCellClick(row, col) {
        if (this.gameState.getGameStatus() !== GAME_STATUS.IN_PROGRESS) {
            return;
        }

        if (this.gameState.getCellType(row, col) === CELL_TYPE.GIVEN) {
            return;
        }

        this.selectedCell = { row, col };
        this.updateCellSelection();
    }

    updateCellSelection() {
        document.querySelectorAll('.sudoku-cell').forEach(cell => {
            cell.classList.remove('selected');
        });

        if (this.selectedCell) {
            const selectedElement = document.querySelector(
                `[data-row="${this.selectedCell.row}"][data-col="${this.selectedCell.col}"]`
            );
            if (selectedElement) {
                selectedElement.classList.add('selected');
            }
        }
    }

    handleKeyInput(event) {
        if (!this.selectedCell) return;

        const key = event.key;
        
        if (key >= '1' && key <= '9') {
            const number = parseInt(key);
            this.handleNumberInput(number);
        } else if (key === 'Delete' || key === 'Backspace' || key === '0') {
            this.handleNumberInput(EMPTY_CELL);
        } else if (key === 'Escape') {
            this.selectedCell = null;
            this.updateCellSelection();
        }
    }

    handleNumberInput(number) {
        if (!this.selectedCell) return;

        const { row, col } = this.selectedCell;
        
        if (this.gameState.makeMove(row, col, number)) {
            this.updateCell(row, col);
            this.showValidationErrors();
            this.updateGameStatus();
        }
    }

    updateCell(row, col) {
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!cellElement) return;

        const value = this.gameState.getCellValue(row, col);
        const cellType = this.gameState.getCellType(row, col);

        cellElement.textContent = value !== EMPTY_CELL ? value : '';
        
        cellElement.classList.remove('user-input', 'error');
        
        if (cellType === CELL_TYPE.USER) {
            cellElement.classList.add('user-input');
        }
    }

    showValidationErrors() {
        document.querySelectorAll('.sudoku-cell').forEach(cell => {
            cell.classList.remove('error');
        });

        const violations = this.gameState.getCurrentViolations();
        violations.forEach(violation => {
            const cellElement = document.querySelector(
                `[data-row="${violation.row}"][data-col="${violation.col}"]`
            );
            if (cellElement) {
                cellElement.classList.add('error');
            }
        });
    }

    updateGameStatus() {
        const statusElement = document.getElementById('game-status');
        if (!statusElement) return;

        const status = this.gameState.getGameStatus();
        
        switch (status) {
            case GAME_STATUS.NOT_STARTED:
                statusElement.textContent = '問題を生成してください';
                break;
            case GAME_STATUS.IN_PROGRESS:
                statusElement.textContent = 'プレイ中';
                break;
            case GAME_STATUS.COMPLETED:
                statusElement.textContent = `完了！時間: ${this.gameState.getFormattedTime()}`;
                this.showGameComplete();
                break;
            case GAME_STATUS.PAUSED:
                statusElement.textContent = '一時停止中';
                break;
        }
    }

    showGameComplete() {
        this.stopTimer();
        setTimeout(() => {
            alert(`おめでとうございます！\n完了時間: ${this.gameState.getFormattedTime()}`);
        }, 100);
    }

    handleNewGame() {
        this.dispatchEvent('newGameRequested');
    }

    handleResetGame() {
        if (this.gameState.resetGame()) {
            this.renderGrid();
            this.selectedCell = null;
            this.updateCellSelection();
            this.updateGameStatus();
        }
    }

    handleUndoMove() {
        if (this.gameState.undoMove()) {
            this.renderGrid();
            this.showValidationErrors();
            this.updateGameStatus();
        }
    }

    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimer() {
        const timerElement = document.getElementById('elapsed-time');
        if (timerElement && this.gameState.getGameStatus() === GAME_STATUS.IN_PROGRESS) {
            timerElement.textContent = this.gameState.getFormattedTime();
        }
    }

    dispatchEvent(eventName, data = null) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }

    onPuzzleLoaded(puzzle) {
        if (this.gameState.startNewGame(puzzle)) {
            this.renderGrid();
            this.selectedCell = null;
            this.updateCellSelection();
            this.updateGameStatus();
        }
    }
}

export { UIController };