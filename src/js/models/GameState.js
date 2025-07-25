import { Grid, EMPTY_CELL } from './Grid.js';
import { RuleEngine } from './RuleEngine.js';

const GAME_STATUS = {
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    PAUSED: 'paused'
};

const CELL_TYPE = {
    GIVEN: 'given',
    USER: 'user',
    EMPTY: 'empty'
};

class GameState {
    constructor() {
        this.originalPuzzle = new Grid();
        this.currentGrid = new Grid();
        this.cellTypes = this.createCellTypeGrid();
        this.moveHistory = [];
        this.startTime = null;
        this.endTime = null;
        this.status = GAME_STATUS.NOT_STARTED;
        this.ruleEngine = new RuleEngine();
    }

    createCellTypeGrid() {
        const grid = [];
        for (let row = 0; row < 9; row++) {
            grid[row] = [];
            for (let col = 0; col < 9; col++) {
                grid[row][col] = CELL_TYPE.EMPTY;
            }
        }
        return grid;
    }

    startNewGame(puzzle) {
        if (!puzzle) {
            return false;
        }

        this.originalPuzzle = puzzle.clone();
        this.currentGrid = puzzle.clone();
        this.cellTypes = this.createCellTypeGrid();
        this.moveHistory = [];
        this.startTime = Date.now();
        this.endTime = null;
        this.status = GAME_STATUS.IN_PROGRESS;

        this.initializeCellTypes();
        return true;
    }

    initializeCellTypes() {
        for (let row = 0; row < this.currentGrid.size; row++) {
            for (let col = 0; col < this.currentGrid.size; col++) {
                const value = this.currentGrid.getCellValue(row, col);
                this.cellTypes[row][col] = value !== EMPTY_CELL ? CELL_TYPE.GIVEN : CELL_TYPE.EMPTY;
            }
        }
    }

    makeMove(row, col, value) {
        if (this.status !== GAME_STATUS.IN_PROGRESS) {
            return false;
        }

        if (this.cellTypes[row][col] === CELL_TYPE.GIVEN) {
            return false;
        }

        const oldValue = this.currentGrid.getCellValue(row, col);
        
        const move = {
            row,
            col,
            oldValue,
            newValue: value,
            timestamp: Date.now()
        };

        this.currentGrid.setCellValue(row, col, value);
        this.cellTypes[row][col] = value === EMPTY_CELL ? CELL_TYPE.EMPTY : CELL_TYPE.USER;
        this.moveHistory.push(move);

        if (this.isComplete()) {
            this.endTime = Date.now();
            this.status = GAME_STATUS.COMPLETED;
        }

        return true;
    }

    undoMove() {
        if (this.moveHistory.length === 0 || this.status !== GAME_STATUS.IN_PROGRESS) {
            return false;
        }

        const lastMove = this.moveHistory.pop();
        this.currentGrid.setCellValue(lastMove.row, lastMove.col, lastMove.oldValue);
        this.cellTypes[lastMove.row][lastMove.col] = 
            lastMove.oldValue === EMPTY_CELL ? CELL_TYPE.EMPTY : CELL_TYPE.USER;

        return true;
    }

    resetGame() {
        if (!this.originalPuzzle) {
            return false;
        }

        this.currentGrid = this.originalPuzzle.clone();
        this.moveHistory = [];
        this.startTime = Date.now();
        this.endTime = null;
        this.status = GAME_STATUS.IN_PROGRESS;
        this.initializeCellTypes();

        return true;
    }

    isComplete() {
        if (!this.currentGrid.isFull()) {
            return false;
        }

        const violations = this.ruleEngine.getAllViolations(this.currentGrid);
        return violations.length === 0;
    }

    getElapsedTime() {
        if (!this.startTime) {
            return 0;
        }

        const endTime = this.endTime || Date.now();
        return endTime - this.startTime;
    }

    getFormattedTime() {
        const elapsed = this.getElapsedTime();
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    getCellValue(row, col) {
        return this.currentGrid.getCellValue(row, col);
    }

    getCellType(row, col) {
        if (!this.currentGrid.isValidPosition(row, col)) {
            return null;
        }
        return this.cellTypes[row][col];
    }

    getGameStatus() {
        return this.status;
    }

    validateCurrentMove(row, col, value) {
        return this.ruleEngine.validateMove(this.currentGrid, row, col, value);
    }

    getCurrentViolations() {
        return this.ruleEngine.getAllViolations(this.currentGrid);
    }

    pauseGame() {
        if (this.status === GAME_STATUS.IN_PROGRESS) {
            this.status = GAME_STATUS.PAUSED;
            return true;
        }
        return false;
    }

    resumeGame() {
        if (this.status === GAME_STATUS.PAUSED) {
            this.status = GAME_STATUS.IN_PROGRESS;
            return true;
        }
        return false;
    }
}

export { GameState, GAME_STATUS, CELL_TYPE };