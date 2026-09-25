export type EscapeStatus = 'LOBBY' | 'PLAYING' | 'ROOM_COMPLETED' | 'GAME_WON' | 'GAME_OVER';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isBot: boolean;
  isHost: boolean;
  isConnected?: boolean;
}

export interface ScenarioInfo {
  id: string;
  name: string;
  category: string;
  themeColor: string;
  icon: string;
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
  type: 'RIDDLE' | 'ASYNC_KEYPAD' | 'CABLE_SEQUENCE' | 'DECODER' | 'PRESSURE_VALVES' | 'SIMON_MEMORY' | 'MASTER_PHRASE';
  title: string;
  instruction: string;
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
