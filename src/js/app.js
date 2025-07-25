import { GameState } from './models/GameState.js';
import { RuleEngine } from './models/RuleEngine.js';
import { PuzzleGenerator } from './models/PuzzleGenerator.js';
import { UIController } from './controllers/UIController.js';

class NumberPlaceApp {
    constructor() {
        this.gameState = new GameState();
        this.ruleEngine = new RuleEngine();
        this.puzzleGenerator = new PuzzleGenerator();
        this.uiController = null;
        
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeApp();
        });
    }

    initializeApp() {
        this.uiController = new UIController(this.gameState, this.ruleEngine);
        this.bindAppEvents();
        
        console.log('Number Place App initialized');
    }

    bindAppEvents() {
        document.addEventListener('newGameRequested', () => {
            this.generateNewGame();
        });

        window.addEventListener('beforeunload', (event) => {
            if (this.gameState.getGameStatus() === 'in_progress') {
                event.preventDefault();
                event.returnValue = 'ゲームが進行中です。本当にページを離れますか？';
            }
        });
    }

    async generateNewGame(difficulty = 'medium') {
        try {
            this.showLoadingState();
            
            const puzzle = await this.generatePuzzleAsync(difficulty);
            
            if (puzzle) {
                this.uiController.onPuzzleLoaded(puzzle);
                console.log('New puzzle generated successfully');
            } else {
                this.showError('問題の生成に失敗しました。もう一度お試しください。');
            }
        } catch (error) {
            console.error('Error generating puzzle:', error);
            this.showError('問題の生成中にエラーが発生しました。');
        } finally {
            this.hideLoadingState();
        }
    }

    generatePuzzleAsync(difficulty) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const puzzle = this.puzzleGenerator.createPuzzle(difficulty);
                resolve(puzzle);
            }, 100);
        });
    }

    showLoadingState() {
        const statusElement = document.getElementById('game-status');
        if (statusElement) {
            statusElement.textContent = '問題を生成中...';
        }

        const newGameBtn = document.getElementById('new-game');
        if (newGameBtn) {
            newGameBtn.disabled = true;
            newGameBtn.textContent = '生成中...';
        }
    }

    hideLoadingState() {
        const newGameBtn = document.getElementById('new-game');
        if (newGameBtn) {
            newGameBtn.disabled = false;
            newGameBtn.textContent = '新しい問題';
        }
    }

    showError(message) {
        const statusElement = document.getElementById('game-status');
        if (statusElement) {
            statusElement.textContent = `エラー: ${message}`;
        }
        
        setTimeout(() => {
            if (statusElement) {
                statusElement.textContent = '問題を生成してください';
            }
        }, 3000);
    }

    getDifficulty() {
        const difficultySelect = document.getElementById('difficulty-select');
        return difficultySelect ? difficultySelect.value : 'medium';
    }
}

const app = new NumberPlaceApp();