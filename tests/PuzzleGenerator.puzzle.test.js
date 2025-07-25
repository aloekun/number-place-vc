import { PuzzleGenerator, DIFFICULTY_LEVELS } from '../src/js/models/PuzzleGenerator.js';
import { EMPTY_CELL } from '../src/js/models/Grid.js';
import { RuleEngine } from '../src/js/models/RuleEngine.js';

describe('PuzzleGenerator - Puzzle Creation', () => {
    let puzzleGenerator;
    let ruleEngine;

    beforeEach(() => {
        puzzleGenerator = new PuzzleGenerator();
        ruleEngine = new RuleEngine();
    });

    describe('DIFFICULTY_LEVELS', () => {
        test('should have correct difficulty configurations', () => {
            expect(DIFFICULTY_LEVELS.easy).toEqual({ minHints: 40, maxHints: 45 });
            expect(DIFFICULTY_LEVELS.medium).toEqual({ minHints: 30, maxHints: 39 });
            expect(DIFFICULTY_LEVELS.hard).toEqual({ minHints: 25, maxHints: 29 });
            expect(DIFFICULTY_LEVELS.expert).toEqual({ minHints: 17, maxHints: 30 });
        });
    });

    describe('createPuzzle', () => {
        test('should create puzzle with default medium difficulty', () => {
            const puzzle = puzzleGenerator.createPuzzle();
            
            expect(puzzle).not.toBeNull();
            
            // ヒント数を数える
            let hintCount = 0;
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (puzzle.getCellValue(row, col) !== EMPTY_CELL) {
                        hintCount++;
                    }
                }
            }
            
            expect(hintCount).toBeGreaterThanOrEqual(DIFFICULTY_LEVELS.medium.minHints);
            expect(hintCount).toBeLessThanOrEqual(DIFFICULTY_LEVELS.medium.maxHints);
        });

        test('should create easy puzzle with more hints', () => {
            const puzzle = puzzleGenerator.createPuzzle('easy');
            
            expect(puzzle).not.toBeNull();
            
            let hintCount = 0;
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (puzzle.getCellValue(row, col) !== EMPTY_CELL) {
                        hintCount++;
                    }
                }
            }
            
            expect(hintCount).toBeGreaterThanOrEqual(DIFFICULTY_LEVELS.easy.minHints);
            expect(hintCount).toBeLessThanOrEqual(DIFFICULTY_LEVELS.easy.maxHints);
        });

        test('should create hard puzzle with fewer hints', () => {
            const puzzle = puzzleGenerator.createPuzzle('hard');
            
            expect(puzzle).not.toBeNull();
            
            let hintCount = 0;
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (puzzle.getCellValue(row, col) !== EMPTY_CELL) {
                        hintCount++;
                    }
                }
            }
            
            expect(hintCount).toBeGreaterThanOrEqual(DIFFICULTY_LEVELS.hard.minHints);
            expect(hintCount).toBeLessThanOrEqual(DIFFICULTY_LEVELS.hard.maxHints);
        });

        test('should create expert puzzle with minimum hints', () => {
            const puzzle = puzzleGenerator.createPuzzle('expert');
            
            expect(puzzle).not.toBeNull();
            
            let hintCount = 0;
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (puzzle.getCellValue(row, col) !== EMPTY_CELL) {
                        hintCount++;
                    }
                }
            }
            
            expect(hintCount).toBeGreaterThanOrEqual(DIFFICULTY_LEVELS.expert.minHints);
            expect(hintCount).toBeLessThanOrEqual(DIFFICULTY_LEVELS.expert.maxHints);
        });

        test('should handle invalid difficulty by using medium', () => {
            const puzzle = puzzleGenerator.createPuzzle('invalid-difficulty');
            
            expect(puzzle).not.toBeNull();
            
            let hintCount = 0;
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (puzzle.getCellValue(row, col) !== EMPTY_CELL) {
                        hintCount++;
                    }
                }
            }
            
            expect(hintCount).toBeGreaterThanOrEqual(DIFFICULTY_LEVELS.medium.minHints);
            expect(hintCount).toBeLessThanOrEqual(DIFFICULTY_LEVELS.medium.maxHints);
        });

        test('should create valid puzzle (no violations in hints)', () => {
            const puzzle = puzzleGenerator.createPuzzle('medium');
            const violations = ruleEngine.getAllViolations(puzzle);
            
            expect(violations).toHaveLength(0);
        });

        test('should create puzzle that has unique solution', () => {
            const puzzle = puzzleGenerator.createPuzzle('medium');
            const hasUnique = puzzleGenerator.hasUniqueSolution(puzzle);
            
            expect(hasUnique).toBe(true);
        });

        test('should create different puzzles on each call', () => {
            const puzzle1 = puzzleGenerator.createPuzzle('medium');
            const puzzle2 = puzzleGenerator.createPuzzle('medium');
            
            let isDifferent = false;
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (puzzle1.getCellValue(row, col) !== puzzle2.getCellValue(row, col)) {
                        isDifferent = true;
                        break;
                    }
                }
                if (isDifferent) break;
            }
            
            expect(isDifferent).toBe(true);
        });
    });

    describe('removeNumbers', () => {
        test('should remove correct number of cells based on difficulty', () => {
            const solution = puzzleGenerator.generateSolution();
            const originalGrid = solution.clone();
            
            const difficultyConfig = DIFFICULTY_LEVELS.medium;
            const puzzle = puzzleGenerator.removeNumbers(solution, difficultyConfig);
            
            let removedCount = 0;
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (originalGrid.getCellValue(row, col) !== EMPTY_CELL &&
                        puzzle.getCellValue(row, col) === EMPTY_CELL) {
                        removedCount++;
                    }
                }
            }
            
            const expectedRemoved = 81 - difficultyConfig.minHints;
            expect(removedCount).toBeLessThanOrEqual(expectedRemoved);
        });

        test('should maintain unique solution after removing numbers', () => {
            const solution = puzzleGenerator.generateSolution();
            const difficultyConfig = DIFFICULTY_LEVELS.medium;
            const puzzle = puzzleGenerator.removeNumbers(solution.clone(), difficultyConfig);
            
            const hasUnique = puzzleGenerator.hasUniqueSolution(puzzle);
            expect(hasUnique).toBe(true);
        });

        test('should not remove numbers that would create multiple solutions', () => {
            const solution = puzzleGenerator.generateSolution();
            const difficultyConfig = { minHints: 70, maxHints: 75 }; // 少数だけ削除
            const puzzle = puzzleGenerator.removeNumbers(solution.clone(), difficultyConfig);
            
            // 残されたヒントがすべて必要であることを確認
            // （これ以上削除すると複数解になる可能性が高い）
            const hasUnique = puzzleGenerator.hasUniqueSolution(puzzle);
            expect(hasUnique).toBe(true);
        });
    });

    describe('Integration tests', () => {
        test('should create solvable puzzles for all difficulties', () => {
            const difficulties = ['easy', 'medium', 'hard', 'expert'];
            
            difficulties.forEach(difficulty => {
                const puzzle = puzzleGenerator.createPuzzle(difficulty);
                expect(puzzle).not.toBeNull();
                
                // パズルが解けることを確認
                const puzzleCopy = puzzle.clone();
                const canSolve = puzzleGenerator.fillGrid(puzzleCopy);
                expect(canSolve).toBe(true);
                
                // 解が有効であることを確認
                const violations = ruleEngine.getAllViolations(puzzleCopy);
                expect(violations).toHaveLength(0);
            });
        });

        test('should consistently create valid puzzles', () => {
            // 複数回実行して安定性を確認
            for (let i = 0; i < 5; i++) {
                const puzzle = puzzleGenerator.createPuzzle('medium');
                
                expect(puzzle).not.toBeNull();
                
                // ルール違反がないこと
                const violations = ruleEngine.getAllViolations(puzzle);
                expect(violations).toHaveLength(0);
                
                // 一意解を持つこと
                const hasUnique = puzzleGenerator.hasUniqueSolution(puzzle);
                expect(hasUnique).toBe(true);
            }
        });

    });
});