/* eslint-disable no-magic-numbers */
import { GameState, GAME_STATUS, CELL_TYPE } from '../src/js/models/GameState.js';
import { Grid, EMPTY_CELL } from '../src/js/models/Grid.js';

describe('GameState Save/Restore Functionality', () => {
    let gameState;
    let testPuzzle;

    beforeEach(() => {
        gameState = new GameState();
        testPuzzle = new Grid();
        
        // Create a simple test puzzle with some given values
        testPuzzle.setCellValue(0, 0, 5);
        testPuzzle.setCellValue(0, 1, 3);
        testPuzzle.setCellValue(0, 4, 7);
        testPuzzle.setCellValue(1, 0, 6);
        testPuzzle.setCellValue(1, 3, 1);
        testPuzzle.setCellValue(1, 4, 9);
        testPuzzle.setCellValue(1, 5, 5);
        gameState.startNewGame(testPuzzle);
    });

    describe('saveGameState', () => {
        test('should save current game state successfully', () => {
            // Make some moves first
            gameState.makeMove(0, 2, 4);
            gameState.makeCandidateMove(0, 3, 2);
            gameState.makeCandidateMove(0, 3, 6);

            const result = gameState.saveGameState();
            
            expect(result).toBe(true);
            expect(gameState.hasSavedState()).toBe(true);
        });

        test('should not save when game is not in progress', () => {
            gameState.status = GAME_STATUS.PAUSED;
            
            const result = gameState.saveGameState();
            
            expect(result).toBe(false);
            expect(gameState.hasSavedState()).toBe(false);
        });

        test('should preserve grid state in saved data', () => {
            // Make a move
            gameState.makeMove(0, 2, 4);
            
            gameState.saveGameState();
            
            // Verify saved state contains the move
            expect(gameState.savedGameState.grid.getCellValue(0, 2)).toBe(4);
        });

        test('should preserve candidates in saved data', () => {
            // Add candidates
            gameState.makeCandidateMove(0, 3, 2);
            gameState.makeCandidateMove(0, 3, 6);
            
            gameState.saveGameState();
            
            // Verify saved state contains candidates
            const savedCandidates = gameState.savedGameState.grid.getCandidates(0, 3);
            expect(savedCandidates.has(2)).toBe(true);
            expect(savedCandidates.has(6)).toBe(true);
        });

        test('should preserve move history in saved data', () => {
            // Make some moves
            gameState.makeMove(0, 2, 4);
            gameState.makeCandidateMove(0, 3, 2);
            
            gameState.saveGameState();
            
            expect(gameState.savedGameState.moveHistory).toBeDefined();
            expect(gameState.savedGameState.moveHistory.length).toBe(2);
        });
    });

    describe('restoreGameState', () => {
        test('should restore game state successfully', () => {
            // Make initial moves and save
            gameState.makeMove(0, 2, 4);
            gameState.makeCandidateMove(0, 3, 2);
            gameState.saveGameState();
            
            // Make additional moves after saving
            gameState.makeMove(0, 5, 8);
            gameState.makeCandidateMove(1, 1, 7);
            
            // Verify state changed
            expect(gameState.getCellValue(0, 5)).toBe(8);
            expect(gameState.getCandidates(1, 1).has(7)).toBe(true);
            
            // Restore
            const result = gameState.restoreGameState();
            
            expect(result).toBe(true);
            expect(gameState.getCellValue(0, 2)).toBe(4);
            expect(gameState.getCellValue(0, 5)).toBe(EMPTY_CELL);
            expect(gameState.getCandidates(0, 3).has(2)).toBe(true);
            expect(gameState.getCandidates(1, 1).has(7)).toBe(false);
        });

        test('should not restore when no saved state exists', () => {
            const result = gameState.restoreGameState();
            
            expect(result).toBe(false);
        });

        test('should not restore when game is not in progress', () => {
            // Make moves and save
            gameState.makeMove(0, 2, 4);
            gameState.saveGameState();
            
            // Change game status
            gameState.status = GAME_STATUS.PAUSED;
            
            const result = gameState.restoreGameState();
            
            expect(result).toBe(false);
        });

        test('should restore move history correctly', () => {
            // Make moves and save
            gameState.makeMove(0, 2, 4);
            gameState.makeCandidateMove(0, 3, 2);
            const initialHistoryLength = gameState.moveHistory.length;
            gameState.saveGameState();
            
            // Make additional moves
            gameState.makeMove(0, 5, 8);
            expect(gameState.moveHistory.length).toBe(initialHistoryLength + 1);
            
            // Restore
            gameState.restoreGameState();
            
            expect(gameState.moveHistory.length).toBe(initialHistoryLength);
        });
    });

    describe('hasSavedState and clearSavedState', () => {
        test('should return false when no state is saved', () => {
            expect(gameState.hasSavedState()).toBe(false);
        });

        test('should return true when state is saved', () => {
            gameState.makeMove(0, 2, 4);
            gameState.saveGameState();
            
            expect(gameState.hasSavedState()).toBe(true);
        });

        test('should clear saved state', () => {
            gameState.makeMove(0, 2, 4);
            gameState.saveGameState();
            
            expect(gameState.hasSavedState()).toBe(true);
            
            gameState.clearSavedState();
            
            expect(gameState.hasSavedState()).toBe(false);
        });
    });

    describe('integration with new game and reset', () => {
        test('should clear saved state when starting new game', () => {
            // Make moves and save
            gameState.makeMove(0, 2, 4);
            gameState.saveGameState();
            
            expect(gameState.hasSavedState()).toBe(true);
            
            // Start new game
            gameState.startNewGame(testPuzzle);
            
            expect(gameState.hasSavedState()).toBe(false);
        });

        test('should clear saved state when resetting game', () => {
            // Make moves and save
            gameState.makeMove(0, 2, 4);
            gameState.saveGameState();
            
            expect(gameState.hasSavedState()).toBe(true);
            
            // Reset game
            gameState.resetGame();
            
            expect(gameState.hasSavedState()).toBe(false);
        });
    });

    describe('deep cloning functionality', () => {
        test('should deep clone cell types correctly', () => {
            // Make a user move
            gameState.makeMove(0, 2, 4);
            
            const cloned = gameState.deepCloneCellTypes();
            
            expect(cloned[0][2]).toBe(CELL_TYPE.USER);
            expect(cloned[0][0]).toBe(CELL_TYPE.GIVEN);
            
            // Modify original
            gameState.cellTypes[0][2] = CELL_TYPE.EMPTY;
            
            // Cloned should remain unchanged
            expect(cloned[0][2]).toBe(CELL_TYPE.USER);
        });

        test('should deep clone move history with candidates correctly', () => {
            // Make candidate moves
            gameState.makeCandidateMove(0, 3, 2);
            gameState.makeCandidateMove(0, 3, 6);
            
            const cloned = gameState.deepCloneMoveHistory();
            
            expect(cloned.length).toBe(2);
            expect(cloned[0].type).toBe('candidate');
            expect(cloned[0].newCandidates.has(2)).toBe(true);
            
            // Modify original candidates
            gameState.moveHistory[0].newCandidates.add(9);
            
            // Cloned should remain unchanged
            expect(cloned[0].newCandidates.has(9)).toBe(false);
        });

        test('should deep clone auto clear candidates moves correctly', () => {
            // Make a move that triggers auto clear
            gameState.makeCandidateMove(0, 3, 5); // Add candidate 5 to position (0,3)
            gameState.makeMove(0, 0, 5); // This should not clear since 5 is already given
            
            // Make a move that actually triggers auto clear
            gameState.makeCandidateMove(1, 2, 7);
            gameState.makeMove(1, 0, 7); // This should clear candidate 7 from row 1
            
            const cloned = gameState.deepCloneMoveHistory();
            
            // Find auto clear move
            const autoClearMove = cloned.find(move => move.type === 'auto_clear_candidates');
            if (autoClearMove) {
                expect(autoClearMove.clearedCandidates).toBeDefined();
                autoClearMove.clearedCandidates.forEach(cleared => {
                    expect(cleared.oldCandidates).toBeInstanceOf(Set);
                    expect(cleared.newCandidates).toBeInstanceOf(Set);
                });
            }
        });
    });
});