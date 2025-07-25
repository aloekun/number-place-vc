import { RuleEngine, MIN_VALUE, MAX_VALUE } from '../src/js/models/RuleEngine.js';
import { Grid, EMPTY_CELL } from '../src/js/models/Grid.js';

describe('RuleEngine', () => {
    let ruleEngine;
    let grid;

    beforeEach(() => {
        ruleEngine = new RuleEngine();
        grid = new Grid();
    });

    describe('validateRow', () => {
        test('should return true when value is not in row', () => {
            grid.setCellValue(0, 0, 1);
            grid.setCellValue(0, 1, 2);
            grid.setCellValue(0, 2, 3);

            expect(ruleEngine.validateRow(grid, 0, 4)).toBe(true);
        });

        test('should return false when value already exists in row', () => {
            grid.setCellValue(0, 0, 1);
            grid.setCellValue(0, 1, 2);
            grid.setCellValue(0, 2, 3);

            expect(ruleEngine.validateRow(grid, 0, 1)).toBe(false);
            expect(ruleEngine.validateRow(grid, 0, 2)).toBe(false);
            expect(ruleEngine.validateRow(grid, 0, 3)).toBe(false);
        });

        test('should ignore empty cells', () => {
            grid.setCellValue(0, 0, 1);
            grid.setCellValue(0, 2, 3);

            expect(ruleEngine.validateRow(grid, 0, 3)).toBe(false);
            expect(ruleEngine.validateRow(grid, 0, 4)).toBe(true);
        });
    });

    describe('validateColumn', () => {
        test('should return true when value is not in column', () => {
            grid.setCellValue(0, 0, 1);
            grid.setCellValue(1, 0, 2);
            grid.setCellValue(2, 0, 3);

            expect(ruleEngine.validateColumn(grid, 0, 4)).toBe(true);
        });

        test('should return false when value already exists in column', () => {
            grid.setCellValue(0, 0, 1);
            grid.setCellValue(1, 0, 2);
            grid.setCellValue(2, 0, 3);

            expect(ruleEngine.validateColumn(grid, 0, 1)).toBe(false);
            expect(ruleEngine.validateColumn(grid, 0, 2)).toBe(false);
            expect(ruleEngine.validateColumn(grid, 0, 3)).toBe(false);
        });

        test('should ignore empty cells', () => {
            grid.setCellValue(0, 0, 1);
            grid.setCellValue(2, 0, 3);

            expect(ruleEngine.validateColumn(grid, 0, 3)).toBe(false);
            expect(ruleEngine.validateColumn(grid, 0, 4)).toBe(true);
        });
    });

    describe('validateBlock', () => {
        test('should return true when value is not in block', () => {
            grid.setCellValue(0, 0, 1);
            grid.setCellValue(0, 1, 2);
            grid.setCellValue(1, 0, 3);

            expect(ruleEngine.validateBlock(grid, 0, 0, 4)).toBe(true);
        });

        test('should return false when value already exists in block', () => {
            grid.setCellValue(0, 0, 1);
            grid.setCellValue(0, 1, 2);
            grid.setCellValue(1, 0, 3);

            expect(ruleEngine.validateBlock(grid, 1, 1, 1)).toBe(false);
            expect(ruleEngine.validateBlock(grid, 2, 2, 2)).toBe(false);
            expect(ruleEngine.validateBlock(grid, 0, 2, 3)).toBe(false);
        });

        test('should validate different blocks independently', () => {
            grid.setCellValue(0, 0, 1);
            grid.setCellValue(3, 3, 1);

            expect(ruleEngine.validateBlock(grid, 0, 0, 1)).toBe(false);
            expect(ruleEngine.validateBlock(grid, 3, 3, 1)).toBe(false);
            expect(ruleEngine.validateBlock(grid, 0, 3, 1)).toBe(true);
            expect(ruleEngine.validateBlock(grid, 3, 0, 1)).toBe(true);
        });
    });

    describe('validateMove', () => {
        test('should return true for empty cell value', () => {
            expect(ruleEngine.validateMove(grid, 0, 0, EMPTY_CELL)).toBe(true);
        });

        test('should return false for invalid values', () => {
            expect(ruleEngine.validateMove(grid, 0, 0, 10)).toBe(false);
            expect(ruleEngine.validateMove(grid, 0, 0, -1)).toBe(false);
        });

        test('should return true for valid move', () => {
            expect(ruleEngine.validateMove(grid, 0, 0, 5)).toBe(true);
        });

        test('should return false when move violates any rule', () => {
            grid.setCellValue(0, 1, 5);
            expect(ruleEngine.validateMove(grid, 0, 0, 5)).toBe(false);

            grid.clear();
            grid.setCellValue(1, 0, 5);
            expect(ruleEngine.validateMove(grid, 0, 0, 5)).toBe(false);

            grid.clear();
            grid.setCellValue(1, 1, 5);
            expect(ruleEngine.validateMove(grid, 0, 0, 5)).toBe(false);
        });

        test('should validate with all rules combined', () => {
            grid.setCellValue(0, 1, 1);
            grid.setCellValue(1, 0, 2);
            grid.setCellValue(1, 1, 3);

            expect(ruleEngine.validateMove(grid, 0, 0, 4)).toBe(true);
            expect(ruleEngine.validateMove(grid, 0, 0, 1)).toBe(false);
            expect(ruleEngine.validateMove(grid, 0, 0, 2)).toBe(false);
            expect(ruleEngine.validateMove(grid, 0, 0, 3)).toBe(false);
        });
    });

    describe('getAllViolations', () => {
        test('should return empty array for valid grid', () => {
            grid.setCellValue(0, 0, 1);
            grid.setCellValue(0, 1, 2);
            grid.setCellValue(1, 0, 3);

            const violations = ruleEngine.getAllViolations(grid);
            expect(violations).toEqual([]);
        });

        test('should detect row violations', () => {
            grid.setCellValue(0, 0, 1);
            grid.setCellValue(0, 1, 1);

            const violations = ruleEngine.getAllViolations(grid);
            expect(violations).toHaveLength(2);
            expect(violations).toContainEqual({ row: 0, col: 0, value: 1 });
            expect(violations).toContainEqual({ row: 0, col: 1, value: 1 });
        });

        test('should detect column violations', () => {
            grid.setCellValue(0, 0, 1);
            grid.setCellValue(1, 0, 1);

            const violations = ruleEngine.getAllViolations(grid);
            expect(violations).toHaveLength(2);
            expect(violations).toContainEqual({ row: 0, col: 0, value: 1 });
            expect(violations).toContainEqual({ row: 1, col: 0, value: 1 });
        });

        test('should detect block violations', () => {
            grid.setCellValue(0, 0, 1);
            grid.setCellValue(1, 1, 1);

            const violations = ruleEngine.getAllViolations(grid);
            expect(violations).toHaveLength(2);
            expect(violations).toContainEqual({ row: 0, col: 0, value: 1 });
            expect(violations).toContainEqual({ row: 1, col: 1, value: 1 });
        });

        test('should detect multiple types of violations', () => {
            grid.setCellValue(0, 0, 1);
            grid.setCellValue(0, 1, 1);
            grid.setCellValue(1, 0, 1);

            const violations = ruleEngine.getAllViolations(grid);
            expect(violations).toHaveLength(3);
        });
    });

    describe('getRowViolations', () => {
        test('should return all cells in row with specified value', () => {
            grid.setCellValue(0, 0, 5);
            grid.setCellValue(0, 2, 5);
            grid.setCellValue(0, 5, 7);

            const violations = ruleEngine.getRowViolations(grid, 0, 5);
            expect(violations).toHaveLength(2);
            expect(violations).toContainEqual({ row: 0, col: 0, value: 5, type: 'row' });
            expect(violations).toContainEqual({ row: 0, col: 2, value: 5, type: 'row' });
        });

        test('should return empty array when no violations', () => {
            grid.setCellValue(0, 0, 5);
            grid.setCellValue(0, 2, 7);

            const violations = ruleEngine.getRowViolations(grid, 0, 3);
            expect(violations).toEqual([]);
        });
    });

    describe('getColumnViolations', () => {
        test('should return all cells in column with specified value', () => {
            grid.setCellValue(0, 0, 5);
            grid.setCellValue(2, 0, 5);
            grid.setCellValue(5, 0, 7);

            const violations = ruleEngine.getColumnViolations(grid, 0, 5);
            expect(violations).toHaveLength(2);
            expect(violations).toContainEqual({ row: 0, col: 0, value: 5, type: 'column' });
            expect(violations).toContainEqual({ row: 2, col: 0, value: 5, type: 'column' });
        });

        test('should return empty array when no violations', () => {
            grid.setCellValue(0, 0, 5);
            grid.setCellValue(2, 0, 7);

            const violations = ruleEngine.getColumnViolations(grid, 0, 3);
            expect(violations).toEqual([]);
        });
    });

    describe('getBlockViolations', () => {
        test('should return all cells in block with specified value', () => {
            grid.setCellValue(0, 0, 5);
            grid.setCellValue(1, 1, 5);
            grid.setCellValue(2, 2, 7);

            const violations = ruleEngine.getBlockViolations(grid, 0, 0, 5);
            expect(violations).toHaveLength(2);
            expect(violations).toContainEqual({ row: 0, col: 0, value: 5, type: 'block' });
            expect(violations).toContainEqual({ row: 1, col: 1, value: 5, type: 'block' });
        });

        test('should return empty array when no violations', () => {
            grid.setCellValue(0, 0, 5);
            grid.setCellValue(1, 1, 7);

            const violations = ruleEngine.getBlockViolations(grid, 0, 0, 3);
            expect(violations).toEqual([]);
        });
    });

    describe('constants', () => {
        test('should have correct MIN_VALUE and MAX_VALUE', () => {
            expect(MIN_VALUE).toBe(1);
            expect(MAX_VALUE).toBe(9);
        });
    });
});