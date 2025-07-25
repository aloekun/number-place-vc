import { EMPTY_CELL } from '../models/Grid.js';
import { CELL_TYPE, GAME_STATUS } from '../models/GameState.js';

class UIController {
    constructor(gameState, ruleEngine) {
        this.gameState = gameState;
        this.ruleEngine = ruleEngine;
        this.selectedCell = null;
        this.gridElement = null;
        this.timerInterval = null;
        this.candidateMode = false;
        
        this.initializeUI();
        this.bindEvents();
    }

    initializeUI() {
        this.gridElement = document.getElementById('sudoku-grid');
        this.renderGrid();
        this.updateNumberUsage();
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

        document.getElementById('toggle-input-mode').addEventListener('click', () => {
            this.toggleInputMode();
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
        const candidates = this.gameState.getCandidates(row, col);

        // Main value element
        const mainValue = document.createElement('div');
        mainValue.className = 'main-value';
        if (value !== EMPTY_CELL) {
            mainValue.textContent = value;
        }
        cell.appendChild(mainValue);

        // Candidate grid element
        const candidateGrid = this.createCandidateGrid(candidates);
        cell.appendChild(candidateGrid);

        // Update cell classes
        if (cellType === CELL_TYPE.GIVEN) {
            cell.classList.add('given');
        } else if (cellType === CELL_TYPE.USER) {
            cell.classList.add('user-input');
        }

        // Show candidates if cell is empty and has candidates
        if (value === EMPTY_CELL && candidates.size > 0) {
            cell.classList.add('has-candidates');
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
            if (event.shiftKey) {
                // Shift + number = candidate mode
                this.handleCandidateInput(number);
            } else {
                this.handleNumberInput(number);
            }
        } else if (key === 'Delete' || key === 'Backspace' || key === '0') {
            this.handleNumberInput(EMPTY_CELL);
        } else if (key === 'Escape') {
            this.selectedCell = null;
            this.updateCellSelection();
        } else if (key === 'c' || key === 'C') {
            this.toggleInputMode();
        }
    }

    handleNumberInput(number) {
        if (!this.selectedCell) return;

        const { row, col } = this.selectedCell;
        
        if (this.candidateMode) {
            this.handleCandidateInput(number);
        } else {
            if (this.gameState.makeMove(row, col, number)) {
                this.updateCell(row, col);
                this.updateRelatedCells(row, col);
                this.updateNumberUsage();
                this.showValidationErrors();
                this.updateGameStatus();
            }
        }
    }

    updateCell(row, col) {
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!cellElement) return;

        const value = this.gameState.getCellValue(row, col);
        const cellType = this.gameState.getCellType(row, col);
        const candidates = this.gameState.getCandidates(row, col);

        // Update main value
        const mainValue = cellElement.querySelector('.main-value');
        if (mainValue) {
            mainValue.textContent = value !== EMPTY_CELL ? value : '';
        }

        // Update candidate grid
        const candidateGrid = cellElement.querySelector('.candidate-grid');
        if (candidateGrid) {
            this.updateCandidateGrid(candidateGrid, candidates);
        }
        
        cellElement.classList.remove('user-input', 'error', 'has-candidates');
        
        if (cellType === CELL_TYPE.USER) {
            cellElement.classList.add('user-input');
        }

        // Show candidates if cell is empty and has candidates
        if (value === EMPTY_CELL && candidates.size > 0) {
            cellElement.classList.add('has-candidates');
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
            this.updateNumberUsage();
            this.updateGameStatus();
        }
    }

    handleUndoMove() {
        if (this.gameState.undoMove()) {
            this.renderGrid();
            this.updateNumberUsage();
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

    createCandidateGrid(candidates) {
        const candidateGrid = document.createElement('div');
        candidateGrid.className = 'candidate-grid';
        
        for (let i = 1; i <= 9; i++) {
            const candidateNumber = document.createElement('div');
            candidateNumber.className = 'candidate-number';
            candidateNumber.textContent = i;
            
            if (candidates.has(i)) {
                candidateNumber.classList.add('visible');
            }
            
            candidateGrid.appendChild(candidateNumber);
        }
        
        return candidateGrid;
    }

    updateCandidateGrid(candidateGrid, candidates) {
        const candidateNumbers = candidateGrid.querySelectorAll('.candidate-number');
        candidateNumbers.forEach((element, index) => {
            const number = index + 1;
            if (candidates.has(number)) {
                element.classList.add('visible');
            } else {
                element.classList.remove('visible');
            }
        });
    }

    handleCandidateInput(number) {
        if (!this.selectedCell) return;

        const { row, col } = this.selectedCell;
        
        if (this.gameState.makeCandidateMove(row, col, number, 'toggle')) {
            this.updateCell(row, col);
        }
    }

    toggleInputMode() {
        this.candidateMode = !this.candidateMode;
        this.updateInputModeIndicator();
    }

    updateInputModeIndicator() {
        const indicator = document.getElementById('input-mode-indicator');
        if (indicator) {
            if (this.candidateMode) {
                indicator.classList.add('candidate-mode');
                indicator.textContent = '候補入力';
            } else {
                indicator.classList.remove('candidate-mode');
                indicator.textContent = '通常入力';
            }
        }
    }

    updateRelatedCells(row, col) {
        const relatedCells = this.gameState.currentGrid.getRelatedCells(row, col);
        relatedCells.forEach(({ row: r, col: c }) => {
            this.updateCell(r, c);
        });
    }

    updateNumberUsage() {
        const usage = this.gameState.getAllNumberUsage();
        
        for (let num = 1; num <= 9; num++) {
            const element = document.querySelector(`.usage-number[data-number="${num}"]`);
            if (element) {
                if (usage[num].complete) {
                    element.classList.add('complete');
                } else {
                    element.classList.remove('complete');
                }
            }
        }
    }

    onPuzzleLoaded(puzzle) {
        if (this.gameState.startNewGame(puzzle)) {
            this.renderGrid();
            this.selectedCell = null;
            this.updateCellSelection();
            this.updateNumberUsage();
            this.updateGameStatus();
        }
    }
}

export { UIController };