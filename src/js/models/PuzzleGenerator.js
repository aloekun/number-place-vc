import { Grid, EMPTY_CELL } from './Grid.js';
import { RuleEngine, MIN_VALUE, MAX_VALUE } from './RuleEngine.js';

const DIFFICULTY_LEVELS = {
    easy: { minHints: 40, maxHints: 45 },
    medium: { minHints: 30, maxHints: 39 },
    hard: { minHints: 25, maxHints: 29 },
    expert: { minHints: 17, maxHints: 24 }
};

class PuzzleGenerator {
    constructor() {
        this.ruleEngine = new RuleEngine();
    }

    generateSolution() {
        const grid = new Grid();
        if (this.fillGrid(grid)) {
            return grid;
        }
        return null;
    }

    fillGrid(grid, row = 0, col = 0) {
        if (row === grid.size) {
            return true;
        }

        const nextRow = col === grid.size - 1 ? row + 1 : row;
        const nextCol = col === grid.size - 1 ? 0 : col + 1;

        if (!grid.isEmpty(row, col)) {
            return this.fillGrid(grid, nextRow, nextCol);
        }

        const numbers = this.getShuffledNumbers();
        
        for (const num of numbers) {
            if (this.ruleEngine.validateMove(grid, row, col, num)) {
                grid.setCellValue(row, col, num);
                
                if (this.fillGrid(grid, nextRow, nextCol)) {
                    return true;
                }
                
                grid.setCellValue(row, col, EMPTY_CELL);
            }
        }

        return false;
    }

    getShuffledNumbers() {
        const numbers = [];
        for (let i = MIN_VALUE; i <= MAX_VALUE; i++) {
            numbers.push(i);
        }
        return this.shuffleArray(numbers);
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    createPuzzle(difficulty = 'medium') {
        const solution = this.generateSolution();
        if (!solution) {
            return null;
        }

        const puzzle = solution.clone();
        const difficultyConfig = DIFFICULTY_LEVELS[difficulty] || DIFFICULTY_LEVELS.medium;
        
        return this.removeNumbers(puzzle, difficultyConfig);
    }

    removeNumbers(grid, difficultyConfig) {
        const positions = this.getAllPositions(grid);
        const shuffledPositions = this.shuffleArray(positions);
        
        let removedCount = 0;
        const maxRemove = grid.size * grid.size - difficultyConfig.minHints;
        
        for (const pos of shuffledPositions) {
            if (removedCount >= maxRemove) {
                break;
            }
            
            const originalValue = grid.getCellValue(pos.row, pos.col);
            grid.setCellValue(pos.row, pos.col, EMPTY_CELL);
            
            if (!this.hasUniqueSolution(grid)) {
                grid.setCellValue(pos.row, pos.col, originalValue);
            } else {
                removedCount++;
            }
        }
        
        return grid;
    }

    getAllPositions(grid) {
        const positions = [];
        for (let row = 0; row < grid.size; row++) {
            for (let col = 0; col < grid.size; col++) {
                positions.push({ row, col });
            }
        }
        return positions;
    }

    hasUniqueSolution(grid) {
        const solutions = [];
        this.countSolutions(grid.clone(), solutions, 2);
        return solutions.length === 1;
    }

    countSolutions(grid, solutions, maxSolutions) {
        if (solutions.length >= maxSolutions) {
            return;
        }

        const emptyCell = this.findEmptyCell(grid);
        if (!emptyCell) {
            solutions.push(grid.clone());
            return;
        }

        for (let num = MIN_VALUE; num <= MAX_VALUE; num++) {
            if (this.ruleEngine.validateMove(grid, emptyCell.row, emptyCell.col, num)) {
                grid.setCellValue(emptyCell.row, emptyCell.col, num);
                this.countSolutions(grid, solutions, maxSolutions);
                grid.setCellValue(emptyCell.row, emptyCell.col, EMPTY_CELL);
            }
        }
    }

    findEmptyCell(grid) {
        for (let row = 0; row < grid.size; row++) {
            for (let col = 0; col < grid.size; col++) {
                if (grid.isEmpty(row, col)) {
                    return { row, col };
                }
            }
        }
        return null;
    }
}

export { PuzzleGenerator, DIFFICULTY_LEVELS };