import { Grid, GRID_SIZE, BLOCK_SIZE, EMPTY_CELL } from '../src/js/models/Grid.js';

describe('Grid', () => {
    let grid;

    beforeEach(() => {
        grid = new Grid();
    });

    describe('constructor', () => {
        test('should create a grid with default size', () => {
            expect(grid.size).toBe(GRID_SIZE);
            expect(grid.blockSize).toBe(BLOCK_SIZE);
        });

        test('should create a grid with custom size', () => {
            const customGrid = new Grid(16);
            expect(customGrid.size).toBe(16);
        });

        test('should initialize all cells as empty', () => {
            for (let row = 0; row < grid.size; row++) {
                for (let col = 0; col < grid.size; col++) {
                    expect(grid.getCellValue(row, col)).toBe(EMPTY_CELL);
                }
            }
        });
    });

    describe('getCellValue', () => {
        test('should return cell value for valid position', () => {
            grid.cells[0][0] = 5;
            expect(grid.getCellValue(0, 0)).toBe(5);
        });

        test('should return null for invalid position', () => {
            expect(grid.getCellValue(-1, 0)).toBeNull();
            expect(grid.getCellValue(0, -1)).toBeNull();
            expect(grid.getCellValue(9, 0)).toBeNull();
            expect(grid.getCellValue(0, 9)).toBeNull();
        });
    });

    describe('setCellValue', () => {
        test('should set cell value for valid position', () => {
            const result = grid.setCellValue(0, 0, 7);
            expect(result).toBe(true);
            expect(grid.getCellValue(0, 0)).toBe(7);
        });

        test('should return false for invalid position', () => {
            expect(grid.setCellValue(-1, 0, 5)).toBe(false);
            expect(grid.setCellValue(0, -1, 5)).toBe(false);
            expect(grid.setCellValue(9, 0, 5)).toBe(false);
            expect(grid.setCellValue(0, 9, 5)).toBe(false);
        });
    });

    describe('isValidPosition', () => {
        test('should return true for valid positions', () => {
            expect(grid.isValidPosition(0, 0)).toBe(true);
            expect(grid.isValidPosition(4, 4)).toBe(true);
            expect(grid.isValidPosition(8, 8)).toBe(true);
        });

        test('should return false for invalid positions', () => {
            expect(grid.isValidPosition(-1, 0)).toBe(false);
            expect(grid.isValidPosition(0, -1)).toBe(false);
            expect(grid.isValidPosition(9, 0)).toBe(false);
            expect(grid.isValidPosition(0, 9)).toBe(false);
        });
    });

    describe('getBlockIndex', () => {
        test('should return correct block index for valid positions', () => {
            expect(grid.getBlockIndex(0, 0)).toEqual({ blockRow: 0, blockCol: 0 });
            expect(grid.getBlockIndex(1, 1)).toEqual({ blockRow: 0, blockCol: 0 });
            expect(grid.getBlockIndex(2, 2)).toEqual({ blockRow: 0, blockCol: 0 });
            expect(grid.getBlockIndex(3, 3)).toEqual({ blockRow: 1, blockCol: 1 });
            expect(grid.getBlockIndex(6, 6)).toEqual({ blockRow: 2, blockCol: 2 });
            expect(grid.getBlockIndex(8, 8)).toEqual({ blockRow: 2, blockCol: 2 });
        });

        test('should return null for invalid positions', () => {
            expect(grid.getBlockIndex(-1, 0)).toBeNull();
            expect(grid.getBlockIndex(0, -1)).toBeNull();
            expect(grid.getBlockIndex(9, 0)).toBeNull();
            expect(grid.getBlockIndex(0, 9)).toBeNull();
        });
    });

    describe('getBlockCells', () => {
        test('should return all cells in the same block', () => {
            const blockCells = grid.getBlockCells(0, 0);
            expect(blockCells).toHaveLength(9);
            
            const expectedCells = [
                { row: 0, col: 0, value: 0 }, { row: 0, col: 1, value: 0 }, { row: 0, col: 2, value: 0 },
                { row: 1, col: 0, value: 0 }, { row: 1, col: 1, value: 0 }, { row: 1, col: 2, value: 0 },
                { row: 2, col: 0, value: 0 }, { row: 2, col: 1, value: 0 }, { row: 2, col: 2, value: 0 }
            ];
            
            expect(blockCells).toEqual(expectedCells);
        });

        test('should return correct cells for middle block', () => {
            const blockCells = grid.getBlockCells(4, 4);
            expect(blockCells).toHaveLength(9);
            
            const expectedPositions = [
                [3, 3], [3, 4], [3, 5],
                [4, 3], [4, 4], [4, 5],
                [5, 3], [5, 4], [5, 5]
            ];
            
            expectedPositions.forEach(([row, col], index) => {
                expect(blockCells[index].row).toBe(row);
                expect(blockCells[index].col).toBe(col);
            });
        });

        test('should return empty array for invalid position', () => {
            expect(grid.getBlockCells(-1, 0)).toEqual([]);
            expect(grid.getBlockCells(0, -1)).toEqual([]);
            expect(grid.getBlockCells(9, 0)).toEqual([]);
            expect(grid.getBlockCells(0, 9)).toEqual([]);
        });
    });

    describe('clone', () => {
        test('should create a deep copy of the grid', () => {
            grid.setCellValue(0, 0, 5);
            grid.setCellValue(1, 1, 7);
            
            const clonedGrid = grid.clone();
            
            expect(clonedGrid).not.toBe(grid);
            expect(clonedGrid.cells).not.toBe(grid.cells);
            expect(clonedGrid.getCellValue(0, 0)).toBe(5);
            expect(clonedGrid.getCellValue(1, 1)).toBe(7);
            
            clonedGrid.setCellValue(0, 0, 9);
            expect(grid.getCellValue(0, 0)).toBe(5);
        });
    });

    describe('isEmpty', () => {
        test('should return true for empty cells', () => {
            expect(grid.isEmpty(0, 0)).toBe(true);
        });

        test('should return false for non-empty cells', () => {
            grid.setCellValue(0, 0, 5);
            expect(grid.isEmpty(0, 0)).toBe(false);
        });
    });

    describe('clear', () => {
        test('should clear all cells in the grid', () => {
            grid.setCellValue(0, 0, 5);
            grid.setCellValue(1, 1, 7);
            grid.setCellValue(8, 8, 9);
            
            grid.clear();
            
            for (let row = 0; row < grid.size; row++) {
                for (let col = 0; col < grid.size; col++) {
                    expect(grid.getCellValue(row, col)).toBe(EMPTY_CELL);
                }
            }
        });
    });

    describe('isFull', () => {
        test('should return false for empty grid', () => {
            expect(grid.isFull()).toBe(false);
        });

        test('should return false for partially filled grid', () => {
            grid.setCellValue(0, 0, 5);
            grid.setCellValue(1, 1, 7);
            expect(grid.isFull()).toBe(false);
        });

        test('should return true for completely filled grid', () => {
            for (let row = 0; row < grid.size; row++) {
                for (let col = 0; col < grid.size; col++) {
                    grid.setCellValue(row, col, 1);
                }
            }
            expect(grid.isFull()).toBe(true);
        });
    });

    describe('getRelatedCells', () => {
        test('should return related cells for center position', () => {
            const relatedCells = grid.getRelatedCells(4, 4);
            
            // 同一行: 8セル（自分以外）
            // 同一列: 8セル（自分以外、行との重複除く）
            // 同一ブロック: 8セル（自分以外、行・列との重複除く）
            const expectedCount = 20; // 3×3 + 3×3 + 3×3 - 重複 = 20
            expect(relatedCells).toHaveLength(expectedCount);
            
            // 自分自身は含まれない
            expect(relatedCells.find(cell => cell.row === 4 && cell.col === 4)).toBeUndefined();
            
            // 同一行のセルが含まれる
            expect(relatedCells.find(cell => cell.row === 4 && cell.col === 0)).toBeDefined();
            expect(relatedCells.find(cell => cell.row === 4 && cell.col === 8)).toBeDefined();
            
            // 同一列のセルが含まれる
            expect(relatedCells.find(cell => cell.row === 0 && cell.col === 4)).toBeDefined();
            expect(relatedCells.find(cell => cell.row === 8 && cell.col === 4)).toBeDefined();
            
            // 同一ブロックのセルが含まれる
            expect(relatedCells.find(cell => cell.row === 3 && cell.col === 3)).toBeDefined();
            expect(relatedCells.find(cell => cell.row === 5 && cell.col === 5)).toBeDefined();
        });

        test('should return related cells for corner position', () => {
            const relatedCells = grid.getRelatedCells(0, 0);
            
            const expectedCount = 20;
            expect(relatedCells).toHaveLength(expectedCount);
            
            // 自分自身は含まれない
            expect(relatedCells.find(cell => cell.row === 0 && cell.col === 0)).toBeUndefined();
            
            // 同一行のセルが含まれる
            expect(relatedCells.find(cell => cell.row === 0 && cell.col === 8)).toBeDefined();
            
            // 同一列のセルが含まれる
            expect(relatedCells.find(cell => cell.row === 8 && cell.col === 0)).toBeDefined();
            
            // 同一ブロックのセルが含まれる
            expect(relatedCells.find(cell => cell.row === 2 && cell.col === 2)).toBeDefined();
        });

        test('should return empty array for invalid position', () => {
            const relatedCells = grid.getRelatedCells(-1, 5);
            expect(relatedCells).toEqual([]);
            
            const relatedCells2 = grid.getRelatedCells(5, 10);
            expect(relatedCells2).toEqual([]);
        });

        test('should not include duplicates in related cells', () => {
            const relatedCells = grid.getRelatedCells(4, 4);
            
            // 重複がないことを確認
            const cellKeys = relatedCells.map(cell => `${cell.row},${cell.col}`);
            const uniqueKeys = new Set(cellKeys);
            expect(cellKeys.length).toBe(uniqueKeys.size);
        });
    });
});