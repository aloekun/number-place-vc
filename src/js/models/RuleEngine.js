import { EMPTY_CELL } from './Grid.js';

const MIN_VALUE = 1;
const MAX_VALUE = 9;

class RuleEngine {
    validateRow(grid, row, value) {
        for (let col = 0; col < grid.size; col++) {
            if (grid.getCellValue(row, col) === value) {
                return false;
            }
        }
        return true;
    }

    validateColumn(grid, col, value) {
        for (let row = 0; row < grid.size; row++) {
            if (grid.getCellValue(row, col) === value) {
                return false;
            }
        }
        return true;
    }

    validateBlock(grid, row, col, value) {
        const blockCells = grid.getBlockCells(row, col);
        return !blockCells.some(cell => cell.value === value);
    }

    validateMove(grid, row, col, value) {
        if (value === EMPTY_CELL) {
            return true;
        }

        if (value < MIN_VALUE || value > MAX_VALUE) {
            return false;
        }

        return this.validateRow(grid, row, value) &&
               this.validateColumn(grid, col, value) &&
               this.validateBlock(grid, row, col, value);
    }

    getAllViolations(grid) {
        const violations = [];

        for (let row = 0; row < grid.size; row++) {
            for (let col = 0; col < grid.size; col++) {
                const value = grid.getCellValue(row, col);
                if (value !== EMPTY_CELL) {
                    const tempGrid = grid.clone();
                    tempGrid.setCellValue(row, col, EMPTY_CELL);
                    
                    if (!this.validateMove(tempGrid, row, col, value)) {
                        violations.push({ row, col, value });
                    }
                }
            }
        }

        return violations;
    }

    getRowViolations(grid, row, value) {
        const violations = [];
        for (let col = 0; col < grid.size; col++) {
            if (grid.getCellValue(row, col) === value) {
                violations.push({ row, col, value, type: 'row' });
            }
        }
        return violations;
    }

    getColumnViolations(grid, col, value) {
        const violations = [];
        for (let row = 0; row < grid.size; row++) {
            if (grid.getCellValue(row, col) === value) {
                violations.push({ row, col, value, type: 'column' });
            }
        }
        return violations;
    }

    getBlockViolations(grid, row, col, value) {
        const violations = [];
        const blockCells = grid.getBlockCells(row, col);
        
        blockCells.forEach(cell => {
            if (cell.value === value) {
                violations.push({ 
                    row: cell.row, 
                    col: cell.col, 
                    value: cell.value, 
                    type: 'block' 
                });
            }
        });
        
        return violations;
    }
}

export { RuleEngine, MIN_VALUE, MAX_VALUE };