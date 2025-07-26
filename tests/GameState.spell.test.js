/* eslint-disable no-magic-numbers */
import { GameState, GAME_STATUS } from '../src/js/models/GameState.js';
import { Grid, EMPTY_CELL } from '../src/js/models/Grid.js';

describe('GameState Spell System', () => {
    let gameState;
    let testPuzzle;

    beforeEach(() => {
        gameState = new GameState();
        testPuzzle = new Grid();
        
        // Create a simple test puzzle
        testPuzzle.setCellValue(0, 0, 5);
        testPuzzle.setCellValue(0, 1, 3);
        testPuzzle.setCellValue(0, 4, 7);
        testPuzzle.setCellValue(1, 0, 6);
        testPuzzle.setCellValue(1, 3, 1);
        testPuzzle.setCellValue(1, 4, 9);
        testPuzzle.setCellValue(1, 5, 5);
        
        gameState.startNewGame(testPuzzle);
    });

    describe('generateSpell', () => {
        test('should generate a spell from current puzzle', () => {
            const spell = gameState.generateSpell();
            
            expect(spell).toBeTruthy();
            expect(typeof spell).toBe('string');
            expect(spell.length).toBeGreaterThan(10);
        });

        test('should return null when no original puzzle exists', () => {
            const emptyGameState = new GameState();
            // originalPuzzleがnullの状態でテスト
            emptyGameState.originalPuzzle = null;
            const spell = emptyGameState.generateSpell();
            
            expect(spell).toBeNull();
        });

        test('should generate consistent spells for same puzzle', () => {
            const spell1 = gameState.generateSpell();
            const spell2 = gameState.generateSpell();
            
            expect(spell1).toBe(spell2);
        });

        test('should generate URL-safe Base64 strings', () => {
            const spell = gameState.generateSpell();
            
            // URL-safe Base64 should not contain +, /, or =
            expect(spell).not.toMatch(/[+/=]/);
            // Should only contain valid characters
            expect(spell).toMatch(/^[A-Za-z0-9\-_]*$/);
        });
    });

    describe('parseSpell', () => {
        test('should parse a valid spell back to grid', () => {
            const originalSpell = gameState.generateSpell();
            const parsedGrid = gameState.parseSpell(originalSpell);
            
            expect(parsedGrid).toBeTruthy();
            expect(parsedGrid.getCellValue(0, 0)).toBe(5);
            expect(parsedGrid.getCellValue(0, 1)).toBe(3);
            expect(parsedGrid.getCellValue(0, 4)).toBe(7);
            expect(parsedGrid.getCellValue(1, 0)).toBe(6);
        });

        test('should return null for invalid spell string', () => {
            expect(gameState.parseSpell('')).toBeNull();
            expect(gameState.parseSpell(null)).toBeNull();
            expect(gameState.parseSpell(undefined)).toBeNull();
            expect(gameState.parseSpell('invalid-spell')).toBeNull();
            expect(gameState.parseSpell(123)).toBeNull();
        });

        test('should return null for malformed Base64', () => {
            const invalidSpells = [
                'not-base64-at-all',
                '!!!invalid!!!',
                'too-short',
                'contains spaces'
            ];
            
            invalidSpells.forEach(spell => {
                expect(gameState.parseSpell(spell)).toBeNull();
            });
        });

        test('should validate grid data size', () => {
            // Create a spell with wrong data size
            const invalidData = JSON.stringify([1, 2, 3]); // Too few elements
            const invalidSpell = btoa(invalidData).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            
            expect(gameState.parseSpell(invalidSpell)).toBeNull();
        });

        test('should validate grid data values', () => {
            // Create a spell with invalid values (outside 0-9 range)
            const invalidData = new Array(81).fill(0);
            invalidData[0] = 10; // Invalid value
            const invalidDataStr = JSON.stringify(invalidData);
            const invalidSpell = btoa(invalidDataStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            
            expect(gameState.parseSpell(invalidSpell)).toBeNull();
        });
    });

    describe('startGameFromSpell', () => {
        test('should start a new game from valid spell', () => {
            const spell = gameState.generateSpell();
            
            // Make some moves to change current state
            gameState.makeMove(0, 2, 4);
            expect(gameState.getCellValue(0, 2)).toBe(4);
            
            // Start game from spell
            const success = gameState.startGameFromSpell(spell);
            
            expect(success).toBe(true);
            expect(gameState.getGameStatus()).toBe(GAME_STATUS.IN_PROGRESS);
            expect(gameState.getCellValue(0, 0)).toBe(5);
            expect(gameState.getCellValue(0, 2)).toBe(EMPTY_CELL); // Should be reset
        });

        test('should return false for invalid spell', () => {
            const success = gameState.startGameFromSpell('invalid-spell');
            
            expect(success).toBe(false);
        });

        test('should clear previous game state', () => {
            // Make some moves and save state
            gameState.makeMove(0, 2, 4);
            gameState.saveGameState();
            
            expect(gameState.hasSavedState()).toBe(true);
            
            // Start game from spell
            const spell = gameState.generateSpell();
            gameState.startGameFromSpell(spell);
            
            expect(gameState.hasSavedState()).toBe(false);
        });
    });

    describe('spell round-trip integrity', () => {
        test('should preserve exact grid state through spell generation and parsing', () => {
            // Create a more complex puzzle
            const complexPuzzle = new Grid();
            const testValues = [
                [5, 3, 0, 0, 7, 0, 0, 0, 0],
                [6, 0, 0, 1, 9, 5, 0, 0, 0], 
                [0, 9, 8, 0, 0, 0, 0, 6, 0],
                [8, 0, 0, 0, 6, 0, 0, 0, 3],
                [4, 0, 0, 8, 0, 3, 0, 0, 1],
                [7, 0, 0, 0, 2, 0, 0, 0, 6],
                [0, 6, 0, 0, 0, 0, 2, 8, 0],
                [0, 0, 0, 4, 1, 9, 0, 0, 5],
                [0, 0, 0, 0, 8, 0, 0, 7, 9]
            ];
            
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    complexPuzzle.setCellValue(row, col, testValues[row][col]);
                }
            }
            
            gameState.startNewGame(complexPuzzle);
            
            // Generate spell and parse it back
            const spell = gameState.generateSpell();
            const parsedGrid = gameState.parseSpell(spell);
            
            // Verify every cell matches
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    expect(parsedGrid.getCellValue(row, col)).toBe(testValues[row][col]);
                }
            }
        });

        test('should handle empty grid correctly', () => {
            const emptyPuzzle = new Grid();
            gameState.startNewGame(emptyPuzzle);
            
            const spell = gameState.generateSpell();
            const parsedGrid = gameState.parseSpell(spell);
            
            // Verify all cells are empty
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    expect(parsedGrid.getCellValue(row, col)).toBe(EMPTY_CELL);
                }
            }
        });

        test('should handle full grid correctly', () => {
            const fullPuzzle = new Grid();
            
            // Fill grid with valid solution
            const solution = [
                [5, 3, 4, 6, 7, 8, 9, 1, 2],
                [6, 7, 2, 1, 9, 5, 3, 4, 8],
                [1, 9, 8, 3, 4, 2, 5, 6, 7],
                [8, 5, 9, 7, 6, 1, 4, 2, 3],
                [4, 2, 6, 8, 5, 3, 7, 9, 1],
                [7, 1, 3, 9, 2, 4, 8, 5, 6],
                [9, 6, 1, 5, 3, 7, 2, 8, 4],
                [2, 8, 7, 4, 1, 9, 6, 3, 5],
                [3, 4, 5, 2, 8, 6, 1, 7, 9]
            ];
            
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    fullPuzzle.setCellValue(row, col, solution[row][col]);
                }
            }
            
            gameState.startNewGame(fullPuzzle);
            
            const spell = gameState.generateSpell();
            const parsedGrid = gameState.parseSpell(spell);
            
            // Verify all cells match
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    expect(parsedGrid.getCellValue(row, col)).toBe(solution[row][col]);
                }
            }
        });
    });

    describe('helper methods', () => {
        test('decodeSpellString should handle valid Base64', () => {
            const testData = [1, 2, 3, 4, 5];
            const jsonString = JSON.stringify(testData);
            const base64 = btoa(jsonString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            
            const decoded = gameState.decodeSpellString(base64);
            expect(decoded).toEqual(testData);
        });

        test('decodeSpellString should return null for invalid input', () => {
            expect(gameState.decodeSpellString('invalid')).toBeNull();
            expect(gameState.decodeSpellString('')).toBeNull();
        });

        test('validateGridData should validate array size and values', () => {
            const validData = new Array(81).fill(0);
            expect(gameState.validateGridData(validData)).toBe(true);
            
            const invalidSize = new Array(80).fill(0);
            expect(gameState.validateGridData(invalidSize)).toBe(false);
            
            const invalidValues = new Array(81).fill(0);
            invalidValues[0] = 10;
            expect(gameState.validateGridData(invalidValues)).toBe(false);
            
            expect(gameState.validateGridData(null)).toBe(false);
            expect(gameState.validateGridData('not-array')).toBe(false);
        });

        test('createGridFromData should create correct grid', () => {
            const testData = new Array(81).fill(0);
            testData[0] = 5; // First cell
            testData[9] = 3; // Second row, first cell
            
            const grid = gameState.createGridFromData(testData);
            
            expect(grid.getCellValue(0, 0)).toBe(5);
            expect(grid.getCellValue(1, 0)).toBe(3);
            expect(grid.getCellValue(0, 1)).toBe(0);
        });
    });
});