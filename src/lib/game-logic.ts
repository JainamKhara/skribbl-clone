import { GAME_CONFIG } from "./constants";

export type GamePhase =
  | "waiting"
  | "choosing-word"
  | "drawing"
  | "round-end"
  | "game-over";

export interface Player {
  id: string;
  name: string;
  score: number;
  hasGuessedCorrectly: boolean;
  isHost: boolean;
  avatar: number;
  roundScore: number;
  imageUrl?: string;
}

export interface ChatMessage {
  id: string;
  playerName: string;
  playerId: string;
  text: string;
  type: "guess" | "correct" | "close" | "system" | "chat";
  timestamp: number;
}

export interface GameState {
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  drawTime: number;
  currentDrawerIndex: number;
  currentWord: string;
  wordChoices: string[];
  timeRemaining: number;
  players: Player[];
  hintsRevealed: number;
  correctGuessers: number;
  turnCount: number;
}

export function createInitialGameState(
  players: Player[],
  rounds: number = GAME_CONFIG.DEFAULT_ROUNDS,
  drawTime: number = GAME_CONFIG.DEFAULT_DRAW_TIME
): GameState {
  return {
    phase: "waiting",
    currentRound: 1,
    totalRounds: rounds,
    drawTime,
    currentDrawerIndex: 0,
    currentWord: "",
    wordChoices: [],
    timeRemaining: drawTime,
    players: players.map((p) => ({ ...p, score: 0, hasGuessedCorrectly: false, roundScore: 0 })),
    hintsRevealed: 0,
    correctGuessers: 0,
    turnCount: 0,
  };
}

export function calculateGuesserPoints(
  timeRemaining: number,
  totalTime: number
): number {
  const timeRatio = timeRemaining / totalTime;
  return Math.round(
    GAME_CONFIG.MIN_POINTS_GUESSER +
      (GAME_CONFIG.MAX_POINTS_GUESSER - GAME_CONFIG.MIN_POINTS_GUESSER) * timeRatio
  );
}

export function calculateDrawerPoints(correctGuessers: number, totalPlayers: number): number {
  if (correctGuessers === 0) return 0;
  const ratio = correctGuessers / Math.max(1, totalPlayers - 1);
  return Math.round(GAME_CONFIG.MAX_POINTS_DRAWER * ratio);
}

export function getPlayerRankings(players: Player[]): Player[] {
  return [...players].sort((a, b) => b.score - a.score);
}
