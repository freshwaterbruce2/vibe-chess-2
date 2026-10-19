# Implementation Plan — Vibe Wizard Chess 3D Polish & Fixes

Fix all 6 reported issues to deliver a calm, honest, production-ready chess experience ("Chess Master" by Vibe Tech) that is fully playable on portrait mobile and desktop.

---

## 1. Tactical Puzzle Coach: Fix All 5 Puzzles & Move Validation Runner

### Root Causes
- Puzzle 4 (*Anastasia's Mate in 2*) used illegal Knight coordinates `(3,4) -> (1,6)` which is a $(2,2)$ diagonal leap rather than an L-shape $(2,1)$, and Black's King had unblocked escapes.
- Puzzle 5 (*Bishop & Rook Net*) allowed Black King to escape via $f7$ because $f7$ was not covered.
- `App.tsx` lacked an interactive puzzle move listener to check player moves against the solution, execute opponent counter-moves in multi-move puzzles, or trigger victory feedback.

### Proposed Changes
1. **Curate and Verify 5 Real Classical Tactics**:
   - **Puzzle 1 (*Scholar's Judgment* - Mate in 1)**: White Queen on $h5$, Bishop on $c4$. Move: $Qxf7\#$.
   - **Puzzle 2 (*Cathedral Back Rank* - Mate in 1)**: Trapped King on $g8$ behind $f7, g7, h7$ pawns. White Rook on $d2$. Move: $Rd8\#$.
   - **Puzzle 3 (*Sanctum Smothered Mate* - Mate in 1)**: Trapped King on $h8$ behind friendly $g8$ Rook, $g7/h7$ pawns. White Knight on $e5$. Move: $Nf7\#$.
   - **Puzzle 4 (*Anastasia's Cross* - Classical Mate in 2)**:
     - Real Anastasia setup: White Knight on $e7$, Black King on $h8$, Black pawn on $g7$.
     - Move 1: White Queen sacrifices on $h7+$ ($Qxh7+$!), Black forced to capture $Kxh7$.
     - Move 2: White Rook swings from $a1$ to $h1\#$ ($Rh1\#$), with Knight on $e7$ sealing $g8$ and $g6$.
   - **Puzzle 5 (*Opera House Pin & Mate* - Mate in 2)**:
     - Classic Morphy / Paulsen coordination: White Queen and Bishop battery.
     - Move 1: $Qb8+$! forcing Knight/Rook sacrifice or block, followed by $Rd8\#$.
2. **Interactive Puzzle Engine Runner in `App.tsx`**:
   - Subscribe to move events via `addGameStateListener`.
   - On player move, check against expected `solution[step]`.
   - If correct in Mate-in-1: trigger victory chime, show checkmate banner, and mark puzzle as solved.
   - If correct in Step 1 of Mate-in-2: automatically animate opponent's forced response after 400ms, update prompt to "Deliver the final checkmate!", and wait for Move 2.
   - If wrong move: display helpful encouragement with a "Try Again" button to reset the altar board.
   - "Show Solution" button animates the entire winning sequence on the 3D board automatically.

---

## 2. AI Opponent Calibration: Differentiated Minimax & Alpha-Beta

### Root Causes
- Hard and Expert ran the identical code branch (`searchDepth >= 2`), which only evaluated the first 12 arbitrary moves (`oppMoves.slice(0, 12)`), while Medium ran full piece safety checks.
- Over 10 games, Expert blundered frequently and lost to Easy.

### Proposed Changes
1. **True Calibrated Search Levels**:
   - **Easy**: Depth 1 search with a calibrated 35% blunder rate (plays non-optimal quiet moves, misses tactical forks, allowing beginners to win and learn).
   - **Medium**: Depth 2 minimax evaluating all legal moves, full piece exchange math, and center control.
   - **Hard**: Depth 3 minimax with Alpha-Beta pruning, Piece-Square Tables (PST) for positional strategy, piece development, and king safety.
   - **Expert**: Depth 4 minimax with Alpha-Beta pruning + Quiescence capture search (evaluates capture chains to prevent the horizon effect), center dominance, and pawn chain structure. Expert will decisively defeat lower tiers.
2. **Deterministic & Jitter Tuning**: Jitter decreases from $\pm 35$ (Easy) down to $0$ (Expert).

---

## 3. Official FIDE Draw Rules: Threefold Repetition & 50-Move Rule

### Root Causes
- `halfmoveClock` was incremented but never evaluated.
- `positionHistory` was declared but never populated with board position hashes.
- When draws occurred (stalemate or counter triggers), no end-of-game dialog appeared.

### Proposed Changes
1. **Position Hashing for Threefold Repetition**:
   - Compute a FEN-like snapshot string on every move: piece locations, active turn, castling availability ($K, Q, k, q$), and en passant square.
   - If any position hash appears 3 times in `positionHistory`, immediately declare a Threefold Repetition Draw.
2. **50-Move Rule**:
   - When `halfmoveClock >= 100` (50 moves by White + 50 moves by Black without a pawn advance or capture), declare a 50-Move Rule Draw.
3. **End-of-Game Judgment Overlay**:
   - Re-use the cathedral art style to display a draw announcement:
     - "Draw by Stalemate — No Legal Moves"
     - "Draw by Threefold Repetition — Sacred Ground Re-entered"
     - "Draw by 50-Move Rule — Eternal Stalemate"
   - Include a "Play Again" button and "Review Board" option.

---

## 4. Autosave Persistence: Fix Computer Turn Freeze on Reload

### Root Causes
- In `loadGameFromLocalStorage()`, when a saved game was restored where it was the computer's turn (`currentTurn !== playerColor`), `maybeScheduleAIMove()` was never called.
- The player could not move because it was Black's turn, and the AI never moved because its timer was never started.

### Proposed Changes
1. Update `loadGameFromLocalStorage()`:
   - If game is active (`!gameOver`) and `gameMode === 'single'` and `currentTurn !== playerColor`, immediately schedule AI move via `maybeScheduleAIMove()`.
2. Clear any stale animating or tweening flags so board interaction is never locked.

---

## 5. Algebraic Move History & Captured Pieces UI

### User Alignment
- Mobile: Collapsible bottom drawer with swipe/tap handle.
- Desktop: Persistent, elegant side panel.

### Proposed Changes
1. **Move History State**:
   - Store standard algebraic notation (`1. e4 e5`, `2. Nf3 Nc6`, `3. Bb5 a6`) in `moveHistoryList`.
   - Update in real time as human or AI plays moves.
2. **Desktop Sidebar Layout**:
   - Elegant dark stone panel with gold filigree accents (`bg-stone-900/90 border border-amber-900/40`).
   - Two-column numbered move list (`1. e4 | e5`, `2. Nf3 | Nc6`) with auto-scroll to latest move.
   - Captured piece trays showing captured piece symbols with point differential ($\Delta$).
3. **Mobile Bottom Drawer**:
   - Compact summary pill at the bottom (`Move 8 • 8. O-O ... [View Log ▾]`).
   - Tapping opens a smooth sliding sheet showing the full notation log and captured pieces, with touch targets $\ge 44\text{px}$.

---

## 6. Portrait Mobile Framing: Fix 3D Board Cropping

### Root Causes
- `camera` was initialized with a fixed $40^\circ$ vertical FOV and a fixed camera distance ($Z = 2.72$).
- On a mobile phone in portrait ($390 \times 844$, aspect $\approx 0.46$), the horizontal FOV shrank to $19^\circ$, cropping out 3 of the 8 columns.

### Proposed Changes
1. **Aspect-Aware Camera Framing**:
   - Calculate camera distance and height based on the viewport aspect ratio (`window.innerWidth / window.innerHeight`):
     - Desktop / Landscape ($\text{aspect} \ge 1.0$): Standard distance $Z = 2.72, Y = 2.22$.
     - Mobile / Portrait ($\text{aspect} < 1.0$): Zoom camera out proportionally:
       $$Z_{\text{portrait}} = \text{sign} \cdot (2.72 + (1.0 / \text{aspect} - 1.0) \times 1.75)$$
       $$Y_{\text{portrait}} = 2.22 + (1.0 / \text{aspect} - 1.0) \times 1.45$$
       $$\text{target}_Y = 0.85$$
   - Maintain the $40^\circ$ vertical FOV so stone pieces retain their natural perspective without fish-eye distortion.
2. **Resize & Orientation Listener**:
   - Re-compute framing on orientation change / window resize so all 8 ranks and files ($a1$ to $h8$) are visible with comfortable margins.

---

## Verification Plan

1. **Unit Tests (`test/applet.test.mjs`)**:
   - Test all 5 puzzles: verify initial legal moves and exact mate sequence solutions.
   - Test AI levels: verify search depth and evaluation differentiation across Easy, Medium, Hard, and Expert.
   - Test draw rules: verify Threefold Repetition and 50-move halfmove clock counter.
   - Test autosave state: verify restored game on computer turn schedules the AI move.
   - Run `npm test` and ensure all test suites pass.
2. **Mobile Viewport Verification**:
   - Verify camera framing at $390 \times 844$: all 8 files ($a$ through $h$) and 8 ranks ($1$ through $8$) fully visible.
3. **Compilation & Linting**:
   - Run `lint_applet` and `compile_applet` to ensure zero errors.
