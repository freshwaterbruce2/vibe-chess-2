export interface ChessBoardPiece {
  type: 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
  color: 'w' | 'b';
  r: number;
  c: number;
  hasMoved?: boolean;
}

export interface Lesson {
  id: string;
  category: 'basics' | 'rules' | 'tactics';
  title: string;
  subtitle: string;
  explanation: string;
  objective: string;
  playerColor: 'w' | 'b';
  turn: 'w' | 'b';
  pieces: ChessBoardPiece[];
  validSolutions: { fromR: number; fromC: number; toR: number; toC: number }[];
  hint: string;
}

export interface Puzzle {
  id: string;
  title: string;
  type: 'mate-1' | 'mate-2';
  description: string;
  playerColor: 'w' | 'b';
  turn: 'w' | 'b';
  pieces: ChessBoardPiece[];
  solution: { fromR: number; fromC: number; toR: number; toC: number; promotion?: string }[];
  opponentResponses?: { fromR: number; fromC: number; toR: number; toC: number }[];
  hint: string;
  explanation: string;
}

export const LESSONS: Lesson[] = [
  {
    id: 'pawn-movement',
    category: 'basics',
    title: 'The Pawn & Promotion',
    subtitle: 'Marching forward to royal majesty',
    explanation: 'Pawns move straight forward 1 square at a time (or 2 squares from their starting square). They capture 1 square diagonally. Reaching the far 8th rank promotes the pawn into a Queen, Rook, Bishop, or Knight!',
    objective: 'Advance your pawn to the final rank to achieve Queen promotion.',
    playerColor: 'w',
    turn: 'w',
    pieces: [
      { type: 'king', color: 'w', r: 7, c: 4 },
      { type: 'pawn', color: 'w', r: 1, c: 3 }, // d7 pawn
      { type: 'king', color: 'b', r: 0, c: 7 }
    ],
    validSolutions: [{ fromR: 1, fromC: 3, toR: 0, toC: 3 }],
    hint: 'Push the pawn from d7 straight to d8!'
  },
  {
    id: 'knight-jump',
    category: 'basics',
    title: "The Knight's Leap",
    subtitle: 'The only piece that leaps over other statues',
    explanation: "Knights move in an 'L' shape: 2 squares in one cardinal direction and then 1 square perpendicular. It is the only stone piece capable of leaping cleanly over other pieces.",
    objective: 'Leap your Knight over the pawn wall to capture the enemy Black Bishop.',
    playerColor: 'w',
    turn: 'w',
    pieces: [
      { type: 'king', color: 'w', r: 7, c: 4 },
      { type: 'knight', color: 'w', r: 5, c: 2 }, // c3
      { type: 'pawn', color: 'w', r: 4, c: 2 },   // c4 blocker
      { type: 'pawn', color: 'w', r: 4, c: 3 },   // d4 blocker
      { type: 'bishop', color: 'b', r: 3, c: 3 }, // d5 target
      { type: 'king', color: 'b', r: 0, c: 4 }
    ],
    validSolutions: [{ fromR: 5, fromC: 2, toR: 3, toC: 3 }],
    hint: 'Select the Knight on c3 and strike the Bishop on d5 directly.'
  },
  {
    id: 'bishop-diagonals',
    category: 'basics',
    title: 'The Bishop',
    subtitle: 'Masters of the sacred diagonal lanes',
    explanation: 'Bishops move any number of open squares along diagonals. A light-squared bishop remains on light squares for the entire game, and dark-squared bishops rule dark diagonals.',
    objective: 'Slice across the long diagonal with your Bishop to capture the undefended Black Rook.',
    playerColor: 'w',
    turn: 'w',
    pieces: [
      { type: 'king', color: 'w', r: 7, c: 4 },
      { type: 'bishop', color: 'w', r: 6, c: 1 }, // b2
      { type: 'rook', color: 'b', r: 1, c: 6 },   // g7
      { type: 'king', color: 'b', r: 0, c: 4 }
    ],
    validSolutions: [{ fromR: 6, fromC: 1, toR: 1, toC: 6 }],
    hint: 'Aim diagonally upward and rightward along the great b2-g7 diagonal.'
  },
  {
    id: 'castling-shield',
    category: 'rules',
    title: 'Castling: King Safety & Rook Activation',
    subtitle: 'The special dual-piece sanctuary maneuver',
    explanation: 'Castling allows your King to move 2 squares toward your Rook, while the Rook hops directly over the King. Neither piece may have moved previously, and no square the King crosses may be under attack.',
    objective: 'Castle Kingside (O-O) to tuck your King into safety and bring your Rook into play.',
    playerColor: 'w',
    turn: 'w',
    pieces: [
      { type: 'king', color: 'w', r: 7, c: 4, hasMoved: false },
      { type: 'rook', color: 'w', r: 7, c: 7, hasMoved: false },
      { type: 'pawn', color: 'w', r: 6, c: 5 },
      { type: 'pawn', color: 'w', r: 6, c: 6 },
      { type: 'pawn', color: 'w', r: 6, c: 7 },
      { type: 'king', color: 'b', r: 0, c: 4 }
    ],
    validSolutions: [{ fromR: 7, fromC: 4, toR: 7, toC: 6 }],
    hint: 'Tap your White King on e1, then tap g1 (two squares right) to castle!'
  },
  {
    id: 'check-vs-checkmate',
    category: 'tactics',
    title: 'Check vs. Checkmate',
    subtitle: 'When the King has no sanctuary left',
    explanation: 'Check means the King is under direct attack, but can escape by moving, blocking, or capturing the attacker. Checkmate means the King is in check and has ZERO legal escapes — the game ends immediately in victory!',
    objective: 'Deliver the decisive checkmate blow with your Queen backed by your Bishop.',
    playerColor: 'w',
    turn: 'w',
    pieces: [
      { type: 'king', color: 'w', r: 6, c: 4 },
      { type: 'bishop', color: 'w', r: 4, c: 2 }, // c4 bishop
      { type: 'queen', color: 'w', r: 3, c: 7 },  // h5 queen
      { type: 'king', color: 'b', r: 0, c: 4 },   // e8 king
      { type: 'pawn', color: 'b', r: 1, c: 5 },   // f7 pawn
      { type: 'pawn', color: 'b', r: 1, c: 4 }    // e7 pawn
    ],
    validSolutions: [{ fromR: 3, fromC: 7, toR: 1, toC: 5 }],
    hint: 'Capture the f7 pawn with your Queen. The Bishop defends her, sealing checkmate!'
  }
];

export const PUZZLES: Puzzle[] = [
  {
    id: 'puzzle-scholars-mate',
    title: "Scholar's Judgment",
    type: 'mate-1',
    description: 'White to move. Strike the weak f7 square where the Black King is unprotected.',
    playerColor: 'w',
    turn: 'w',
    pieces: [
      { type: 'king', color: 'w', r: 7, c: 4 },
      { type: 'queen', color: 'w', r: 3, c: 7 }, // h5
      { type: 'bishop', color: 'w', r: 4, c: 2 }, // c4
      { type: 'pawn', color: 'w', r: 4, c: 4 }, // e4
      { type: 'king', color: 'b', r: 0, c: 4 }, // e8
      { type: 'pawn', color: 'b', r: 1, c: 4 }, // e5
      { type: 'pawn', color: 'b', r: 1, c: 5 }, // f7
      { type: 'knight', color: 'b', r: 2, c: 2 } // c6
    ],
    solution: [{ fromR: 3, fromC: 7, toR: 1, toC: 5 }], // Qxf7#
    hint: 'Take on f7 with your Queen! The Bishop on c4 covers her.',
    explanation: 'Qxf7# attacks the King directly. The King cannot take the Queen because she is protected by the Bishop on c4, and has no open escape squares.'
  },
  {
    id: 'puzzle-back-rank',
    title: 'The Cathedral Back Rank',
    type: 'mate-1',
    description: 'White to move. The Black King is trapped behind his own stone pawns on the back rank.',
    playerColor: 'w',
    turn: 'w',
    pieces: [
      { type: 'king', color: 'w', r: 6, c: 6 },
      { type: 'pawn', color: 'w', r: 5, c: 6 },
      { type: 'pawn', color: 'w', r: 5, c: 7 },
      { type: 'rook', color: 'w', r: 6, c: 3 }, // d2
      { type: 'king', color: 'b', r: 0, c: 6 }, // g8
      { type: 'pawn', color: 'b', r: 1, c: 5 }, // f7
      { type: 'pawn', color: 'b', r: 1, c: 6 }, // g7
      { type: 'pawn', color: 'b', r: 1, c: 7 }  // h7
    ],
    solution: [{ fromR: 6, fromC: 3, toR: 0, toC: 3 }], // Rd8#
    hint: 'Drive your Rook all the way to d8 onto the 8th rank.',
    explanation: 'Rd8# delivers back-rank checkmate because Black has made no pawn luft (breathing room) on f7, g7, or h7.'
  },
  {
    id: 'puzzle-smothered',
    title: 'Sanctum Smothered Mate',
    type: 'mate-1',
    description: 'White to move. Deliver checkmate with the Knight against a completely suffocated King.',
    playerColor: 'w',
    turn: 'w',
    pieces: [
      { type: 'king', color: 'w', r: 7, c: 1 },
      { type: 'knight', color: 'w', r: 2, c: 4 }, // e6
      { type: 'king', color: 'b', r: 0, c: 7 },   // h8
      { type: 'rook', color: 'b', r: 0, c: 6 },   // g8
      { type: 'pawn', color: 'b', r: 1, c: 6 },   // g7
      { type: 'pawn', color: 'b', r: 1, c: 7 }    // h7
    ],
    solution: [{ fromR: 2, fromC: 4, toR: 1, toC: 5 }], // Nf7#
    hint: 'Hop the Knight into f7 to corner the trapped King.',
    explanation: 'Nf7# attacks the King on h8. Because all adjacent squares (g8, g7, h7) are blocked by friendly Black pieces, it is a textbook smothered checkmate.'
  },
  {
    id: 'puzzle-anastasia-2',
    title: "Anastasia's Cross (Mate in 2)",
    type: 'mate-2',
    description: 'White to move. Sacrificing the Queen opens the h-file for the executioner Rook.',
    playerColor: 'w',
    turn: 'w',
    pieces: [
      { type: 'king', color: 'w', r: 6, c: 6 },
      { type: 'knight', color: 'w', r: 3, c: 4 }, // e5
      { type: 'queen', color: 'w', r: 3, c: 3 },  // d5
      { type: 'rook', color: 'w', r: 7, c: 0 },   // a1 (can slide to h1)
      { type: 'king', color: 'b', r: 0, c: 6 },   // g8
      { type: 'pawn', color: 'b', r: 1, c: 6 },   // g7
      { type: 'pawn', color: 'b', r: 1, c: 7 }    // h7
    ],
    solution: [
      { fromR: 3, fromC: 4, toR: 1, toC: 6 }, // 1. Ne7+
      { fromR: 7, fromC: 0, toR: 7, toC: 7 }  // 2. Rh1#
    ],
    opponentResponses: [
      { fromR: 0, fromC: 6, toR: 0, toC: 7 } // Kh8
    ],
    hint: 'Step 1: Knight to e7 with check to pin the King to h8.',
    explanation: 'Ne7+ forces the King into the corner at h8. Then the Rook swings to the open h-file, delivering decisive Anastasia mate.'
  },
  {
    id: 'puzzle-corner-trap-2',
    title: 'Bishop & Rook Net (Mate in 2)',
    type: 'mate-2',
    description: 'White to move. Coordinate Bishop diagonal cutoff and Rook linear invasion.',
    playerColor: 'w',
    turn: 'w',
    pieces: [
      { type: 'king', color: 'w', r: 6, c: 2 },
      { type: 'bishop', color: 'w', r: 4, c: 5 }, // f4
      { type: 'rook', color: 'w', r: 6, c: 0 },   // a2
      { type: 'king', color: 'b', r: 0, c: 7 },   // h8
      { type: 'pawn', color: 'b', r: 1, c: 7 }    // h7
    ],
    solution: [
      { fromR: 4, fromC: 5, toR: 3, toC: 4 }, // 1. Be5+
      { fromR: 6, fromC: 0, toR: 0, toC: 0 }  // 2. Ra8#
    ],
    opponentResponses: [
      { fromR: 0, fromC: 7, toR: 0, toC: 6 } // Kg8
    ],
    hint: 'Step 1: Check with your Bishop from e5!',
    explanation: 'Be5+ drives the Black King into the corner or file where Ra8# finishes the game cleanly.'
  }
];
