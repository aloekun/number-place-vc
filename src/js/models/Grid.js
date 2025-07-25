const GRID_SIZE = 9;
const BLOCK_SIZE = 3;
const EMPTY_CELL = 0;

class Grid {
    constructor(size = GRID_SIZE) {
        this.size = size;
        this.blockSize = BLOCK_SIZE;
        this.cells = this.createEmptyGrid();
        this.candidates = this.createEmptyCandidatesGrid();
    }

    createEmptyGrid() {
        return Array(this.size).fill(null).map(() => 
            Array(this.size).fill(EMPTY_CELL)
        );
    }

    createEmptyCandidatesGrid() {
        return Array(this.size).fill(null).map(() => 
            Array(this.size).fill(null).map(() => new Set())
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
        newGrid.candidates = this.candidates.map(row => 
            row.map(cell => new Set(cell))
        );
        return newGrid;
    }

    isEmpty(row, col) {
        return this.getCellValue(row, col) === EMPTY_CELL;
    }

    clear() {
        this.cells = this.createEmptyGrid();
        this.candidates = this.createEmptyCandidatesGrid();
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

    // 候補数字操作メソッド
    addCandidate(row, col, value) {
        if (!this.isValidPosition(row, col)) {
            return false;
        }
        if (value < 1 || value > 9) {
            return false;
        }
        this.candidates[row][col].add(value);
        return true;
    }

    removeCandidate(row, col, value) {
        if (!this.isValidPosition(row, col)) {
            return false;
        }
        this.candidates[row][col].delete(value);
        return true;
    }

    toggleCandidate(row, col, value) {
        if (!this.isValidPosition(row, col)) {
            return false;
        }
        if (value < 1 || value > 9) {
            return false;
        }
        
        if (this.candidates[row][col].has(value)) {
            this.candidates[row][col].delete(value);
        } else {
            this.candidates[row][col].add(value);
        }
        return true;
    }

    getCandidates(row, col) {
        if (!this.isValidPosition(row, col)) {
            return new Set();
        }
        return new Set(this.candidates[row][col]);
    }

    setCandidates(row, col, candidatesSet) {
        if (!this.isValidPosition(row, col)) {
            return false;
        }
        this.candidates[row][col] = new Set(candidatesSet);
        return true;
    }

    clearCandidates(row, col) {
        if (!this.isValidPosition(row, col)) {
            return false;
        }
        this.candidates[row][col].clear();
        return true;
    }

    clearAllCandidates() {
        this.candidates = this.createEmptyCandidatesGrid();
    }

    hasCandidates(row, col) {
        if (!this.isValidPosition(row, col)) {
            return false;
        }
        return this.candidates[row][col].size > 0;
    }

    getRelatedCells(row, col) {
        if (!this.isValidPosition(row, col)) {
            return [];
        }

        const relatedCells = [];
        const blockIndex = this.getBlockIndex(row, col);
        
        if (!blockIndex) {
            return [];
        }

        const { blockRow, blockCol } = blockIndex;
        const startRow = blockRow * this.blockSize;
        const startCol = blockCol * this.blockSize;

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                // 自分自身は除外
                if (r === row && c === col) {
                    continue;
                }

                // 同一行または同一列
                if (r === row || c === col) {
                    relatedCells.push({ row: r, col: c });
                    continue;
                }

                // 同一ブロック
                if (r >= startRow && r < startRow + this.blockSize &&
                    c >= startCol && c < startCol + this.blockSize) {
                    relatedCells.push({ row: r, col: c });
                }
            }
        }

        return relatedCells;
    }
}

export { Grid, GRID_SIZE, BLOCK_SIZE, EMPTY_CELL };