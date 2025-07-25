import { PuzzleGenerator, DIFFICULTY_LEVELS } from '../src/js/models/PuzzleGenerator.js';
import { Grid, EMPTY_CELL } from '../src/js/models/Grid.js';
import { RuleEngine } from '../src/js/models/RuleEngine.js';

describe('PuzzleGenerator - Basic Tests', () => {
    let puzzleGenerator;

    beforeEach(() => {
        puzzleGenerator = new PuzzleGenerator();
    });

    describe('constructor', () => {
        test('should create PuzzleGenerator instance with RuleEngine', () => {
            expect(puzzleGenerator).toBeInstanceOf(PuzzleGenerator);
            expect(puzzleGenerator.ruleEngine).toBeInstanceOf(RuleEngine);
        });
    });

    describe('DIFFICULTY_LEVELS', () => {
        test('should have correct difficulty configurations', () => {
            expect(DIFFICULTY_LEVELS.easy).toEqual({ minHints: 40, maxHints: 45 });
            expect(DIFFICULTY_LEVELS.medium).toEqual({ minHints: 30, maxHints: 39 });
            expect(DIFFICULTY_LEVELS.hard).toEqual({ minHints: 25, maxHints: 29 });
            expect(DIFFICULTY_LEVELS.expert).toEqual({ minHints: 17, maxHints: 30 });
        });
    });

    describe('getShuffledNumbers', () => {
        test('should return array with numbers 1-9', () => {
            const numbers = puzzleGenerator.getShuffledNumbers();
            
            expect(numbers).toHaveLength(9);
            expect(numbers.sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });

        test('should return shuffled array (not always in same order)', () => {
            const results = new Set();
            
            // 生成を10回実行して、少なくとも2種類の異なる順序が生成されることを確認
            for (let i = 0; i < 10; i++) {
                const numbers = puzzleGenerator.getShuffledNumbers();
                results.add(numbers.join(','));
            }
            
            expect(results.size).toBeGreaterThan(1);
        });
    });

    describe('shuffleArray', () => {
        test('should return new array with same elements', () => {
            const original = [1, 2, 3, 4, 5];
            const shuffled = puzzleGenerator.shuffleArray(original);
            
            expect(shuffled).not.toBe(original); // 新しい配列
            expect(shuffled.sort()).toEqual(original.sort());
        });

        test('should not modify original array', () => {
            const original = [1, 2, 3, 4, 5];
            const originalCopy = [...original];
            puzzleGenerator.shuffleArray(original);
            
            expect(original).toEqual(originalCopy);
        });
    });

    describe('getAllPositions', () => {
        test('should return all 81 positions for 9x9 grid', () => {
            const grid = new Grid();
            const positions = puzzleGenerator.getAllPositions(grid);
            
            expect(positions).toHaveLength(81);
            
            // すべての位置が含まれているか確認
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    expect(positions).toContainEqual({ row, col });
                }
            }
        });
    });

    describe('findEmptyCell', () => {
        test('should return first empty cell position', () => {
            const grid = new Grid();
            grid.setCellValue(0, 0, 1);
            grid.setCellValue(0, 1, 2);
            
            const emptyCell = puzzleGenerator.findEmptyCell(grid);
            
            expect(emptyCell).toEqual({ row: 0, col: 2 });
        });

        test('should return null for full grid', () => {
            const grid = new Grid();
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    grid.setCellValue(row, col, 1);
                }
            }
            
            const emptyCell = puzzleGenerator.findEmptyCell(grid);
            
            expect(emptyCell).toBeNull();
        });
    });

    describe('fillGrid - basic cases', () => {
        test('should preserve existing values when filling partially filled grid', () => {
            const grid = new Grid();
            grid.setCellValue(0, 0, 5);
            grid.setCellValue(1, 1, 7);
            
            const result = puzzleGenerator.fillGrid(grid);
            
            expect(result).toBe(true);
            expect(grid.getCellValue(0, 0)).toBe(5);
            expect(grid.getCellValue(1, 1)).toBe(7);
        });

        test('should return false for unsolvable grid', () => {
            const grid = new Grid();
            // 同じ行に同じ値を設定して矛盾を作る
            grid.setCellValue(0, 0, 5);
            grid.setCellValue(0, 1, 5);
            
            const result = puzzleGenerator.fillGrid(grid);
            
            expect(result).toBe(false);
        });
    });
});