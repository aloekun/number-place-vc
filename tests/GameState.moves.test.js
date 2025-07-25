import { GameState, GAME_STATUS, CELL_TYPE } from '../src/js/models/GameState.js';
import { Grid, EMPTY_CELL } from '../src/js/models/Grid.js';

describe('GameState - Move Operations', () => {
    let gameState;
    let testGrid;

    beforeEach(() => {
        gameState = new GameState();
        testGrid = new Grid();
        
        // テスト用のパズルを作成
        testGrid.setCellValue(0, 0, 5);
        testGrid.setCellValue(0, 1, 3);
        testGrid.setCellValue(1, 0, 6);
        testGrid.setCellValue(1, 1, 8);
        
        gameState.startNewGame(testGrid);
    });

    describe('makeMove', () => {
        test('should make valid move successfully', () => {
            const result = gameState.makeMove(0, 2, 7);
            
            expect(result).toBe(true);
            expect(gameState.getCellValue(0, 2)).toBe(7);
            expect(gameState.getCellType(0, 2)).toBe(CELL_TYPE.USER);
            expect(gameState.moveHistory).toHaveLength(1);
        });

        test('should not allow move on given cells', () => {
            const result = gameState.makeMove(0, 0, 9); // セル(0,0)は初期ヒント
            
            expect(result).toBe(false);
            expect(gameState.getCellValue(0, 0)).toBe(5); // 変更されない
            expect(gameState.moveHistory).toHaveLength(0);
        });

        test('should not allow move when game not in progress', () => {
            gameState.status = GAME_STATUS.NOT_STARTED;
            const result = gameState.makeMove(0, 2, 7);
            
            expect(result).toBe(false);
            expect(gameState.moveHistory).toHaveLength(0);
        });

        test('should not allow move when game is paused', () => {
            gameState.pauseGame();
            const result = gameState.makeMove(0, 2, 7);
            
            expect(result).toBe(false);
            expect(gameState.moveHistory).toHaveLength(0);
        });

        test('should not allow move when game is completed', () => {
            gameState.status = GAME_STATUS.COMPLETED;
            const result = gameState.makeMove(0, 2, 7);
            
            expect(result).toBe(false);
            expect(gameState.moveHistory).toHaveLength(0);
        });

        test('should record move in history with correct details', () => {
            const beforeTime = Date.now();
            gameState.makeMove(0, 2, 7);
            const afterTime = Date.now();
            
            expect(gameState.moveHistory).toHaveLength(1);
            
            const move = gameState.moveHistory[0];
            expect(move.row).toBe(0);
            expect(move.col).toBe(2);
            expect(move.oldValue).toBe(EMPTY_CELL);
            expect(move.newValue).toBe(7);
            expect(move.timestamp).toBeGreaterThanOrEqual(beforeTime);
            expect(move.timestamp).toBeLessThanOrEqual(afterTime);
        });

        test('should handle overwriting user move', () => {
            // 最初の移動
            gameState.makeMove(0, 2, 7);
            expect(gameState.getCellValue(0, 2)).toBe(7);
            expect(gameState.moveHistory).toHaveLength(1);
            
            // 同じセルに別の値を設定
            gameState.makeMove(0, 2, 4);
            expect(gameState.getCellValue(0, 2)).toBe(4);
            expect(gameState.moveHistory).toHaveLength(2);
            
            const secondMove = gameState.moveHistory[1];
            expect(secondMove.oldValue).toBe(7); // 前の値
            expect(secondMove.newValue).toBe(4);
        });

        test('should handle clearing cell (setting to empty)', () => {
            // セルに値を設定
            gameState.makeMove(0, 2, 7);
            expect(gameState.getCellValue(0, 2)).toBe(7);
            expect(gameState.getCellType(0, 2)).toBe(CELL_TYPE.USER);
            
            // セルをクリア
            gameState.makeMove(0, 2, EMPTY_CELL);
            expect(gameState.getCellValue(0, 2)).toBe(EMPTY_CELL);
            expect(gameState.getCellType(0, 2)).toBe(CELL_TYPE.EMPTY);
        });

        test('should complete game when all cells filled correctly', () => {
            // 有効な完全解の一部を完成させる
            const completeGrid = new Grid();
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
            
            // 最後の一つだけ空にする
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (!(row === 8 && col === 8)) {
                        completeGrid.setCellValue(row, col, validSolution[row][col]);
                    }
                }
            }
            
            gameState.startNewGame(completeGrid);
            
            // 最後のセルを埋める
            const result = gameState.makeMove(8, 8, 5);
            
            expect(result).toBe(true);
            expect(gameState.status).toBe(GAME_STATUS.COMPLETED);
            expect(gameState.endTime).not.toBeNull();
        });
    });

    describe('undoMove', () => {
        test('should undo last move successfully', () => {
            gameState.makeMove(0, 2, 7);
            expect(gameState.getCellValue(0, 2)).toBe(7);
            expect(gameState.moveHistory).toHaveLength(1);
            
            const result = gameState.undoMove();
            
            expect(result).toBe(true);
            expect(gameState.getCellValue(0, 2)).toBe(EMPTY_CELL);
            expect(gameState.getCellType(0, 2)).toBe(CELL_TYPE.EMPTY);
            expect(gameState.moveHistory).toHaveLength(0);
        });

        test('should not undo when no moves in history', () => {
            const result = gameState.undoMove();
            
            expect(result).toBe(false);
            expect(gameState.moveHistory).toHaveLength(0);
        });

        test('should not undo when game not in progress', () => {
            gameState.makeMove(0, 2, 7);
            gameState.status = GAME_STATUS.COMPLETED;
            
            const result = gameState.undoMove();
            
            expect(result).toBe(false);
            expect(gameState.moveHistory).toHaveLength(1); // 履歴は残る
        });

        test('should undo multiple moves in correct order', () => {
            // 複数の移動を実行
            gameState.makeMove(0, 2, 7);
            gameState.makeMove(0, 3, 4);
            gameState.makeMove(1, 2, 9);
            
            expect(gameState.moveHistory).toHaveLength(3);
            
            // 最後の移動を元に戻す
            gameState.undoMove();
            expect(gameState.getCellValue(1, 2)).toBe(EMPTY_CELL);
            expect(gameState.moveHistory).toHaveLength(2);
            
            // 2番目の移動を元に戻す
            gameState.undoMove();
            expect(gameState.getCellValue(0, 3)).toBe(EMPTY_CELL);
            expect(gameState.moveHistory).toHaveLength(1);
            
            // 最初の移動を元に戻す
            gameState.undoMove();
            expect(gameState.getCellValue(0, 2)).toBe(EMPTY_CELL);
            expect(gameState.moveHistory).toHaveLength(0);
        });

        test('should restore previous user value when undoing', () => {
            // セルに最初の値を設定
            gameState.makeMove(0, 2, 7);
            expect(gameState.getCellValue(0, 2)).toBe(7);
            
            // 同じセルを別の値で上書き
            gameState.makeMove(0, 2, 4);
            expect(gameState.getCellValue(0, 2)).toBe(4);
            
            // 最後の移動を元に戻す（元の値7に戻る）
            gameState.undoMove();
            expect(gameState.getCellValue(0, 2)).toBe(7);
            expect(gameState.getCellType(0, 2)).toBe(CELL_TYPE.USER);
        });
    });

    describe('resetGame', () => {
        test('should reset game to original state', () => {
            // いくつかの移動を実行
            gameState.makeMove(0, 2, 7);
            gameState.makeMove(0, 3, 4);
            gameState.makeMove(1, 2, 9);
            
            expect(gameState.moveHistory).toHaveLength(3);
            
            const result = gameState.resetGame();
            
            expect(result).toBe(true);
            expect(gameState.moveHistory).toHaveLength(0);
            expect(gameState.status).toBe(GAME_STATUS.IN_PROGRESS);
            expect(gameState.endTime).toBeNull();
            
            // 元の状態に戻る
            expect(gameState.getCellValue(0, 0)).toBe(5);
            expect(gameState.getCellValue(0, 1)).toBe(3);
            expect(gameState.getCellValue(1, 0)).toBe(6);
            expect(gameState.getCellValue(1, 1)).toBe(8);
            expect(gameState.getCellValue(0, 2)).toBe(EMPTY_CELL);
        });

        test('should reset start time', () => {
            const originalStartTime = gameState.startTime;
            
            // 少し待ってからリセット
            setTimeout(() => {
                const result = gameState.resetGame();
                
                expect(result).toBe(true);
                expect(gameState.startTime).toBeGreaterThan(originalStartTime);
            }, 10);
        });

        test('should reset even when no game started (empty grid)', () => {
            const freshGameState = new GameState();
            const result = freshGameState.resetGame();
            
            // 空のグリッドでもreset可能（設計上の仕様）
            expect(result).toBe(true);
            expect(freshGameState.status).toBe(GAME_STATUS.IN_PROGRESS);
        });

        test('should preserve original puzzle after reset', () => {
            gameState.makeMove(0, 2, 7);
            gameState.resetGame();
            
            // オリジナルパズルは変更されない
            expect(gameState.originalPuzzle.getCellValue(0, 0)).toBe(5);
            expect(gameState.originalPuzzle.getCellValue(0, 1)).toBe(3);
            expect(gameState.originalPuzzle.getCellValue(1, 0)).toBe(6);
            expect(gameState.originalPuzzle.getCellValue(1, 1)).toBe(8);
        });
    });

    describe('Move History Edge Cases', () => {
        test('should handle rapid consecutive moves', () => {
            const moves = [
                { row: 0, col: 2, value: 1 },
                { row: 0, col: 3, value: 2 },
                { row: 0, col: 4, value: 4 },
                { row: 1, col: 2, value: 7 },
                { row: 1, col: 3, value: 9 }
            ];
            
            moves.forEach(move => {
                gameState.makeMove(move.row, move.col, move.value);
            });
            
            expect(gameState.moveHistory).toHaveLength(5);
            
            // すべての移動が正しく記録されているか確認
            moves.forEach((move, index) => {
                const recordedMove = gameState.moveHistory[index];
                expect(recordedMove.row).toBe(move.row);
                expect(recordedMove.col).toBe(move.col);
                expect(recordedMove.newValue).toBe(move.value);
            });
        });

        test('should handle undo after game completion', () => {
            // ゲーム完了状態をシミュレート
            gameState.status = GAME_STATUS.COMPLETED;
            gameState.endTime = Date.now();
            
            // 履歴に移動を追加（通常は完了前に追加される）
            gameState.moveHistory.push({
                row: 0,
                col: 2,
                oldValue: EMPTY_CELL,
                newValue: 7,
                timestamp: Date.now()
            });
            
            const result = gameState.undoMove();
            
            expect(result).toBe(false); // 完了状態では元に戻せない
        });
    });

    describe('Candidate Operations', () => {
        describe('makeCandidateMove', () => {
            test('should toggle candidate successfully', () => {
                const result = gameState.makeCandidateMove(0, 2, 5, 'toggle');
                
                expect(result).toBe(true);
                expect(gameState.getCandidates(0, 2)).toContain(5);
                expect(gameState.moveHistory).toHaveLength(1);
                expect(gameState.moveHistory[0].type).toBe('candidate');
            });

            test('should not allow candidate move on given cells', () => {
                const result = gameState.makeCandidateMove(0, 0, 5, 'toggle');
                
                expect(result).toBe(false);
                expect(gameState.moveHistory).toHaveLength(0);
            });

            test('should add candidate with add action', () => {
                const result = gameState.makeCandidateMove(0, 2, 5, 'add');
                
                expect(result).toBe(true);
                expect(gameState.getCandidates(0, 2)).toContain(5);
            });

            test('should remove candidate with remove action', () => {
                gameState.makeCandidateMove(0, 2, 5, 'add');
                const result = gameState.makeCandidateMove(0, 2, 5, 'remove');
                
                expect(result).toBe(true);
                expect(gameState.getCandidates(0, 2)).not.toContain(5);
            });

            test('should record candidate move in history', () => {
                const beforeTime = Date.now();
                gameState.makeCandidateMove(0, 2, 5, 'toggle');
                const afterTime = Date.now();
                
                const move = gameState.moveHistory[0];
                expect(move.row).toBe(0);
                expect(move.col).toBe(2);
                expect(move.type).toBe('candidate');
                expect(move.timestamp).toBeGreaterThanOrEqual(beforeTime);
                expect(move.timestamp).toBeLessThanOrEqual(afterTime);
                expect(move.oldCandidates).toBeInstanceOf(Set);
                expect(move.newCandidates).toBeInstanceOf(Set);
            });
        });

        describe('undoMove - Candidate Operations', () => {
            test('should undo candidate move successfully', () => {
                gameState.makeCandidateMove(0, 2, 5, 'add');
                expect(gameState.getCandidates(0, 2)).toContain(5);
                
                const result = gameState.undoMove();
                
                expect(result).toBe(true);
                expect(gameState.getCandidates(0, 2)).not.toContain(5);
                expect(gameState.moveHistory).toHaveLength(0);
            });

            test('should undo mixed main and candidate moves correctly', () => {
                gameState.makeMove(0, 2, 7);
                gameState.makeCandidateMove(0, 3, 5, 'add');
                gameState.makeCandidateMove(0, 3, 6, 'add');
                
                expect(gameState.getCellValue(0, 2)).toBe(7);
                expect(gameState.getCandidates(0, 3)).toContain(5);
                expect(gameState.getCandidates(0, 3)).toContain(6);
                expect(gameState.moveHistory).toHaveLength(3);
                
                gameState.undoMove();
                expect(gameState.getCandidates(0, 3)).toContain(5);
                expect(gameState.getCandidates(0, 3)).not.toContain(6);
                
                gameState.undoMove();
                expect(gameState.getCandidates(0, 3)).not.toContain(5);
                
                gameState.undoMove();
                expect(gameState.getCellValue(0, 2)).toBe(EMPTY_CELL);
            });
        });

        describe('Candidate Accessor Methods', () => {
            test('should get candidates correctly', () => {
                gameState.makeCandidateMove(0, 2, 5, 'add');
                gameState.makeCandidateMove(0, 2, 7, 'add');
                
                const candidates = gameState.getCandidates(0, 2);
                expect(candidates).toContain(5);
                expect(candidates).toContain(7);
                expect(candidates).not.toContain(3);
            });

            test('should set candidates correctly', () => {
                const newCandidates = new Set([1, 3, 5]);
                const result = gameState.setCandidates(0, 2, newCandidates);
                
                expect(result).toBe(true);
                expect(gameState.getCandidates(0, 2)).toEqual(newCandidates);
            });

            test('should clear candidates correctly', () => {
                gameState.makeCandidateMove(0, 2, 5, 'add');
                gameState.makeCandidateMove(0, 2, 7, 'add');
                
                const result = gameState.clearCandidates(0, 2);
                
                expect(result).toBe(true);
                expect(gameState.getCandidates(0, 2).size).toBe(0);
            });

            test('should check if cell has candidates', () => {
                expect(gameState.hasCandidates(0, 2)).toBe(false);
                
                gameState.makeCandidateMove(0, 2, 5, 'add');
                expect(gameState.hasCandidates(0, 2)).toBe(true);
                
                gameState.clearCandidates(0, 2);
                expect(gameState.hasCandidates(0, 2)).toBe(false);
            });
        });
    });

    describe('Auto Clear Related Candidates', () => {
        test('should clear related candidates when making main move', () => {
            // 候補を設定（空のセルに）
            gameState.makeCandidateMove(0, 3, 5, 'add'); // 同一行
            gameState.makeCandidateMove(2, 2, 5, 'add'); // 同一列
            gameState.makeCandidateMove(1, 2, 5, 'add'); // 同一ブロック
            gameState.makeCandidateMove(3, 3, 5, 'add'); // 異なるブロック
            
            expect(gameState.getCandidates(0, 3)).toContain(5);
            expect(gameState.getCandidates(2, 2)).toContain(5);
            expect(gameState.getCandidates(1, 2)).toContain(5);
            expect(gameState.getCandidates(3, 3)).toContain(5);
            
            // 空のセル(0, 2)に5を入力
            gameState.makeMove(0, 2, 5);
            
            // 関連するセルの候補5が削除される
            expect(gameState.getCandidates(0, 3)).not.toContain(5); // 同一行
            expect(gameState.getCandidates(2, 2)).not.toContain(5); // 同一列
            expect(gameState.getCandidates(1, 2)).not.toContain(5); // 同一ブロック
            expect(gameState.getCandidates(3, 3)).toContain(5); // 異なるブロックは残る
        });

        test('should record auto clear candidates in history', () => {
            gameState.makeCandidateMove(0, 3, 7, 'add');
            gameState.makeCandidateMove(2, 2, 7, 'add');
            
            const historyLengthBefore = gameState.moveHistory.length;
            gameState.makeMove(0, 2, 7);
            
            // メイン移動 + 候補自動削除の2つの履歴が追加される
            expect(gameState.moveHistory.length).toBe(historyLengthBefore + 2);
            
            const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
            expect(lastMove.type).toBe('auto_clear_candidates');
            expect(lastMove.clearedCandidates).toHaveLength(2);
        });

        test('should restore cleared candidates on undo', () => {
            gameState.makeCandidateMove(0, 3, 3, 'add');
            gameState.makeCandidateMove(2, 2, 3, 'add');
            
            gameState.makeMove(0, 2, 3);
            
            expect(gameState.getCandidates(0, 3)).not.toContain(3);
            expect(gameState.getCandidates(2, 2)).not.toContain(3);
            
            // undo候補自動削除
            gameState.undoMove();
            expect(gameState.getCandidates(0, 3)).toContain(3);
            expect(gameState.getCandidates(2, 2)).toContain(3);
            
            // undoメイン移動
            gameState.undoMove();
            expect(gameState.getCellValue(0, 2)).toBe(EMPTY_CELL);
        });

        test('should not clear candidates if no related candidates exist', () => {
            const historyLengthBefore = gameState.moveHistory.length;
            gameState.makeMove(0, 2, 9);
            
            // メイン移動のみ追加される（候補削除は発生しない）
            expect(gameState.moveHistory.length).toBe(historyLengthBefore + 1);
            expect(gameState.moveHistory[gameState.moveHistory.length - 1].type).toBe('main');
        });

        test('should only clear candidates for the specific value', () => {
            gameState.makeCandidateMove(0, 3, 4, 'add');
            gameState.makeCandidateMove(0, 3, 6, 'add');
            gameState.makeCandidateMove(2, 2, 4, 'add');
            gameState.makeCandidateMove(2, 2, 8, 'add');
            
            gameState.makeMove(0, 2, 4);
            
            // 候補4のみ削除、他の候補は残る
            expect(gameState.getCandidates(0, 3)).not.toContain(4);
            expect(gameState.getCandidates(0, 3)).toContain(6);
            expect(gameState.getCandidates(2, 2)).not.toContain(4);
            expect(gameState.getCandidates(2, 2)).toContain(8);
        });
    });
});