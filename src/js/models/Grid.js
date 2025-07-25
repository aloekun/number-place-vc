const GRID_SIZE = 9;
const BLOCK_SIZE = 3;
const EMPTY_CELL = 0;

class Grid {
    constructor(size = GRID_SIZE) {
        this.size = size;
        this.blockSize = BLOCK_SIZE;
        this.cells = this.createEmptyGrid();
    }

    createEmptyGrid() {
        return Array(this.size).fill(null).map(() => 
            Array(this.size).fill(EMPTY_CELL)
        );
    }

    getCellValue(row, col) {
        if (!this.isValidPosition(row, col)) {
            return null;
        }
        return this.cells[row][col];
    }

    setCellValue(row, col, value) {
        if (!this.isValidPosition(row, col)) {
            return false;
        }
        this.cells[row][col] = value;
        return true;
    }

    isValidPosition(row, col) {
        return row >= 0 && row < this.size && col >= 0 && col < this.size;
    }

    getBlockIndex(row, col) {
        if (!this.isValidPosition(row, col)) {
            return null;
        }
        const blockRow = Math.floor(row / this.blockSize);
        const blockCol = Math.floor(col / this.blockSize);
        return { blockRow, blockCol };
    }

    getBlockCells(row, col) {
        const blockIndex = this.getBlockIndex(row, col);
        if (!blockIndex) {
            return [];
        }
        
        const cells = [];
        const startRow = blockIndex.blockRow * this.blockSize;
        const startCol = blockIndex.blockCol * this.blockSize;
        
        for (let r = startRow; r < startRow + this.blockSize; r++) {
            for (let c = startCol; c < startCol + this.blockSize; c++) {
                cells.push({ row: r, col: c, value: this.cells[r][c] });
            }
        }
        return cells;
    }

    clone() {
        const newGrid = new Grid(this.size);
        newGrid.cells = this.cells.map(row => [...row]);
        return newGrid;
    }

    isEmpty(row, col) {
        return this.getCellValue(row, col) === EMPTY_CELL;
    }

    clear() {
        this.cells = this.createEmptyGrid();
    }

    isFull() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.isEmpty(row, col)) {
                    return false;
                }
            }
        }
        return true;
    }
}

export { Grid, GRID_SIZE, BLOCK_SIZE, EMPTY_CELL };