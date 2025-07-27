import { EMPTY_CELL, GRID_SIZE } from '../models/Grid.js';
import { CELL_TYPE, GAME_STATUS } from '../models/GameState.js';
const ALERT_DELAY_MS = 100;
const TIMER_INTERVAL_MS = 1000;
const FEEDBACK_DISPLAY_MS = 1000;
const FOCUS_DELAY_MS = 100;

class UIController {
    constructor(gameState, ruleEngine) {
        this.gameState = gameState;
        this.ruleEngine = ruleEngine;
        this.selectedNumber = null;
        this.gridElement = null;
        this.timerInterval = null;
        this.candidateMode = false;
        
        this.initializeUI();
        this.bindEvents();
        this.updateSaveRestoreButtons();
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

        document.getElementById('pause-game').addEventListener('click', () => {
            this.handlePauseGame();
        });

        document.getElementById('resume-game').addEventListener('click', () => {
            this.handleResumeGame();
        });

        document.getElementById('save-state').addEventListener('click', () => {
            this.handleSaveState();
        });

        document.getElementById('restore-state').addEventListener('click', () => {
            this.handleRestoreState();
        });

        document.getElementById('spell-puzzle').addEventListener('click', () => {
            this.handleSpellPuzzle();
        });

        document.getElementById('get-spell').addEventListener('click', () => {
            this.handleGetSpell();
        });

        document.getElementById('spell-load').addEventListener('click', () => {
            this.handleSpellLoad();
        });

        document.getElementById('spell-cancel').addEventListener('click', () => {
            this.hideSpellInputDialog();
        });

        document.getElementById('spell-copy').addEventListener('click', () => {
            this.handleSpellCopy();
        });

        document.getElementById('spell-close').addEventListener('click', () => {
            this.hideSpellDisplayDialog();
        });

        document.addEventListener('keydown', (event) => {
            this.handleKeyInput(event);
        });

        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', (event) => {
                const number = parseInt(event.target.dataset.number);
                this.handleNumberSelect(number);
            });
        });

        document.getElementById('toggle-input-mode').addEventListener('click', () => {
            this.toggleInputMode();
        });

        document.getElementById('highlight-range-toggle').addEventListener('change', (e) => {
            this.handleHighlightRangeToggle(e.target.checked);
        });
    }

    renderGrid() {
        if (!this.gridElement) return;

        this.gridElement.innerHTML = '';

        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
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

        if (this.gameState.getGameStatus() === GAME_STATUS.PAUSED) {
            return;
        }

        if (this.gameState.getCellType(row, col) === CELL_TYPE.GIVEN) {
            return;
        }

        if (this.selectedNumber === null) {
            return;
        }

        this.handleCellInput(row, col, this.selectedNumber);
        this.updateHighlightRange();
    }

    updateNumberSelection() {
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        if (this.selectedNumber !== null) {
            const selectedButton = document.querySelector(
                `.number-btn[data-number="${this.selectedNumber}"]`
            );
            if (selectedButton) {
                selectedButton.classList.add('selected');
            }
        }
    }

    handleKeyInput(event) {
        const key = event.key;
        
        if (key >= '1' && key <= '9') {
            const number = parseInt(key);
            this.handleNumberSelect(number);
        } else if (key === 'Delete' || key === 'Backspace' || key === '0') {
            this.handleNumberSelect(EMPTY_CELL);
        } else if (key === 'Escape') {
            this.selectedNumber = null;
            this.updateNumberSelection();
        } else if (key === 'c' || key === 'C') {
            this.toggleInputMode();
        }
    }

    handleNumberSelect(number) {
        if (this.gameState.getGameStatus() === GAME_STATUS.PAUSED) {
            return;
        }

        this.selectedNumber = number;
        this.updateNumberSelection();
        this.updateHighlightRange();
    }

    handleCellInput(row, col, number) {
        if (this.candidateMode) {
            this.handleCandidateInputAt(row, col, number);
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
                statusElement.textContent = 'ゲーム一時停止中';
                break;
        }
    }

    showGameComplete() {
        this.stopTimer();
        setTimeout(() => {
            alert(`おめでとうございます！\n完了時間: ${this.gameState.getFormattedTime()}`);
        }, ALERT_DELAY_MS);
    }

    handleNewGame() {
        this.dispatchEvent('newGameRequested');
    }

    handleResetGame() {
        if (this.gameState.getGameStatus() === GAME_STATUS.PAUSED) {
            return;
        }

        if (this.gameState.resetGame()) {
            this.renderGrid();
            this.selectedNumber = null;
            this.updateNumberSelection();
            this.updateNumberUsage();
            this.updateGameStatus();
            this.updateSaveRestoreButtons();
            this.updateHighlightRange();
        }
    }

    handleUndoMove() {
        if (this.gameState.getGameStatus() === GAME_STATUS.PAUSED) {
            return;
        }

        if (this.gameState.undoMove()) {
            this.renderGrid();
            this.updateNumberUsage();
            this.showValidationErrors();
            this.updateGameStatus();
            this.updateSaveRestoreButtons();
            this.updateHighlightRange();
        }
    }

    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, TIMER_INTERVAL_MS);
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
        
        for (let i = 1; i <= GRID_SIZE; i++) {
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

    handleCandidateInputAt(row, col, number) {
        if (this.gameState.makeCandidateMove(row, col, number, 'toggle')) {
            this.updateCell(row, col);
        }
    }

    toggleInputMode() {
        if (this.gameState.getGameStatus() === GAME_STATUS.PAUSED) {
            return;
        }

        this.candidateMode = !this.candidateMode;
        this.updateInputModeIndicator();
    }

    handlePauseGame() {
        if (this.gameState.getGameStatus() !== GAME_STATUS.IN_PROGRESS) {
            return;
        }

        if (this.gameState.pauseGame()) {
            this.showPauseOverlay();
            this.updateGameStatus();
            this.updateSaveRestoreButtons();
        }
    }

    handleResumeGame() {
        if (this.gameState.getGameStatus() !== GAME_STATUS.PAUSED) {
            return;
        }

        if (this.gameState.resumeGame()) {
            this.hidePauseOverlay();
            this.updateGameStatus();
            this.updateSaveRestoreButtons();
        }
    }

    showPauseOverlay() {
        const overlay = document.getElementById('pause-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    hidePauseOverlay() {
        const overlay = document.getElementById('pause-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
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
        
        for (let num = 1; num <= GRID_SIZE; num++) {
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

    handleSaveState() {
        if (this.gameState.getGameStatus() === GAME_STATUS.PAUSED) {
            return;
        }

        if (this.gameState.saveGameState()) {
            this.updateSaveRestoreButtons();
            // 保存成功の視覚的フィードバック
            const saveButton = document.getElementById('save-state');
            const originalText = saveButton.textContent;
            saveButton.textContent = '保存完了!';
            setTimeout(() => {
                saveButton.textContent = originalText;
            }, FEEDBACK_DISPLAY_MS);
        }
    }

    handleRestoreState() {
        if (this.gameState.getGameStatus() === GAME_STATUS.PAUSED) {
            return;
        }

        if (this.gameState.restoreGameState()) {
            this.renderGrid();
            this.selectedNumber = null;
            this.updateNumberSelection();
            this.updateNumberUsage();
            this.showValidationErrors();
            this.updateGameStatus();
            this.updateHighlightRange();
            
            // 復元成功の視覚的フィードバック
            const restoreButton = document.getElementById('restore-state');
            const originalText = restoreButton.textContent;
            restoreButton.textContent = '復元完了!';
            setTimeout(() => {
                restoreButton.textContent = originalText;
            }, FEEDBACK_DISPLAY_MS);
        }
    }

    updateSaveRestoreButtons() {
        const saveButton = document.getElementById('save-state');
        const restoreButton = document.getElementById('restore-state');
        
        if (!saveButton || !restoreButton) return;

        const gameStatus = this.gameState.getGameStatus();
        const isGameInProgress = gameStatus === GAME_STATUS.IN_PROGRESS;
        const hasSavedState = this.gameState.hasSavedState();

        // 保存ボタンはゲーム進行中のみ有効
        saveButton.disabled = !isGameInProgress;
        
        // 復元ボタンはゲーム進行中かつ保存データがある場合のみ有効
        restoreButton.disabled = !isGameInProgress || !hasSavedState;
    }

    handleSpellPuzzle() {
        this.showSpellInputDialog();
    }

    handleGetSpell() {
        const spell = this.gameState.generateSpell();
        if (spell) {
            this.showSpellDisplayDialog(spell);
        } else {
            alert('呪文を生成できませんでした。まず問題を生成してください。');
        }
    }

    handleSpellLoad() {
        const spellInput = document.getElementById('spell-input');
        const spell = spellInput.value.trim();
        
        if (!spell) {
            alert('呪文を入力してください。');
            return;
        }

        if (this.gameState.startGameFromSpell(spell)) {
            this.hideSpellInputDialog();
            this.renderGrid();
            this.selectedNumber = null;
            this.updateNumberSelection();
            this.updateNumberUsage();
            this.updateGameStatus();
            this.updateSaveRestoreButtons();
            spellInput.value = '';
        } else {
            alert('無効な呪文です。正しい呪文を入力してください。');
        }
    }

    handleSpellCopy() {
        const spellOutput = document.getElementById('spell-output');
        
        // クリップボードAPIを使用
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(spellOutput.value).then(() => {
                const copyButton = document.getElementById('spell-copy');
                const originalText = copyButton.textContent;
                copyButton.textContent = 'コピーしました!';
                setTimeout(() => {
                    copyButton.textContent = originalText;
                }, FEEDBACK_DISPLAY_MS);
            }).catch(() => {
                // フォールバック: テキストエリアを選択
                this.fallbackCopySpell(spellOutput);
            });
        } else {
            // フォールバック: テキストエリアを選択
            this.fallbackCopySpell(spellOutput);
        }
    }

    fallbackCopySpell(textArea) {
        textArea.select();
        textArea.setSelectionRange(0, textArea.value.length);
        
        try {
            document.execCommand('copy');
            const copyButton = document.getElementById('spell-copy');
            const originalText = copyButton.textContent;
            copyButton.textContent = 'コピーしました!';
            setTimeout(() => {
                copyButton.textContent = originalText;
            }, FEEDBACK_DISPLAY_MS);
        } catch (err) {
            alert('コピーに失敗しました。手動で選択してコピーしてください。');
        }
    }

    showSpellInputDialog() {
        const overlay = document.getElementById('spell-input-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            // フォーカスを当てる
            setTimeout(() => {
                const input = document.getElementById('spell-input');
                if (input) {
                    input.focus();
                }
            }, FOCUS_DELAY_MS);
        }
    }

    hideSpellInputDialog() {
        const overlay = document.getElementById('spell-input-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            // 入力値をクリア
            const input = document.getElementById('spell-input');
            if (input) {
                input.value = '';
            }
        }
    }

    showSpellDisplayDialog(spell) {
        const overlay = document.getElementById('spell-display-overlay');
        const output = document.getElementById('spell-output');
        
        if (overlay && output) {
            output.value = spell;
            overlay.style.display = 'flex';
            // テキストエリアを選択状態にする
            setTimeout(() => {
                output.select();
                output.setSelectionRange(0, output.value.length);
            }, FOCUS_DELAY_MS);
        }
    }

    hideSpellDisplayDialog() {
        const overlay = document.getElementById('spell-display-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    onPuzzleLoaded(puzzle) {
        if (this.gameState.startNewGame(puzzle)) {
            this.hidePauseOverlay();
            this.renderGrid();
            this.selectedNumber = null;
            this.updateNumberSelection();
            this.updateNumberUsage();
            this.updateGameStatus();
            this.updateSaveRestoreButtons();
            this.updateHighlightRange();
        }
    }

    handleHighlightRangeToggle(enabled) {
        this.gameState.highlightRangeEnabled = enabled;
        this.updateHighlightRange();
    }

    updateHighlightRange() {
        // Clear all existing highlights
        const cells = document.querySelectorAll('.sudoku-cell');
        cells.forEach(cell => {
            cell.classList.remove('highlight-range');
        });

        // If feature is disabled or no number selected, return
        if (!this.gameState.isHighlightRangeEnabled() || !this.selectedNumber || this.selectedNumber === EMPTY_CELL) {
            return;
        }

        // Get cells to highlight
        const highlightCells = this.gameState.currentGrid.getHighlightCells(this.selectedNumber);

        // Apply highlight class (CSS variable will handle the color)
        highlightCells.forEach(({row, col}) => {
            const cellElement = this.gridElement.children[row * GRID_SIZE + col];
            if (cellElement) {
                cellElement.classList.add('highlight-range');
            }
        });
    }
}

export { UIController };