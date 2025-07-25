# Design Document

## Overview

WebベースのナンバープレースゲームをHTML5、CSS3、JavaScriptを使用して開発します。システムはクライアントサイドで完結し、問題生成からゲームプレイまでをブラウザ内で処理します。モジュラー設計により、将来的な機能拡張（異なるグリッドサイズや追加ルール）に対応可能な構造とします。

## Architecture

### システム構成
```
┌─────────────────────────────────────┐
│           Web Browser               │
├─────────────────────────────────────┤
│  UI Layer (HTML/CSS)                │
├─────────────────────────────────────┤
│  Game Controller                    │
├─────────────────────────────────────┤
│  Game Logic Layer                   │
│  ├─ Puzzle Generator                │
│  ├─ Rule Engine                     │
│  ├─ Game State Manager              │
│  └─ Validation Engine               │
├─────────────────────────────────────┤
│  Data Layer                         │
│  ├─ Grid Model                      │
│  ├─ Game History                    │
│  └─ Configuration                   │
└─────────────────────────────────────┘
```

### 技術スタック
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Build Tool**: なし（シンプルな静的ファイル構成）
- **Testing**: Jest（単体テスト用）

## Components and Interfaces

### 1. Grid Model
```javascript
class Grid {
  constructor(size = 9)
  getCellValue(row, col)
  setCellValue(row, col, value)
  isValidMove(row, col, value)
  getBlockIndex(row, col)
  clone()
}
```

### 2. Rule Engine
```javascript
class RuleEngine {
  validateRow(grid, row, value)
  validateColumn(grid, col, value)
  validateBlock(grid, row, col, value)
  validateMove(grid, row, col, value)
  getAllViolations(grid)
}
```

### 3. Puzzle Generator
```javascript
class PuzzleGenerator {
  generateSolution()
  createPuzzle(difficulty)
  removeNumbers(grid, count)
  hasUniqueSolution(grid)
}
```

### 4. Game State Manager
```javascript
class GameState {
  constructor()
  startNewGame(puzzle)
  makeMove(row, col, value)
  undoMove()
  resetGame()
  isComplete()
  getElapsedTime()
}
```

### 5. UI Controller
```javascript
class UIController {
  constructor(gameState, ruleEngine)
  renderGrid()
  handleCellClick(row, col)
  handleKeyInput(key)
  showValidationErrors(violations)
  showGameComplete()
}
```

## Data Models

### Grid Data Structure
```javascript
// 9x9の二次元配列
const grid = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  // ... 9行
];

// セル状態管理
const cellStates = {
  given: 'given',     // 初期ヒント
  user: 'user',       // ユーザー入力
  empty: 'empty',     // 空のマス
  error: 'error'      // エラー状態
};
```

### Game History
```javascript
const moveHistory = [
  { row: 0, col: 2, oldValue: 0, newValue: 4, timestamp: Date.now() },
  // ...
];
```

### Configuration
```javascript
const gameConfig = {
  gridSize: 9,
  blockSize: 3,
  difficulty: 'medium',
  showTimer: true,
  showErrors: true
};
```

## Error Handling

### Validation Errors
- **重複エラー**: 同じ行・列・ブロック内の重複を検出
- **無効入力**: 1-9以外の値の入力を防止
- **読み取り専用セル**: 初期ヒントセルの変更を防止

### Error Display Strategy
```javascript
const errorHandling = {
  // リアルタイム検証
  onInput: (row, col, value) => {
    const violations = ruleEngine.validateMove(grid, row, col, value);
    if (violations.length > 0) {
      highlightErrors(violations);
    }
  },
  
  // エラー表示
  highlightErrors: (violations) => {
    violations.forEach(v => {
      document.querySelector(`[data-row="${v.row}"][data-col="${v.col}"]`)
        .classList.add('error');
    });
  }
};
```

## Testing Strategy

### Unit Tests
1. **Grid Model Tests**
   - セル値の設定・取得
   - グリッドの複製
   - ブロックインデックス計算

2. **Rule Engine Tests**
   - 行・列・ブロック検証
   - 複合ルール検証
   - エラーケース処理

3. **Puzzle Generator Tests**
   - 解の生成
   - 一意解の検証
   - 難易度別問題生成

4. **Game State Tests**
   - 状態遷移
   - 履歴管理
   - 完了判定

### Integration Tests
1. **UI Integration**
   - ユーザー入力からUI更新まで
   - エラー表示の連携
   - ゲーム完了フロー

2. **End-to-End Scenarios**
   - 新規ゲーム開始から完了まで
   - エラー修正フロー
   - リセット・元に戻す機能

### Performance Considerations
- **問題生成**: バックトラッキングアルゴリズムの最適化
- **リアルタイム検証**: 差分更新による高速化
- **UI更新**: 必要な部分のみの再描画

### Extensibility Design
将来の拡張に備えた設計パターン：

```javascript
// ルールの抽象化
class BaseRule {
  validate(grid, row, col, value) { /* abstract */ }
}

class StandardSudokuRule extends BaseRule { /* 標準ルール */ }
class DiagonalRule extends BaseRule { /* 対角線ルール */ }

// グリッドサイズの抽象化
class GridConfig {
  constructor(size, blockWidth, blockHeight) {
    this.size = size;
    this.blockWidth = blockWidth;
    this.blockHeight = blockHeight;
  }
}
```