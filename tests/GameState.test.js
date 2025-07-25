import { GameState, GAME_STATUS, CELL_TYPE } from '../src/js/models/GameState.js';
import { Grid, EMPTY_CELL } from '../src/js/models/Grid.js';
import { RuleEngine } from '../src/js/models/RuleEngine.js';

describe('GameState', () => {
    let gameState;
    let testGrid;

    beforeEach(() => {
        gameState = new GameState();
        testGrid = new Grid();
        
        // テスト用の簡単なパズルを作成
        testGrid.setCellValue(0, 0, 5);
        testGrid.setCellValue(0, 1, 3);
        testGrid.setCellValue(1, 0, 6);
    });

    describe('constructor', () => {
        test('should initialize with correct default values', () => {
            expect(gameState.originalPuzzle).toBeInstanceOf(Grid);
            expect(gameState.currentGrid).toBeInstanceOf(Grid);
            expect(gameState.moveHistory).toEqual([]);
            expect(gameState.startTime).toBeNull();
            expect(gameState.endTime).toBeNull();
            expect(gameState.status).toBe(GAME_STATUS.NOT_STARTED);
            expect(gameState.ruleEngine).toBeInstanceOf(RuleEngine);
        });

        test('should create empty cell type grid', () => {
            const cellTypes = gameState.createCellTypeGrid();
            expect(cellTypes).toHaveLength(9);
            expect(cellTypes[0]).toHaveLength(9);
            
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    expect(cellTypes[row][col]).toBe(CELL_TYPE.EMPTY);
                }
            }
        });
    });

    describe('Game Status Constants', () => {
        test('should have correct game status constants', () => {
            expect(GAME_STATUS.NOT_STARTED).toBe('not_started');
            expect(GAME_STATUS.IN_PROGRESS).toBe('in_progress');
            expect(GAME_STATUS.COMPLETED).toBe('completed');
            expect(GAME_STATUS.PAUSED).toBe('paused');
        });

        test('should have correct cell type constants', () => {
            expect(CELL_TYPE.GIVEN).toBe('given');
            expect(CELL_TYPE.USER).toBe('user');
            expect(CELL_TYPE.EMPTY).toBe('empty');
        });
    });

    describe('startNewGame', () => {
        test('should start new game with valid puzzle', () => {
            const result = gameState.startNewGame(testGrid);
            
            expect(result).toBe(true);
            expect(gameState.status).toBe(GAME_STATUS.IN_PROGRESS);
            expect(gameState.startTime).not.toBeNull();
            expect(gameState.endTime).toBeNull();
            expect(gameState.moveHistory).toEqual([]);
        });

        test('should return false for null puzzle', () => {
            const result = gameState.startNewGame(null);
            
            expect(result).toBe(false);
            expect(gameState.status).toBe(GAME_STATUS.NOT_STARTED);
        });

        test('should clone original puzzle correctly', () => {
            gameState.startNewGame(testGrid);
            
            expect(gameState.originalPuzzle).not.toBe(testGrid);
            expect(gameState.currentGrid).not.toBe(testGrid);
            expect(gameState.getCellValue(0, 0)).toBe(5);
            expect(gameState.getCellValue(0, 1)).toBe(3);
            expect(gameState.getCellValue(1, 0)).toBe(6);
        });

        test('should initialize cell types correctly', () => {
            gameState.startNewGame(testGrid);
            
            expect(gameState.getCellType(0, 0)).toBe(CELL_TYPE.GIVEN);
            expect(gameState.getCellType(0, 1)).toBe(CELL_TYPE.GIVEN);
            expect(gameState.getCellType(1, 0)).toBe(CELL_TYPE.GIVEN);
            expect(gameState.getCellType(0, 2)).toBe(CELL_TYPE.EMPTY);
        });
    });

    describe('Game Completion Logic', () => {
        test('should detect incomplete game', () => {
            gameState.startNewGame(testGrid);
            
            expect(gameState.isComplete()).toBe(false);
            expect(gameState.status).toBe(GAME_STATUS.IN_PROGRESS);
        });

        test('should detect complete valid game', () => {
            // 有効な完全解を作成
            const completeGrid = new Grid();
            const validSolution = [
                [1, 2, 3, 4, 5, 6, 7, 8, 9],
                [4, 5, 6, 7, 8, 9, 1, 2, 3],
                [7, 8, 9, 1, 2, 3, 4, 5, 6],
                [2, 3, 1, 5, 6, 4, 8, 9, 7],
                [5, 6, 4, 8, 9, 7, 2, 3, 1],
                [8, 9, 7, 2, 3, 1, 5, 6, 4],
                [3, 1, 2, 6, 4, 5, 9, 7, 8],
                [6, 4, 5, 9, 7, 8, 3, 1, 2],
                [9, 7, 8, 3, 1, 2, 6, 4, 5]
            ];
            
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    completeGrid.setCellValue(row, col, validSolution[row][col]);
                }
            }
            
            gameState.startNewGame(completeGrid);
            
            expect(gameState.isComplete()).toBe(true);
        });

        test('should detect complete invalid game', () => {
            // 無効な完全解を作成（重複あり）
            const invalidGrid = new Grid();
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    invalidGrid.setCellValue(row, col, 1); // 全て1
                }
            }
            
            gameState.startNewGame(invalidGrid);
            
            expect(gameState.isComplete()).toBe(false);
        });
    });

    describe('Time Management', () => {
        test('should track elapsed time correctly', () => {
            const startTime = Date.now();
            gameState.startNewGame(testGrid);
            
            expect(gameState.getElapsedTime()).toBeGreaterThanOrEqual(0);
            expect(gameState.startTime).toBeGreaterThanOrEqual(startTime);
        });

        test('should return 0 elapsed time when not started', () => {
            expect(gameState.getElapsedTime()).toBe(0);
        });

        test('should format time correctly', () => {
            gameState.startNewGame(testGrid);
            const formattedTime = gameState.getFormattedTime();
            
            expect(formattedTime).toMatch(/^\d{2}:\d{2}$/);
            expect(formattedTime).toBe('00:00'); // 即座に実行されるため
        });

        test('should freeze time when game completes', () => {
            gameState.startNewGame(testGrid);
            
            // ゲーム完了をシミュレート
            gameState.endTime = gameState.startTime + 60000; // 1分後
            gameState.status = GAME_STATUS.COMPLETED;
            
            const elapsedTime = gameState.getElapsedTime();
            expect(elapsedTime).toBe(60000);
        });
    });

    describe('Cell Value and Type Access', () => {
        test('should get cell values correctly', () => {
            gameState.startNewGame(testGrid);
            
            expect(gameState.getCellValue(0, 0)).toBe(5);
            expect(gameState.getCellValue(0, 1)).toBe(3);
            expect(gameState.getCellValue(1, 0)).toBe(6);
            expect(gameState.getCellValue(0, 2)).toBe(EMPTY_CELL);
        });

        test('should get cell types correctly', () => {
            gameState.startNewGame(testGrid);
            
            expect(gameState.getCellType(0, 0)).toBe(CELL_TYPE.GIVEN);
            expect(gameState.getCellType(0, 1)).toBe(CELL_TYPE.GIVEN);
            expect(gameState.getCellType(1, 0)).toBe(CELL_TYPE.GIVEN);
            expect(gameState.getCellType(0, 2)).toBe(CELL_TYPE.EMPTY);
        });

        test('should return null for invalid positions', () => {
            gameState.startNewGame(testGrid);
            
            expect(gameState.getCellType(-1, 0)).toBeNull();
            expect(gameState.getCellType(0, -1)).toBeNull();
            expect(gameState.getCellType(9, 0)).toBeNull();
            expect(gameState.getCellType(0, 9)).toBeNull();
        });
    });

    describe('Game Status Management', () => {
        test('should get game status correctly', () => {
            expect(gameState.getGameStatus()).toBe(GAME_STATUS.NOT_STARTED);
            
            gameState.startNewGame(testGrid);
            expect(gameState.getGameStatus()).toBe(GAME_STATUS.IN_PROGRESS);
        });

        test('should pause and resume game', () => {
            gameState.startNewGame(testGrid);
            
            const pauseResult = gameState.pauseGame();
            expect(pauseResult).toBe(true);
            expect(gameState.getGameStatus()).toBe(GAME_STATUS.PAUSED);
            
            const resumeResult = gameState.resumeGame();
            expect(resumeResult).toBe(true);
            expect(gameState.getGameStatus()).toBe(GAME_STATUS.IN_PROGRESS);
        });

        test('should not pause when not in progress', () => {
            const pauseResult = gameState.pauseGame();
            expect(pauseResult).toBe(false);
            expect(gameState.getGameStatus()).toBe(GAME_STATUS.NOT_STARTED);
        });

        test('should not resume when not paused', () => {
            gameState.startNewGame(testGrid);
            
            const resumeResult = gameState.resumeGame();
            expect(resumeResult).toBe(false);
            expect(gameState.getGameStatus()).toBe(GAME_STATUS.IN_PROGRESS);
        });
    });

    describe('Validation Methods', () => {
        test('should validate current move correctly', () => {
            gameState.startNewGame(testGrid);
            
            // 有効な移動
            expect(gameState.validateCurrentMove(0, 2, 1)).toBe(true);
            
            // 無効な移動（重複）
            expect(gameState.validateCurrentMove(0, 2, 5)).toBe(false); // 行重複
            expect(gameState.validateCurrentMove(2, 0, 6)).toBe(false); // 列重複
        });

        test('should get current violations', () => {
            gameState.startNewGame(testGrid);
            
            // 初期状態では違反なし
            const violations = gameState.getCurrentViolations();
            expect(violations).toHaveLength(0);
        });
    });
});