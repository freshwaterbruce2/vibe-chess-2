import { useEffect, useRef, useState, useTransition } from 'react';
import { initWizardChess } from './wizardChessEngine.js';
import { sound } from './soundEffects.ts';
import { LESSONS, PUZZLES, Lesson, Puzzle } from './lessonsAndPuzzles.ts';

interface WizardChessAPI {
  executeChessMove: (fromR: number, fromC: number, toR: number, toC: number, options?: Record<string, unknown>) => boolean;
  triggerAIMoveNow: () => boolean;
  resetChessBoard: (orientCamera?: boolean, preserveScript?: boolean) => void;
  undoMove: () => boolean;
  getHint: () => { fromR: number; fromC: number; toR: number; toC: number; fromSq: string; toSq: string; advice: string } | null;
  resetCamera: () => void;
  toggleTopDown2D: (enable?: boolean) => boolean;
  skipCurrentCaptureAnimation: () => boolean;
  setAIDifficulty: (level: 'easy' | 'medium' | 'hard' | 'expert') => string;
  getAIDifficulty: () => string;
  setCaptureAnimationSpeed: (spd: 'full' | 'quick' | 'off') => string;
  getCaptureAnimationSpeed: () => string;
  setGraphicsQuality: (qual: 'high' | 'low') => string;
  getGraphicsQuality: () => string;
  setLearningHelpers: (opts: { highlightLegalMoves?: boolean; showLastMove?: boolean; showCheckIndicator?: boolean }) => void;
  getLearningHelpers: () => { highlightLegalMoves: boolean; showLastMove: boolean; showCheckIndicator: boolean };
  setSinglePlayerSide: (color: 'w' | 'b') => void;
  setupCustomScenario: (pieces: unknown[], turn?: string) => void;
  setPromotionPendingCallback: (cb: (color: string, callback: (chosenPiece: string) => void) => void) => void;
  addGameStateListener: (cb: (state: unknown) => void) => void;
  removeGameStateListener: (cb: (state: unknown) => void) => void;
  getState: () => {
    currentTurn: string;
    playerColor: string;
    gameOver: boolean;
    capturedByWhite: number;
    capturedByBlack: number;
    moveHistoryCount: number;
    isAnimatingMove: boolean;
  };
  toggleUI: (force?: boolean) => boolean;
}

export default function App() {
  const initializedRef = useRef(false);
  const [, startTransition] = useTransition();

  // Navigation & Modal States
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [mainMenuOpen, setMainMenuOpen] = useState(false);
  const [menuTab, setMenuTab] = useState<'play' | 'lessons' | 'puzzles' | 'settings'>('play');
  const [moveListOpen, setMoveListOpen] = useState(false);

  // Settings States
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard' | 'expert'>('medium');
  const [captureAnimSpeed, setCaptureAnimSpeed] = useState<'full' | 'quick' | 'off'>('full');
  const [graphicsQuality, setGraphicsQuality] = useState<'high' | 'low'>('high');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [highlightLegalMoves, setHighlightLegalMoves] = useState(true);
  const [showLastMove, setShowLastMove] = useState(true);
  const [showCheckIndicator, setShowCheckIndicator] = useState(true);
  const [isTopDown2D, setIsTopDown2D] = useState(false);

  // Active Modes
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [lessonFeedback, setLessonFeedback] = useState<string | null>(null);
  const [activePuzzle, setActivePuzzle] = useState<Puzzle | null>(null);
  const [puzzleFeedback, setPuzzleFeedback] = useState<{ text: string; success?: boolean } | null>(null);
  const [hintMessage, setHintMessage] = useState<string | null>(null);

  // Promotion Dialog State
  const [promotionPending, setPromotionPending] = useState<{
    color: string;
    callback: (piece: string) => void;
  } | null>(null);

  // Game UI State
  const [capturedWhite, setCapturedWhite] = useState(0);
  const [capturedBlack, setCapturedBlack] = useState(0);
  const [moveHistoryList, setMoveHistoryList] = useState<string[]>([]);
  const [playerSide, setPlayerSide] = useState<'w' | 'b'>('w');

  const getEngine = (): WizardChessAPI | null => {
    const win = window as unknown as { wizardChess?: WizardChessAPI };
    return win.wizardChess || null;
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    initWizardChess();

    // Hook game engine listener and settings
    const timer = setTimeout(() => {
      const engine = getEngine();
      if (engine) {
        setAiDifficulty((engine.getAIDifficulty() as 'easy' | 'medium' | 'hard' | 'expert') || 'medium');
        setCaptureAnimSpeed((engine.getCaptureAnimationSpeed() as 'full' | 'quick' | 'off') || 'full');
        setGraphicsQuality((engine.getGraphicsQuality() as 'high' | 'low') || 'high');
        setSoundEnabled(sound.isEnabled());

        const helpers = engine.getLearningHelpers();
        setHighlightLegalMoves(helpers.highlightLegalMoves);
        setShowLastMove(helpers.showLastMove);
        setShowCheckIndicator(helpers.showCheckIndicator);

        engine.setPromotionPendingCallback((color, callback) => {
          setPromotionPending({ color, callback });
        });

        engine.addGameStateListener((state) => {
          startTransition(() => {
            const s = state as {
              capturedByWhite?: number;
              capturedByBlack?: number;
              playerColor?: string;
              soundEnabled?: boolean;
            };
            if (typeof s.capturedByWhite === 'number') setCapturedWhite(s.capturedByWhite);
            if (typeof s.capturedByBlack === 'number') setCapturedBlack(s.capturedByBlack);
            if (s.playerColor) setPlayerSide(s.playerColor === 'b' ? 'b' : 'w');
            if (typeof s.soundEnabled === 'boolean') setSoundEnabled(s.soundEnabled);
          });
        });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileSheetOpen(false);
        setMainMenuOpen(false);
        setMoveListOpen(false);
        setHintMessage(null);
      }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      }
    };
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileSheetOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleRestoreUI = () => {
    const engine = getEngine();
    if (engine) {
      engine.toggleUI(false);
    } else {
      document.body.classList.remove('cinematic-ui-hidden');
      const btnHide = document.getElementById('btn-hide-ui');
      if (btnHide) btnHide.textContent = 'Hide UI [H]';
    }
  };

  const handleUndo = () => {
    const engine = getEngine();
    if (engine) {
      sound.playClick();
      engine.undoMove();
      setHintMessage(null);
    }
  };

  const handleHint = () => {
    const engine = getEngine();
    if (engine) {
      sound.playClick();
      const hint = engine.getHint();
      if (hint) {
        setHintMessage(hint.advice);
        setTimeout(() => setHintMessage(null), 6000);
      }
    }
  };

  const handleToggleSound = () => {
    const newSound = sound.toggle();
    setSoundEnabled(newSound);
    if (newSound) sound.playMove();
  };

  const handleToggle2D = () => {
    const engine = getEngine();
    if (engine) {
      sound.playClick();
      const next = engine.toggleTopDown2D();
      setIsTopDown2D(next);
    }
  };

  const handleResetCamera = () => {
    const engine = getEngine();
    if (engine) {
      sound.playClick();
      engine.resetCamera();
      setIsTopDown2D(false);
    }
  };

  const handleAIDifficultyChange = (diff: 'easy' | 'medium' | 'hard' | 'expert') => {
    const engine = getEngine();
    setAiDifficulty(diff);
    sound.playClick();
    if (engine) {
      engine.setAIDifficulty(diff);
    }
  };

  const handleCaptureSpeedChange = (spd: 'full' | 'quick' | 'off') => {
    const engine = getEngine();
    setCaptureAnimSpeed(spd);
    sound.playClick();
    if (engine) {
      engine.setCaptureAnimationSpeed(spd);
    }
  };

  const handleGraphicsQualityChange = (qual: 'high' | 'low') => {
    const engine = getEngine();
    setGraphicsQuality(qual);
    sound.playClick();
    if (engine) {
      engine.setGraphicsQuality(qual);
    }
  };

  const handleHelperToggle = (key: 'highlightLegalMoves' | 'showLastMove' | 'showCheckIndicator') => {
    const engine = getEngine();
    sound.playClick();
    if (key === 'highlightLegalMoves') {
      const next = !highlightLegalMoves;
      setHighlightLegalMoves(next);
      engine?.setLearningHelpers({ highlightLegalMoves: next });
    } else if (key === 'showLastMove') {
      const next = !showLastMove;
      setShowLastMove(next);
      engine?.setLearningHelpers({ showLastMove: next });
    } else if (key === 'showCheckIndicator') {
      const next = !showCheckIndicator;
      setShowCheckIndicator(next);
      engine?.setLearningHelpers({ showCheckIndicator: next });
    }
  };

  const handleStartLesson = (lesson: Lesson) => {
    const engine = getEngine();
    sound.playClick();
    setActiveLesson(lesson);
    setActivePuzzle(null);
    setLessonFeedback(null);
    setMainMenuOpen(false);
    if (engine) {
      engine.setupCustomScenario(lesson.pieces, lesson.turn);
    }
  };

  const handleStartPuzzle = (puzzle: Puzzle) => {
    const engine = getEngine();
    sound.playClick();
    setActivePuzzle(puzzle);
    setActiveLesson(null);
    setPuzzleFeedback(null);
    setMainMenuOpen(false);
    if (engine) {
      engine.setupCustomScenario(puzzle.pieces, puzzle.turn);
    }
  };

  const handleExitPracticeMode = () => {
    const engine = getEngine();
    sound.playClick();
    setActiveLesson(null);
    setActivePuzzle(null);
    setLessonFeedback(null);
    setPuzzleFeedback(null);
    if (engine) {
      engine.resetChessBoard(true, false);
    }
  };

  const handlePromotionSelect = (piece: string) => {
    sound.playPlacement();
    if (promotionPending) {
      promotionPending.callback(piece);
      setPromotionPending(null);
    }
  };

  return (
    <>
      <div id="loading-overlay">
        <div className="loader-title">Wizard Chess</div>
        <div className="loader-bar-wrap">
          <div className="loader-bar" id="loader-bar"></div>
        </div>
        <div id="loader-text">Summoning Sanctum Architecture &amp; Sculpted Pieces...</div>
      </div>

      <div id="canvas-container"></div>

      <button
        type="button"
        className="hud-btn mobile-only-restore-ui"
        id="btn-mobile-show-ui"
        onClick={handleRestoreUI}
        title="Show HUD Controls"
      >
        Show UI
      </button>

      {/* Top Main Navigation Bar */}
      <div id="hud-top">
        <div className="hud-group" id="hud-left">
          <button
            type="button"
            className="brand-pill clickable-pill"
            id="btn-main-menu-trigger"
            onClick={() => {
              sound.playClick();
              setMainMenuOpen(true);
            }}
            title="Open Main Menu (Play, Lessons, Puzzles, Settings)"
          >
            <span className="menu-icon">☰</span>
            <span className="brand-title">Wizard Chess</span>
          </button>

          <div className="status-pill" id="status-pill">
            <span className="turn-dot" id="turn-dot"></span>
            <span id="turn-text">White to Move</span>
            <span className="mode-badge" id="mode-badge">
              Playing as White
            </span>
            <span
              className="difficulty-badge"
              title="Current AI Difficulty Level"
              onClick={() => {
                sound.playClick();
                setMenuTab('settings');
                setMainMenuOpen(true);
              }}
            >
              AI: {aiDifficulty.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Action Pills & Mobile Controls Trigger */}
        <div className="hud-group quick-helpers-group">
          <button
            type="button"
            className="quick-action-pill"
            id="btn-action-undo"
            onClick={handleUndo}
            title="Undo Last Move (Ctrl+Z)"
          >
            ↩ Undo
          </button>
          <button
            type="button"
            className="quick-action-pill"
            id="btn-action-hint"
            onClick={handleHint}
            title="Suggest a Good Move"
          >
            💡 Hint
          </button>
          <button
            type="button"
            className={`quick-action-pill ${isTopDown2D ? 'active' : ''}`}
            id="btn-action-2d"
            onClick={handleToggle2D}
            title="Toggle Overhead 2D / 3D Board View"
          >
            {isTopDown2D ? '📐 3D View' : '♟ 2D View'}
          </button>
          <button
            type="button"
            className="quick-action-pill"
            id="btn-action-sound"
            onClick={handleToggleSound}
            title="Toggle Sound Effects"
          >
            {soundEnabled ? '🔊 Sound' : '🔇 Muted'}
          </button>

          <button
            type="button"
            className={`hud-btn mobile-controls-trigger ${mobileSheetOpen ? 'active' : ''}`}
            id="btn-mobile-controls"
            aria-expanded={mobileSheetOpen}
            aria-controls="hud-right"
            onClick={() => setMobileSheetOpen((prev) => !prev)}
          >
            {mobileSheetOpen ? 'Close' : 'Controls'}
          </button>
        </div>

        <div
          className={`mobile-sheet-backdrop ${mobileSheetOpen ? 'open' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setMobileSheetOpen(false);
          }}
          aria-hidden="true"
        ></div>

        {/* Existing required controls sheet container */}
        <div
          className={`hud-group ${mobileSheetOpen ? 'mobile-sheet-open' : ''}`}
          id="hud-right"
        >
          <div
            className="mobile-sheet-handle-wrap"
            onClick={(e) => {
              e.stopPropagation();
              setMobileSheetOpen(false);
            }}
            aria-hidden="true"
          >
            <div className="mobile-sheet-handle"></div>
          </div>

          <div className="mobile-sheet-header">
            <span className="mobile-sheet-title">Sanctum Controls</span>
            <button
              type="button"
              className="mobile-sheet-close"
              id="btn-mobile-sheet-close"
              onClick={(e) => {
                e.stopPropagation();
                setMobileSheetOpen(false);
              }}
              aria-label="Close Controls"
            >
              Close ✕
            </button>
          </div>

          <div className="mobile-sheet-section-label">Game Actions</div>

          <button
            className="hud-btn"
            id="btn-side-toggle"
            title="Switch between Playing as White and Playing as Black"
            onClick={() => setMobileSheetOpen(false)}
          >
            Play as Black
          </button>
          <button
            className="hud-btn"
            id="btn-ai-move"
            title="Let the AI make the next move immediately"
            onClick={() => setMobileSheetOpen(false)}
          >
            AI Move
          </button>
          <button
            className="hud-btn"
            id="btn-reset"
            title="Start a fresh game on the altar"
            onClick={() => {
              sound.playClick();
              setActiveLesson(null);
              setActivePuzzle(null);
              setMobileSheetOpen(false);
            }}
          >
            New Game
          </button>

          <div className="hud-divider" aria-hidden="true"></div>
          <div className="mobile-sheet-section-label">
            <span>Camera Views</span>
            <span className="mobile-sheet-section-sub">Tap active view to flip</span>
          </div>

          <button
            className="hud-btn active"
            id="btn-cam-player"
            title="Player Camera (Click again to flip White / Black view)"
          >
            Player Cam
          </button>
          <button
            className="hud-btn"
            id="btn-cam-top"
            title="Overhead Board View (Click again to flip White / Black orientation)"
          >
            Overhead
          </button>
          <button
            className="hud-btn"
            id="btn-cam-side"
            title="Side Profile View (Click again to switch East / West side)"
          >
            Side
          </button>
          <button
            className="hud-btn"
            id="btn-cam-wide"
            title="Wide Cathedral View (Click again to switch North Rose / South Narthex)"
          >
            Cathedral
          </button>

          <button
            className="hud-btn secondary-cam-btn"
            id="btn-cam-reset"
            onClick={handleResetCamera}
            title="Reset Camera to Standard View"
          >
            Reset Camera
          </button>

          <div className="hud-divider" aria-hidden="true"></div>
          <div className="mobile-sheet-section-label">Display &amp; Gestures</div>

          <button
            className="hud-btn"
            id="btn-hide-ui"
            title="Toggle HUD visibility (Shortcut: H)"
            onClick={() => setMobileSheetOpen(false)}
          >
            Hide UI [H]
          </button>

          <div className="mobile-sheet-hint">
            <strong>Touch:</strong> Tap Piece to Move &nbsp;•&nbsp; Tap during capture to Skip &nbsp;•&nbsp; 1-Finger Drag: Orbit &nbsp;•&nbsp; 2-Finger Drag: Pan &nbsp;•&nbsp; Pinch: Zoom
          </div>
        </div>
      </div>

      {/* Lesson / Practice Active Banner */}
      {activeLesson && (
        <div className="practice-coach-banner">
          <div className="coach-header">
            <span className="coach-badge">LESSON</span>
            <h3 className="coach-title">{activeLesson.title}</h3>
            <button className="coach-exit-btn" onClick={handleExitPracticeMode} title="Return to Match">
              ✕ Exit Lesson
            </button>
          </div>
          <p className="coach-desc">{activeLesson.explanation}</p>
          <div className="coach-objective">
            <strong>Objective:</strong> {activeLesson.objective}
          </div>
          <div className="coach-actions">
            <button
              className="coach-btn secondary"
              onClick={() => {
                sound.playClick();
                setHintMessage(activeLesson.hint);
              }}
            >
              💡 Hint
            </button>
            <button
              className="coach-btn secondary"
              onClick={() => {
                sound.playClick();
                handleStartLesson(activeLesson);
              }}
            >
              🔄 Reset Board
            </button>
          </div>
          {lessonFeedback && <div className="coach-feedback success">{lessonFeedback}</div>}
        </div>
      )}

      {/* Puzzle Coach Active Banner */}
      {activePuzzle && (
        <div className="practice-coach-banner">
          <div className="coach-header">
            <span className="coach-badge">PUZZLE COACH</span>
            <h3 className="coach-title">{activePuzzle.title}</h3>
            <button className="coach-exit-btn" onClick={handleExitPracticeMode} title="Return to Match">
              ✕ Exit Puzzle
            </button>
          </div>
          <p className="coach-desc">{activePuzzle.description}</p>
          <div className="coach-actions">
            <button
              className="coach-btn secondary"
              onClick={() => {
                sound.playClick();
                setHintMessage(activePuzzle.hint);
              }}
            >
              💡 Hint
            </button>
            <button
              className="coach-btn secondary"
              onClick={() => {
                sound.playClick();
                handleStartPuzzle(activePuzzle);
              }}
            >
              🔄 Try Again
            </button>
            <button
              className="coach-btn primary"
              onClick={() => {
                sound.playClick();
                setPuzzleFeedback({ text: activePuzzle.explanation, success: true });
              }}
            >
              👁 Show Solution
            </button>
          </div>
          {puzzleFeedback && (
            <div className={`coach-feedback ${puzzleFeedback.success ? 'success' : 'wrong'}`}>
              {puzzleFeedback.text}
            </div>
          )}
        </div>
      )}

      {/* Floating Hint Pill Notification */}
      {hintMessage && (
        <div className="hint-toast-banner" role="status" aria-live="polite">
          <span className="toast-icon">💡</span>
          <span className="toast-text">{hintMessage}</span>
          <button className="toast-close" onClick={() => setHintMessage(null)}>✕</button>
        </div>
      )}

      {/* Bottom HUD bar with required elements */}
      <div id="hud-bottom">
        <div className="hint-pill" id="controls-hint">
          <strong>Controls:</strong> Tap Piece then Square &nbsp;•&nbsp; Tap during attack to Skip &nbsp;•&nbsp; WASD: Fly Cam &nbsp;•&nbsp; H: Hide UI
        </div>
        <div className="captured-pill" id="captured-tray">
          {capturedWhite > 0 || capturedBlack > 0
            ? `Captured — White: ${capturedWhite} | Black: ${capturedBlack}`
            : ''}
        </div>
      </div>

      {/* Pawn Promotion Modal Dialog */}
      {promotionPending && (
        <div className="promotion-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="promotion-modal-title">
          <div className="promotion-dialog">
            <h3 className="promotion-title" id="promotion-modal-title">Ascension of the Pawn</h3>
            <p className="promotion-subtitle">Select the sculpted rank for your promoted statue:</p>
            <div className="promotion-options">
              <button
                className="promotion-btn"
                onClick={() => handlePromotionSelect('queen')}
                title="Promote to Queen (Most Powerful)"
              >
                <span className="promo-symbol">♛</span>
                <span className="promo-name">Queen</span>
              </button>
              <button
                className="promotion-btn"
                onClick={() => handlePromotionSelect('rook')}
                title="Promote to Rook"
              >
                <span className="promo-symbol">♜</span>
                <span className="promo-name">Rook</span>
              </button>
              <button
                className="promotion-btn"
                onClick={() => handlePromotionSelect('bishop')}
                title="Promote to Bishop"
              >
                <span className="promo-symbol">♝</span>
                <span className="promo-name">Bishop</span>
              </button>
              <button
                className="promotion-btn"
                onClick={() => handlePromotionSelect('knight')}
                title="Promote to Knight"
              >
                <span className="promo-symbol">♞</span>
                <span className="promo-name">Knight</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Menu Modal (Play vs AI, Lessons, Puzzle Coach, Settings) */}
      {mainMenuOpen && (
        <div
          className="sanctum-modal-backdrop open"
          onClick={() => setMainMenuOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="sanctum-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-brand">
                <span className="modal-gold-cross">✦</span>
                <span className="modal-title">Sanctum Menu</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setMainMenuOpen(false)}
                aria-label="Close Menu"
              >
                ✕
              </button>
            </div>

            <div className="modal-tabs">
              <button
                className={`modal-tab ${menuTab === 'play' ? 'active' : ''}`}
                onClick={() => {
                  sound.playClick();
                  setMenuTab('play');
                }}
              >
                Play vs AI
              </button>
              <button
                className={`modal-tab ${menuTab === 'lessons' ? 'active' : ''}`}
                onClick={() => {
                  sound.playClick();
                  setMenuTab('lessons');
                }}
              >
                Lessons
              </button>
              <button
                className={`modal-tab ${menuTab === 'puzzles' ? 'active' : ''}`}
                onClick={() => {
                  sound.playClick();
                  setMenuTab('puzzles');
                }}
              >
                Puzzle Coach
              </button>
              <button
                className={`modal-tab ${menuTab === 'settings' ? 'active' : ''}`}
                onClick={() => {
                  sound.playClick();
                  setMenuTab('settings');
                }}
              >
                Settings
              </button>
            </div>

            {/* TAB: PLAY VS AI */}
            {menuTab === 'play' && (
              <div className="tab-panel">
                <h4 className="panel-heading">Single-Player Altar Duel</h4>
                <p className="panel-sub">
                  Test your intellect against the Cathedral AI engine.
                </p>

                <div className="option-row">
                  <label className="option-label">AI Difficulty:</label>
                  <div className="segmented-control">
                    {(['easy', 'medium', 'hard', 'expert'] as const).map((diff) => (
                      <button
                        key={diff}
                        className={`seg-btn ${aiDifficulty === diff ? 'selected' : ''}`}
                        onClick={() => handleAIDifficultyChange(diff)}
                      >
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="difficulty-desc-card">
                  {aiDifficulty === 'easy' && (
                    <p>
                      <strong>Easy:</strong> Gentle play calibrated for beginners. Makes human-like mistakes, misses tactical traps, and offers a fun learning path.
                    </p>
                  )}
                  {aiDifficulty === 'medium' && (
                    <p>
                      <strong>Medium:</strong> Solid club-level play. Controls the center, evaluates material carefully, and defends against direct threats.
                    </p>
                  )}
                  {aiDifficulty === 'hard' && (
                    <p>
                      <strong>Hard:</strong> Tactical tournament strength. Deeper minimax calculation with piece-square placement and king safety.
                    </p>
                  )}
                  {aiDifficulty === 'expert' && (
                    <p>
                      <strong>Expert:</strong> Sharp, punishing play. Deep multi-ply lookahead with capture quiescence and positional dominance.
                    </p>
                  )}
                </div>

                <div className="option-row">
                  <label className="option-label">Play As:</label>
                  <div className="side-pick-row">
                    <button
                      className={`side-card ${playerSide === 'w' ? 'selected' : ''}`}
                      onClick={() => {
                        sound.playClick();
                        setPlayerSide('w');
                        getEngine()?.setSinglePlayerSide('w');
                      }}
                    >
                      <span className="side-icon">♔</span>
                      <span className="side-title">White (Moves First)</span>
                    </button>
                    <button
                      className={`side-card ${playerSide === 'b' ? 'selected' : ''}`}
                      onClick={() => {
                        sound.playClick();
                        setPlayerSide('b');
                        getEngine()?.setSinglePlayerSide('b');
                      }}
                    >
                      <span className="side-icon">♚</span>
                      <span className="side-title">Black</span>
                    </button>
                  </div>
                </div>

                <div className="modal-footer-actions">
                  <button
                    className="sanctum-btn primary"
                    onClick={() => {
                      sound.playClick();
                      setActiveLesson(null);
                      setActivePuzzle(null);
                      getEngine()?.resetChessBoard(true, false);
                      setMainMenuOpen(false);
                    }}
                  >
                    Start New Match
                  </button>
                  <button
                    className="sanctum-btn secondary"
                    onClick={() => {
                      sound.playClick();
                      setMainMenuOpen(false);
                    }}
                  >
                    Resume Match
                  </button>
                </div>
              </div>
            )}

            {/* TAB: LESSONS */}
            {menuTab === 'lessons' && (
              <div className="tab-panel">
                <h4 className="panel-heading">Starter Lessons &amp; Mechanics</h4>
                <p className="panel-sub">
                  Master the stone pieces, fundamental rules, and tactical concepts on interactive altar practice boards.
                </p>

                <div className="lesson-cards-list">
                  {LESSONS.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="lesson-card"
                      onClick={() => handleStartLesson(lesson)}
                    >
                      <div className="lesson-badge">{lesson.category.toUpperCase()}</div>
                      <div className="lesson-card-body">
                        <h5 className="lesson-card-title">{lesson.title}</h5>
                        <p className="lesson-card-sub">{lesson.subtitle}</p>
                      </div>
                      <button className="lesson-play-btn" title="Practice Lesson">
                        Start →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: PUZZLE COACH */}
            {menuTab === 'puzzles' && (
              <div className="tab-panel">
                <h4 className="panel-heading">Puzzle Coach: Mate in 1 &amp; 2</h4>
                <p className="panel-sub">
                  Sharpen tactical vision with curated cathedral puzzles. Deliver checkmate with precision.
                </p>

                <div className="lesson-cards-list">
                  {PUZZLES.map((puzzle) => (
                    <div
                      key={puzzle.id}
                      className="lesson-card"
                      onClick={() => handleStartPuzzle(puzzle)}
                    >
                      <div className="lesson-badge puzzle-badge">
                        {puzzle.type === 'mate-1' ? 'MATE IN 1' : 'MATE IN 2'}
                      </div>
                      <div className="lesson-card-body">
                        <h5 className="lesson-card-title">{puzzle.title}</h5>
                        <p className="lesson-card-sub">{puzzle.description}</p>
                      </div>
                      <button className="lesson-play-btn" title="Play Puzzle">
                        Solve →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: SETTINGS */}
            {menuTab === 'settings' && (
              <div className="tab-panel">
                <h4 className="panel-heading">Sanctum Preferences</h4>
                <p className="panel-sub">
                  Tune cinematics, graphics performance, audio, and visual learning helpers.
                </p>

                <div className="setting-block">
                  <div className="setting-header-line">
                    <span className="setting-title">Capture Animations</span>
                    <span className="setting-current-value">{captureAnimSpeed.toUpperCase()}</span>
                  </div>
                  <div className="segmented-control">
                    {(['full', 'quick', 'off'] as const).map((spd) => (
                      <button
                        key={spd}
                        className={`seg-btn ${captureAnimSpeed === spd ? 'selected' : ''}`}
                        onClick={() => handleCaptureSpeedChange(spd)}
                      >
                        {spd === 'full' ? 'Full Melee' : spd === 'quick' ? 'Quick Shatter' : 'Instant Off'}
                      </button>
                    ))}
                  </div>
                  <span className="setting-note">
                    {captureAnimSpeed === 'full' && 'Cinematic 3D camera zoom, stalk, melee impact, and stone shatter debris.'}
                    {captureAnimSpeed === 'quick' && 'Fast slide with instant shatter burst and no camera changes.'}
                    {captureAnimSpeed === 'off' && 'Zero animation delays for rapid tournament-style moves.'}
                  </span>
                </div>

                <div className="setting-block">
                  <div className="setting-header-line">
                    <span className="setting-title">Graphics Performance</span>
                    <span className="setting-current-value">{graphicsQuality.toUpperCase()}</span>
                  </div>
                  <div className="segmented-control">
                    {(['high', 'low'] as const).map((qual) => (
                      <button
                        key={qual}
                        className={`seg-btn ${graphicsQuality === qual ? 'selected' : ''}`}
                        onClick={() => handleGraphicsQualityChange(qual)}
                      >
                        {qual === 'high' ? 'High (Shadows & 32 Shards)' : 'Low (60 FPS Mobile)'}
                      </button>
                    ))}
                  </div>
                  <span className="setting-note">
                    {graphicsQuality === 'high'
                      ? 'Full PCF soft shadows, dynamic fire bounce, and 32 stone physics shards.'
                      : 'Cuts shadows and heavy debris to maintain a steady 60 FPS on mid-range phones.'}
                  </span>
                </div>

                <div className="setting-block">
                  <div className="setting-header-line">
                    <span className="setting-title">Sound Effects</span>
                    <button
                      className={`toggle-switch-btn ${soundEnabled ? 'active' : ''}`}
                      onClick={handleToggleSound}
                    >
                      {soundEnabled ? 'Enabled' : 'Muted'}
                    </button>
                  </div>
                  <span className="setting-note">
                    Calm procedural stone movement swoosh, placement thuds, and capture crunches.
                  </span>
                </div>

                <div className="setting-block">
                  <div className="setting-header-line">
                    <span className="setting-title">Learning Helpers</span>
                  </div>
                  <div className="checkbox-list">
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={highlightLegalMoves}
                        onChange={() => handleHelperToggle('highlightLegalMoves')}
                      />
                      <span>Highlight legal moves for selected piece</span>
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={showLastMove}
                        onChange={() => handleHelperToggle('showLastMove')}
                      />
                      <span>Highlight previous move squares</span>
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={showCheckIndicator}
                        onChange={() => handleHelperToggle('showCheckIndicator')}
                      />
                      <span>Highlight King clearly when in check</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkmate & Victory Overlay */}
      <div id="checkmate-overlay" role="status" aria-live="polite">
        <div className="checkmate-banner">
          <div className="checkmate-ornament">✦ &nbsp; Sanctum Judgment &nbsp; ✦</div>
          <div className="checkmate-crown" id="checkmate-crown">♔</div>
          <div className="checkmate-title" id="checkmate-title">Checkmate</div>
          <div className="checkmate-rule"></div>
          <div className="checkmate-subtitle" id="checkmate-subtitle">
            White Triumphs • The Black King Has Fallen
          </div>
          <div className="checkmate-actions">
            <button className="checkmate-btn" id="btn-checkmate-replay">
              Replay King Fall
            </button>
            <button
              className="checkmate-btn"
              id="btn-checkmate-newgame"
              onClick={() => {
                sound.playClick();
                getEngine()?.resetChessBoard(true, false);
                document.getElementById('checkmate-overlay')?.classList.remove('visible');
              }}
            >
              Play Again
            </button>
            <button className="checkmate-btn secondary" id="btn-checkmate-dismiss">
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
