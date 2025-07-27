import { Grid, EMPTY_CELL } from './Grid.js';
import { RuleEngine } from './RuleEngine.js';

const GRID_SIZE = 9;
const MINUTES_TO_MS = 60000;
const SECONDS_TO_MS = 1000;
const TIME_PAD_LENGTH = 2;
const BASE64_PADDING_DIVISOR = 4;

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
        this.pauseStartTime = null;
        this.totalPausedTime = 0;
        this.status = GAME_STATUS.NOT_STARTED;
        this.ruleEngine = new RuleEngine();
        this.savedGameState = null;
        this.highlightRangeEnabled = false;
    }

    createCellTypeGrid() {
        const grid = [];
        for (let row = 0; row < GRID_SIZE; row++) {
            grid[row] = [];
            for (let col = 0; col < GRID_SIZE; col++) {
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
        this.pauseStartTime = null;
        this.totalPausedTime = 0;
        this.status = GAME_STATUS.IN_PROGRESS;
        this.clearSavedState();

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
            timestamp: Date.now(),
            type: 'main'
        };

        this.currentGrid.setCellValue(row, col, value);
        this.cellTypes[row][col] = value === EMPTY_CELL ? CELL_TYPE.EMPTY : CELL_TYPE.USER;
        this.moveHistory.push(move);

        // 通常入力時に関連候補を自動削除
        if (value !== EMPTY_CELL) {
            this.clearRelatedCandidates(row, col, value);
        }

        if (this.isComplete()) {
            this.endTime = Date.now();
            this.status = GAME_STATUS.COMPLETED;
        }

        return true;
    }

    makeCandidateMove(row, col, value, action = 'toggle') {
        if (this.status !== GAME_STATUS.IN_PROGRESS) {
            return false;
        }

        if (this.cellTypes[row][col] === CELL_TYPE.GIVEN) {
            return false;
        }

        const oldCandidates = this.currentGrid.getCandidates(row, col);
        let newCandidates;
        let success = false;

        if (action === 'toggle') {
            success = this.currentGrid.toggleCandidate(row, col, value);
            newCandidates = this.currentGrid.getCandidates(row, col);
        } else if (action === 'add') {
            success = this.currentGrid.addCandidate(row, col, value);
            newCandidates = this.currentGrid.getCandidates(row, col);
        } else if (action === 'remove') {
            success = this.currentGrid.removeCandidate(row, col, value);
            newCandidates = this.currentGrid.getCandidates(row, col);
        }

        if (!success) {
            return false;
        }

        const move = {
            row,
            col,
            oldCandidates: new Set(oldCandidates),
            newCandidates: new Set(newCandidates),
            timestamp: Date.now(),
            type: 'candidate'
        };

        this.moveHistory.push(move);
        return true;
    }

    undoMove() {
        if (this.moveHistory.length === 0 || this.status !== GAME_STATUS.IN_PROGRESS) {
            return false;
        }

        const lastMove = this.moveHistory.pop();
        
        if (lastMove.type === 'main') {
            this.currentGrid.setCellValue(lastMove.row, lastMove.col, lastMove.oldValue);
            this.cellTypes[lastMove.row][lastMove.col] = 
                lastMove.oldValue === EMPTY_CELL ? CELL_TYPE.EMPTY : CELL_TYPE.USER;
        } else if (lastMove.type === 'candidate') {
            this.currentGrid.setCandidates(lastMove.row, lastMove.col, lastMove.oldCandidates);
        } else if (lastMove.type === 'auto_clear_candidates') {
            // 自動削除された候補を復元
            lastMove.clearedCandidates.forEach(({ row, col, oldCandidates }) => {
                this.currentGrid.setCandidates(row, col, oldCandidates);
            });
        }

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
        this.pauseStartTime = null;
        this.totalPausedTime = 0;
        this.status = GAME_STATUS.IN_PROGRESS;
        this.clearSavedState();
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

        let currentTime = this.endTime || Date.now();
        let totalElapsed = currentTime - this.startTime;
        
        // 一時停止中の時間を計算
        let pausedTime = this.totalPausedTime;
        if (this.status === GAME_STATUS.PAUSED && this.pauseStartTime) {
            pausedTime += currentTime - this.pauseStartTime;
        }
        
        return totalElapsed - pausedTime;
    }

    getFormattedTime() {
        const elapsed = this.getElapsedTime();
        const minutes = Math.floor(elapsed / MINUTES_TO_MS);
        const seconds = Math.floor((elapsed % MINUTES_TO_MS) / SECONDS_TO_MS);
        return `${minutes.toString().padStart(TIME_PAD_LENGTH, '0')}:${seconds.toString().padStart(TIME_PAD_LENGTH, '0')}`;
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

    getCandidates(row, col) {
        return this.currentGrid.getCandidates(row, col);
    }

    setCandidates(row, col, candidatesSet) {
        return this.currentGrid.setCandidates(row, col, candidatesSet);
    }

    clearCandidates(row, col) {
        return this.currentGrid.clearCandidates(row, col);
    }

    hasCandidates(row, col) {
        return this.currentGrid.hasCandidates(row, col);
    }

    clearRelatedCandidates(row, col, value) {
        const relatedCells = this.currentGrid.getRelatedCells(row, col);
        const clearedCandidates = [];

        relatedCells.forEach(({ row: r, col: c }) => {
            if (this.currentGrid.getCandidates(r, c).has(value)) {
                const oldCandidates = this.currentGrid.getCandidates(r, c);
                this.currentGrid.removeCandidate(r, c, value);
                const newCandidates = this.currentGrid.getCandidates(r, c);

                clearedCandidates.push({
                    row: r,
                    col: c,
                    oldCandidates: new Set(oldCandidates),
                    newCandidates: new Set(newCandidates)
                });
            }
        });

        // 候補削除操作を履歴に追加
        if (clearedCandidates.length > 0) {
            const autoClearMove = {
                row,
                col,
                value,
                clearedCandidates,
                timestamp: Date.now(),
                type: 'auto_clear_candidates'
            };
            this.moveHistory.push(autoClearMove);
        }
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
            this.pauseStartTime = Date.now();
            return true;
        }
        return false;
    }

    resumeGame() {
        if (this.status === GAME_STATUS.PAUSED) {
            if (this.pauseStartTime) {
                this.totalPausedTime += Date.now() - this.pauseStartTime;
                this.pauseStartTime = null;
            }
            this.status = GAME_STATUS.IN_PROGRESS;
            return true;
        }
        return false;
    }

    getNumberUsageCount(number) {
        if (number < 1 || number > GRID_SIZE) {
            return 0;
        }

        let count = 0;
        for (let row = 0; row < this.currentGrid.size; row++) {
            for (let col = 0; col < this.currentGrid.size; col++) {
                if (this.currentGrid.getCellValue(row, col) === number) {
                    count++;
                }
            }
        }
        return count;
    }

    isNumberComplete(number) {
        return this.getNumberUsageCount(number) === GRID_SIZE;
    }

    getAllNumberUsage() {
        const usage = {};
        for (let num = 1; num <= GRID_SIZE; num++) {
            usage[num] = {
                count: this.getNumberUsageCount(num),
                complete: this.isNumberComplete(num)
            };
        }
        return usage;
    }

    saveGameState() {
        if (this.status !== GAME_STATUS.IN_PROGRESS) {
            return false;
        }

        this.savedGameState = {
            grid: this.currentGrid.clone(),
            cellTypes: this.deepCloneCellTypes(),
            moveHistory: this.deepCloneMoveHistory(),
            timestamp: Date.now()
        };

        return true;
    }

    restoreGameState() {
        if (!this.savedGameState) {
            return false;
        }

        if (this.status !== GAME_STATUS.IN_PROGRESS) {
            return false;
        }

        this.currentGrid = this.savedGameState.grid.clone();
        this.cellTypes = this.deepCloneCellTypes(this.savedGameState.cellTypes);
        this.moveHistory = this.deepCloneMoveHistory(this.savedGameState.moveHistory);

        return true;
    }

    hasSavedState() {
        return this.savedGameState !== null;
    }

    clearSavedState() {
        this.savedGameState = null;
    }

    toggleHighlightRange() {
        this.highlightRangeEnabled = !this.highlightRangeEnabled;
        return this.highlightRangeEnabled;
    }

    isHighlightRangeEnabled() {
        return this.highlightRangeEnabled;
    }

    deepCloneCellTypes(sourceTypes = null) {
        const source = sourceTypes || this.cellTypes;
        const clonedTypes = [];
        
        for (let row = 0; row < GRID_SIZE; row++) {
            clonedTypes[row] = [];
            for (let col = 0; col < GRID_SIZE; col++) {
                clonedTypes[row][col] = source[row][col];
            }
        }
        
        return clonedTypes;
    }

    deepCloneMoveHistory(sourceHistory = null) {
        const source = sourceHistory || this.moveHistory;
        return source.map(move => {
            if (move.type === 'candidate') {
                return {
                    ...move,
                    oldCandidates: new Set(move.oldCandidates),
                    newCandidates: new Set(move.newCandidates)
                };
            } else if (move.type === 'auto_clear_candidates') {
                return {
                    ...move,
                    clearedCandidates: move.clearedCandidates.map(cleared => ({
                        ...cleared,
                        oldCandidates: new Set(cleared.oldCandidates),
                        newCandidates: new Set(cleared.newCandidates)
                    }))
                };
            }
            return { ...move };
        });
    }

    generateSpell() {
        if (!this.originalPuzzle) {
            return null;
        }

        try {
            // 9x9グリッドデータを1次元配列に変換
            const gridData = [];
            for (let row = 0; row < GRID_SIZE; row++) {
                for (let col = 0; col < GRID_SIZE; col++) {
                    gridData.push(this.originalPuzzle.getCellValue(row, col));
                }
            }

            // JSON文字列化してBase64エンコード
            const jsonString = JSON.stringify(gridData);
            const base64String = btoa(jsonString);
            
            // URLセーフなBase64に変換
            return base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        } catch (error) {
            // Silent error handling for spell generation
            return null;
        }
    }

    parseSpell(spellString) {
        if (!spellString || typeof spellString !== 'string') {
            return null;
        }

        try {
            const gridData = this.decodeSpellString(spellString);
            if (!gridData) {
                return null;
            }

            if (!this.validateGridData(gridData)) {
                return null;
            }

            return this.createGridFromData(gridData);
        } catch (error) {
            // Silent error handling for spell parsing
            return null;
        }
    }

    decodeSpellString(spellString) {
        try {
            // URLセーフなBase64を通常のBase64に復元
            let base64String = spellString.replace(/-/g, '+').replace(/_/g, '/');
            
            // パディングを追加
            const padLength = (BASE64_PADDING_DIVISOR - (base64String.length % BASE64_PADDING_DIVISOR)) % BASE64_PADDING_DIVISOR;
            base64String += '='.repeat(padLength);

            // Base64デコードしてJSON解析
            const jsonString = atob(base64String);
            return JSON.parse(jsonString);
        } catch (error) {
            return null;
        }
    }

    validateGridData(gridData) {
        if (!Array.isArray(gridData) || gridData.length !== GRID_SIZE * GRID_SIZE) {
            return false;
        }

        for (const value of gridData) {
            if (!Number.isInteger(value) || value < 0 || value > GRID_SIZE) {
                return false;
            }
        }

        return true;
    }

    createGridFromData(gridData) {
        const grid = new Grid();
        let index = 0;
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                grid.setCellValue(row, col, gridData[index]);
                index++;
            }
        }
        return grid;
    }

    startGameFromSpell(spellString) {
        const puzzle = this.parseSpell(spellString);
        if (!puzzle) {
            return false;
        }

        return this.startNewGame(puzzle);
    }
}

export { GameState, GAME_STATUS, CELL_TYPE };