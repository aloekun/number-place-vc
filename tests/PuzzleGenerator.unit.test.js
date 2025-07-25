import { PuzzleGenerator, DIFFICULTY_LEVELS } from '../src/js/models/PuzzleGenerator.js';
import { Grid, EMPTY_CELL } from '../src/js/models/Grid.js';
import { RuleEngine } from '../src/js/models/RuleEngine.js';

describe('PuzzleGenerator - Unit Tests', () => {
    let puzzleGenerator;
    let ruleEngine;

    beforeEach(() => {
        puzzleGenerator = new PuzzleGenerator();
        ruleEngine = new RuleEngine();
    });

    describe('Basic Functionality', () => {
        test('should create PuzzleGenerator instance with RuleEngine', () => {
            expect(puzzleGenerator).toBeInstanceOf(PuzzleGenerator);
            expect(puzzleGenerator.ruleEngine).toBeInstanceOf(RuleEngine);
        });

        test('should have correct difficulty configurations', () => {
            expect(DIFFICULTY_LEVELS.easy).toEqual({ minHints: 40, maxHints: 45 });
            expect(DIFFICULTY_LEVELS.medium).toEqual({ minHints: 30, maxHints: 39 });
            expect(DIFFICULTY_LEVELS.hard).toEqual({ minHints: 25, maxHints: 29 });
            expect(DIFFICULTY_LEVELS.expert).toEqual({ minHints: 17, maxHints: 30 });
        });
    });

    describe('Utility Methods', () => {
        test('getShuffledNumbers should return array with numbers 1-9', () => {
            const numbers = puzzleGenerator.getShuffledNumbers();
            
            expect(numbers).toHaveLength(9);
            expect(numbers.sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });

        test('shuffleArray should not modify original array', () => {
            const original = [1, 2, 3, 4, 5];
            const originalCopy = [...original];
            const shuffled = puzzleGenerator.shuffleArray(original);
            
            expect(original).toEqual(originalCopy);
            expect(shuffled).not.toBe(original);
            expect(shuffled.sort()).toEqual(original.sort());
        });

        test('getAllPositions should return all 81 positions', () => {
            const grid = new Grid();
            const positions = puzzleGenerator.getAllPositions(grid);
            
            expect(positions).toHaveLength(81);
            expect(positions[0]).toEqual({ row: 0, col: 0 });
            expect(positions[80]).toEqual({ row: 8, col: 8 });
        });

        test('findEmptyCell should find first empty position', () => {
            const grid = new Grid();
            grid.setCellValue(0, 0, 1);
            grid.setCellValue(0, 1, 2);
            
            const emptyCell = puzzleGenerator.findEmptyCell(grid);
            expect(emptyCell).toEqual({ row: 0, col: 2 });
        });

        test('findEmptyCell should return null for full grid', () => {
            const grid = new Grid();
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    grid.setCellValue(row, col, 1);
                }
            }
            
            expect(puzzleGenerator.findEmptyCell(grid)).toBeNull();
        });
    });

    describe('Row Validation Tests', () => {
        test('should detect valid row (all different numbers)', () => {
            const grid = new Grid();
            // 行0に1-9を配置
            for (let col = 0; col < 9; col++) {
                grid.setCellValue(0, col, col + 1);
            }
            
            // 行0の各数字が重複していないことを確認
            for (let col = 0; col < 9; col++) {
                const value = grid.getCellValue(0, col);
                expect(ruleEngine.validateRow(grid, 0, value)).toBe(false); // 既に存在するので false
            }
            
            // 存在しない数字は追加できない（行が満杯のため）
            expect(ruleEngine.validateRow(grid, 0, 10)).toBe(true); // 無効な値だが行には存在しない
        });

        test('should detect duplicate in row', () => {
            const grid = new Grid();
            grid.setCellValue(0, 0, 5);
            grid.setCellValue(0, 1, 3);
            grid.setCellValue(0, 2, 5); // 重複
            
            const violations = ruleEngine.getAllViolations(grid);
            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some(v => v.row === 0 && v.value === 5)).toBe(true);
        });
    });

    describe('Column Validation Tests', () => {
        test('should detect valid column (all different numbers)', () => {
            const grid = new Grid();
            // 列0に1-9を配置
            for (let row = 0; row < 9; row++) {
                grid.setCellValue(row, 0, row + 1);
            }
            
            // 列0の各数字が重複していないことを確認
            for (let row = 0; row < 9; row++) {
                const value = grid.getCellValue(row, 0);
                expect(ruleEngine.validateColumn(grid, 0, value)).toBe(false); // 既に存在するので false
            }
        });

        test('should detect duplicate in column', () => {
            const grid = new Grid();
            grid.setCellValue(0, 0, 7);
            grid.setCellValue(1, 0, 3);
            grid.setCellValue(2, 0, 7); // 重複
            
            const violations = ruleEngine.getAllViolations(grid);
            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some(v => v.col === 0 && v.value === 7)).toBe(true);
        });
    });

    describe('Block Validation Tests', () => {
        test('should detect valid 3x3 block (all different numbers)', () => {
            const grid = new Grid();
            // 左上ブロック(0,0)に1-9を配置
            let value = 1;
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
                    grid.setCellValue(row, col, value++);
                }
            }
            
            // ブロック内の各数字が重複していないことを確認
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
                    const cellValue = grid.getCellValue(row, col);
                    expect(ruleEngine.validateBlock(grid, row, col, cellValue)).toBe(false); // 既に存在するので false
                }
            }
        });

        test('should detect duplicate in 3x3 block', () => {
            const grid = new Grid();
            grid.setCellValue(0, 0, 4);
            grid.setCellValue(1, 1, 8);
            grid.setCellValue(2, 2, 4); // 同じブロック内で重複
            
            const violations = ruleEngine.getAllViolations(grid);
            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some(v => v.value === 4)).toBe(true);
        });

        test('should validate different blocks independently', () => {
            const grid = new Grid();
            grid.setCellValue(0, 0, 5); // 左上ブロック
            grid.setCellValue(3, 3, 5); // 中央ブロック
            grid.setCellValue(6, 6, 5); // 右下ブロック
            
            // 異なるブロックなので重複エラーなし
            const violations = ruleEngine.getAllViolations(grid);
            expect(violations).toHaveLength(0);
        });
    });

    describe('Game Completion Logic', () => {
        test('should detect complete valid game', () => {
            const grid = new Grid();
            
            // 有効な完全解を手動作成（簡単なパターン）
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
                    grid.setCellValue(row, col, validSolution[row][col]);
                }
            }
            
            expect(grid.isFull()).toBe(true);
            const violations = ruleEngine.getAllViolations(grid);
            expect(violations).toHaveLength(0);
        });

        test('should detect incomplete game', () => {
            const grid = new Grid();
            // 一部のみ埋める
            grid.setCellValue(0, 0, 1);
            grid.setCellValue(0, 1, 2);
            grid.setCellValue(1, 0, 3);
            
            expect(grid.isFull()).toBe(false);
        });

        test('should detect invalid complete game', () => {
            const grid = new Grid();
            
            // 無効な解（重複あり）
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    grid.setCellValue(row, col, 1); // 全て1で埋める（明らかに無効）
                }
            }
            
            expect(grid.isFull()).toBe(true);
            const violations = ruleEngine.getAllViolations(grid);
            expect(violations.length).toBeGreaterThan(0);
        });
    });

    describe('Error Case Tests', () => {
        test('should detect multiple violations in same grid', () => {
            const grid = new Grid();
            
            // 複数の重複エラーを作成
            grid.setCellValue(0, 0, 5);
            grid.setCellValue(0, 1, 5); // 行重複
            grid.setCellValue(1, 0, 5); // 列重複
            grid.setCellValue(1, 1, 5); // ブロック重複
            
            const violations = ruleEngine.getAllViolations(grid);
            expect(violations.length).toBe(4); // 4つすべてが違反
        });

        test('should not allow invalid moves', () => {
            const grid = new Grid();
            grid.setCellValue(0, 0, 3);
            
            // 同じ行に同じ値を置こうとする
            expect(ruleEngine.validateMove(grid, 0, 1, 3)).toBe(false);
            
            // 同じ列に同じ値を置こうとする
            expect(ruleEngine.validateMove(grid, 1, 0, 3)).toBe(false);
            
            // 同じブロックに同じ値を置こうとする
            expect(ruleEngine.validateMove(grid, 1, 1, 3)).toBe(false);
            
            // 有効な場所には置ける
            expect(ruleEngine.validateMove(grid, 3, 3, 3)).toBe(true);
        });

        test('should handle edge cases in validation', () => {
            const grid = new Grid();
            
            // 境界値テスト
            expect(ruleEngine.validateMove(grid, 0, 0, 0)).toBe(true); // EMPTY_CELL
            expect(ruleEngine.validateMove(grid, 0, 0, 1)).toBe(true); // 最小値
            expect(ruleEngine.validateMove(grid, 0, 0, 9)).toBe(true); // 最大値
            expect(ruleEngine.validateMove(grid, 0, 0, 10)).toBe(false); // 範囲外
            expect(ruleEngine.validateMove(grid, 0, 0, -1)).toBe(false); // 範囲外
        });
    });

    describe('Partial Grid Filling Tests', () => {
        test('should detect unsolvable grid configuration', () => {
            const grid = new Grid();
            // 意図的に解けない状況を作成
            grid.setCellValue(0, 0, 1);
            grid.setCellValue(0, 1, 1); // 行重複
            
            // 重複があることを確認
            const violations = ruleEngine.getAllViolations(grid);
            expect(violations.length).toBeGreaterThan(0);
        });

        test('should validate grid before attempting to solve', () => {
            const grid = new Grid();
            grid.setCellValue(0, 0, 5);
            grid.setCellValue(4, 4, 9);
            grid.setCellValue(8, 8, 1);
            
            // 配置された値が正しいことを確認
            expect(grid.getCellValue(0, 0)).toBe(5);
            expect(grid.getCellValue(4, 4)).toBe(9);
            expect(grid.getCellValue(8, 8)).toBe(1);
            
            // 違反がないことを確認
            const violations = ruleEngine.getAllViolations(grid);
            expect(violations).toHaveLength(0);
        });
    });
});