export type EscapeStatus = 'LOBBY' | 'PLAYING' | 'ROOM_COMPLETED' | 'GAME_WON' | 'GAME_OVER';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isBot: boolean;
  isHost: boolean;
  isConnected?: boolean;
  score?: number;
  rank?: number;
}

export interface ScenarioInfo {
  id: string;
  name: string;
  category: string;
  themeColor: string;
  icon: string;
  envImage?: string;
  puzzleImage?: string;
  youtubeVideoId?: string;
  trackTitle?: string;
}

export interface RejoinRequest {
  targetSocketId: string;
  playerName: string;
  avatar: string;
  roomCode: string;
  isExistingPlayer?: boolean;
}

export interface Puzzle {
  id: string;
  type: 'RIDDLE' | 'ASYNC_KEYPAD' | 'CABLE_SEQUENCE' | 'DECODER' | 'PRESSURE_VALVES' | 'SIMON_MEMORY' | 'MASTER_PHRASE' | 'TILE_PUZZLE' | 'JIGSAW_PLACEMENT' | 'TICTACTOE_VS' | 'RPS_DUEL';
  title: string;
  instruction: string;
  thematicImage?: string;
  envImage?: string;
  puzzleImage?: string;
  thematicTheme?: string;
  riddleText?: string;
  options?: string[];
  rewardClue?: string;
  targetSolution?: string;
  targetSequence?: string[];
  guideText?: string;
  binaryClue?: string;
  guideTable?: string;
  targetTotal?: number;
  targetSteps?: number[];
  playerFragments?: any;
  playerWords?: any;
}

export interface Level {
  id: number;
  roomNumber: number;
  title: string;
  subtitle: string;
  description: string;
  themeColor: string;
  icon: string;
  puzzles: Puzzle[];
}

export interface AsymmetricData {
  roleText?: string;
  fragmentText?: string;
  hintText?: string;
  hasManual?: boolean;
  manualText?: string;
  availableButtons?: string[];
  viewType?: string;
  signal?: string;
  table?: string;
  instruction?: string;
  word?: string;
  hint?: string;
}

export interface ValveStatus {
  playerId: string;
  playerName: string;
  pressure: number;
}

export interface TilePuzzleState {
  puzzleId: string;
  board: number[]; // Array de 9 elementos con dígitos 1..8 y 0 (vacío)
  emptyIndex: number;
  turnIndex: number;
  turnPlayerId: string;
  turnPlayerName: string;
  turnPlayerAvatar: string;
  movesCount: number;
  thematicImage: string;
  isSolved: boolean;
}

export interface JigsawPuzzleState {
  puzzleId: string;
  puzzleImage: string;
  envImage: string;
  thematicTheme: string;
  boardSlots: (number | null)[];
  availablePieces: number[];
  correctCount?: number;
  isSolved: boolean;
  winnerPlayerId?: string | null;
  rivalsProgress?: Array<{
    id: string;
    name: string;
    avatar: string;
    correctCount: number;
    placedCount: number;
    isSolved: boolean;
  }>;
}

export interface TicTacToeState {
  puzzleId: string;
  playerX: { id: string; name: string; avatar: string; isBot?: boolean };
  playerO: { id: string; name: string; avatar: string; isBot?: boolean };
  currentTurn: 'X' | 'O';
  board: ('X' | 'O' | null)[];
  winner: 'X' | 'O' | 'DRAW' | null;
  winningLine: number[] | null;
  movesCount: number;
  isCompleted: boolean;
}

export interface RpsDuelState {
  puzzleId: string;
  player1: { id: string; name: string; avatar: string; isBot?: boolean };
  player2: { id: string; name: string; avatar: string; isBot?: boolean };
  currentRound: number;
  targetWins: number;
  player1Score: number;
  player2Score: number;
  player1Choice: 'ROCK' | 'PAPER' | 'SCISSORS' | null;
  player2Choice: 'ROCK' | 'PAPER' | 'SCISSORS' | null;
  player1Locked: boolean;
  player2Locked: boolean;
  roundResult: 'PLAYER1_WIN' | 'PLAYER2_WIN' | 'DRAW' | null;
  roundMessage: string | null;
  isRoundRevealed: boolean;
  winner: string | null;
  isCompleted: boolean;
}

export interface EscapeRoomState {
  code: string;
  status: EscapeStatus;
  hostId: string;
  scenario?: ScenarioInfo;
  players: Player[];
  currentLevelIndex: number;
  currentLevel: Level | null;
  currentPuzzleIndex: number;
  currentPuzzle: Puzzle | null;
  myAsymmetricData: AsymmetricData | null;
  timeRemaining: number;
  hintsRemaining: number;
  teamScore: number;
  valves: ValveStatus[];
  totalPressure: number;
  chatMessages: ChatMessage[];
  completedPuzzles: string[];
  completedLevels: number[];
  unlockedClues: string[];
  sharedCableSequence: string[];
  tilePuzzleState?: TilePuzzleState | null;
  jigsawPuzzleState?: JigsawPuzzleState | null;
  rivalsCableProgress?: Array<{
    id: string;
    name: string;
    avatar: string;
    cablesConnected: number;
  }>;
  ticTacToeState?: TicTacToeState | null;
  rpsState?: RpsDuelState | null;
  leaderboard?: Player[];
  mvpPlayer?: Player | null;
  missionStartedAt?: number | null;
  musicElapsedSeconds?: number;
}

export interface ActiveLobby {
  code: string;
  hostName: string;
  hostAvatar: string;
  scenarioId: string;
  scenarioName: string;
  scenarioIcon: string;
  currentPlayers: number;
  maxPlayers: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  avatar: string;
  text: string;
  time: string;
  isSystem?: boolean;
}

export interface AgentProfile {
  email?: string;
  isVerified?: boolean;
  codename: string;
  avatar: string;
  rank: 'Recluta' | 'Especialista' | 'Táctico' | 'Comandante' | 'Leyenda';
  pin: string;
  missionsPlayed: number;
  missionsWon: number;
  xpPoints: number;
  badges: string[];
  lastLogin: string;
}

export interface SavedSession {
  roomCode: string;
  playerId?: string;
  playerName: string;
  avatar: string;
  scenarioId?: string;
  isHost?: boolean;
}
