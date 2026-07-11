"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Pusher from "pusher-js";
import {
  GameState,
  GamePhase,
  Player,
  ChatMessage,
  createInitialGameState,
  calculateGuesserPoints,
  calculateDrawerPoints,
  RoundHistory,
} from "@/lib/game-logic";
import { getRandomWords, isCloseGuess, getBlankWord, getWordHint } from "@/lib/words";
import { GAME_CONFIG } from "@/lib/constants";
import { saveGameResult } from "@/lib/auth";

interface DrawEvent {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: string;
  size: number;
  tool: "pen" | "eraser";
  isStart: boolean;
}

interface UseGameChannelReturn {
  gameState: GameState;
  messages: ChatMessage[];
  myPlayerId: string;
  isHost: boolean;
  isDrawer: boolean;
  currentWordDisplay: string;
  sendDraw: (event: DrawEvent) => void;
  sendClearCanvas: () => void;
  sendFill: (color: string) => void;
  sendUndo: () => void;
  sendGuess: (text: string) => void;
  startGame: (rounds: number, drawTime: number) => void;
  chooseWord: (word: string) => void;
  registerDrawListener: (listener: (event: DrawEvent) => void) => () => void;
  clearFlag: number;
  fillEvent: { color: string } | null;
  undoFlag: number;
}

export function useGameChannel(
  roomId: string,
  playerName: string,
  isCreator: boolean = false,
  userId: string | null = null,
  userImageUrl: string | null = null
): UseGameChannelReturn {
  const channelRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [myPlayerId] = useState(() => crypto.randomUUID());
  const [gameState, setGameState] = useState<GameState>(
    createInitialGameState([])
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const drawListenerRef = useRef<((event: DrawEvent) => void) | null>(null);
  const drawQueueRef = useRef<DrawEvent[]>([]);
  const [clearFlag, setClearFlag] = useState(0);
  const [fillEvent, setFillEvent] = useState<{ color: string } | null>(null);
  const [undoFlag, setUndoFlag] = useState(0);
  const [hintText, setHintText] = useState("");
  const gameStateRef = useRef(gameState);

  const registerDrawListener = useCallback(
    (listener: (event: DrawEvent) => void) => {
      drawListenerRef.current = listener;
      return () => {
        drawListenerRef.current = null;
      };
    },
    []
  );

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const addMessage = useCallback(
    (msg: Omit<ChatMessage, "id" | "timestamp">) => {
      setMessages((prev) => [
        ...prev,
        { ...msg, id: crypto.randomUUID(), timestamp: Date.now() },
      ]);
    },
    []
  );

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const broadcastGameState = useCallback(
    (state: GameState) => {
      // Strip the actual word during active gameplay
      // but include it for round-end/game-over so everyone sees the answer
      const hideWord =
        state.phase === "drawing" || state.phase === "choosing-word";
      channelRef.current?.trigger("client-game-state", {
        ...state,
        currentWord: hideWord ? "" : state.currentWord,
        wordChoices: [],
        roundHistory: state.roundHistory,
      });
    },
    []
  );

  const startTurn = useCallback(
    (state: GameState) => {
      if (gameStateRef.current.phase === "choosing-word" || gameStateRef.current.phase === "drawing") {
        return;
      }
      const words = getRandomWords(GAME_CONFIG.WORD_CHOICES);
      const newState: GameState = {
        ...state,
        phase: "choosing-word" as GamePhase,
        wordChoices: words,
        currentWord: "",
        timeRemaining: GAME_CONFIG.CHOOSING_TIME,
        hintsRevealed: 0,
        correctGuessers: 0,
        players: state.players.map((p) => ({
          ...p,
          hasGuessedCorrectly: false,
          roundScore: 0,
        })),
      };
      setGameState(newState);
      broadcastGameState(newState);

      // Send word choices to the drawer (they need them to pick a word)
      const drawerId = state.players[state.currentDrawerIndex]?.id;
      channelRef.current?.trigger("client-word-choices", { drawerId, words });

      channelRef.current?.trigger("client-clear-canvas", {});
      setClearFlag((f) => f + 1);

      addMessage({
        playerName: "System",
        playerId: "system",
        text: `${state.players[state.currentDrawerIndex]?.name} is choosing a word...`,
        type: "system",
      });

      clearTimer();
      timerRef.current = setInterval(() => {
        setGameState((prev) => {
          const updated = { ...prev, timeRemaining: prev.timeRemaining - 1 };

          // Broadcast timer to keep all clients in sync
          channelRef.current?.trigger("client-timer-sync", { timeRemaining: updated.timeRemaining });

          if (updated.timeRemaining <= 0 && updated.phase === "choosing-word") {
            const autoWord =
              updated.wordChoices[
                Math.floor(Math.random() * updated.wordChoices.length)
              ];
            clearTimer();
            const drawingState: GameState = {
              ...updated,
              phase: "drawing",
              currentWord: autoWord,
              wordChoices: [],
              timeRemaining: updated.drawTime,
            };
            broadcastGameState(drawingState);
            // Notify guessers about word length
            channelRef.current?.trigger("client-word-chosen", { wordLength: autoWord.length });
            startDrawingTimer(drawingState);
            return drawingState;
          }
          return updated;
        });
      }, 1000);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [broadcastGameState, addMessage, clearTimer, myPlayerId]
  );

  const endTurn = useCallback(
    (state: GameState) => {
      if (gameStateRef.current.phase === "round-end" || gameStateRef.current.phase === "game-over") {
        return;
      }
      clearTimer();
      const drawerIdx = state.currentDrawerIndex;
      const drawer = state.players[drawerIdx];
      const drawerPoints = calculateDrawerPoints(
        state.correctGuessers,
        state.players.length
      );

      // Update players with round results
      const updatedPlayers = state.players.map((p) => {
        if (p.id === drawer?.id) {
          // Drawer gets points and potentially wins the round
          const newRoundsWon = p.roundScore > 0 || state.correctGuessers > 0 ? p.roundsWon + 1 : p.roundsWon;
          return { 
            ...p, 
            score: p.score + drawerPoints, 
            roundScore: drawerPoints,
            roundsWon: newRoundsWon
          };
        }
        // Update words guessed for players who guessed correctly
        if (p.hasGuessedCorrectly) {
          return { ...p, wordsGuessed: p.wordsGuessed + 1 };
        }
        return p;
      });

      // Record this round in history
      const roundGuessers = state.players
        .filter(p => p.hasGuessedCorrectly && p.id !== drawer?.id)
        .map(p => ({
          playerId: p.id,
          playerName: p.name,
          pointsEarned: p.roundScore,
          timeToGuess: state.timeRemaining
        }));

      const newRoundHistory: RoundHistory[] = [
        ...(state.roundHistory || []),
        {
          roundNumber: state.currentRound,
          word: state.currentWord,
          drawerId: drawer?.id || "",
          drawerName: drawer?.name || "Unknown",
          guessers: roundGuessers
        }
      ];

      const nextDrawerIdx =
        (drawerIdx + 1) % state.players.length;
      const newTurnCount = state.turnCount + 1;
      const isNewRound = nextDrawerIdx === 0 && newTurnCount > 0;
      const nextRound = isNewRound
        ? state.currentRound + 1
        : state.currentRound;
      const isGameOver = nextRound > state.totalRounds && isNewRound;

      const endState: GameState = {
        ...state,
        phase: isGameOver ? "game-over" : "round-end",
        players: updatedPlayers.map(p => ({ ...p, hasGuessedCorrectly: false })),
        timeRemaining: GAME_CONFIG.ROUND_END_DELAY,
        turnCount: newTurnCount,
        roundHistory: newRoundHistory,
        correctGuessers: 0,
      };

      setGameState(endState);
      broadcastGameState(endState);

      addMessage({
        playerName: "System",
        playerId: "system",
        text: `The word was: ${state.currentWord}`,
        type: "system",
      });

      if (isGameOver) {
        // Save game result to database (host only)
        const ranked = [...updatedPlayers].sort((a, b) => b.score - a.score);
        const winner = ranked[0];
        
        // Build round history for saving
        const roundsForSave = (endState.roundHistory || []).map(rh => ({
          roundNumber: rh.roundNumber,
          word: rh.word,
          drawerName: rh.drawerName,
          drawerId: rh.drawerId,
          guessers: rh.guessers.map(g => ({
            playerName: g.playerName,
            playerId: g.playerId,
            pointsEarned: g.pointsEarned,
            timeToGuess: g.timeToGuess
          }))
        }));

        saveGameResult({
          roomId,
          totalRounds: state.totalRounds,
          drawTime: state.drawTime,
          playerCount: updatedPlayers.length,
          winnerId: winner?.userId || null,
          winnerName: winner?.name || "Unknown",
          winnerScore: winner?.score || 0,
          participants: ranked.map((p, i) => ({
            userId: p.userId || (p.id === myPlayerId ? userId : null),
            playerName: p.name,
            score: p.score,
            rank: i + 1,
            wordsGuessed: p.wordsGuessed || 0,
            roundsWon: p.roundsWon || 0,
            isHost: p.isHost || false,
            imageUrl: p.imageUrl || null
          })),
          rounds: roundsForSave
        }).catch(console.error);
      } else {
        setTimeout(() => {
          const nextState: GameState = {
            ...endState,
            currentDrawerIndex: nextDrawerIdx,
            currentRound: nextRound,
            phase: "waiting",
          };
          startTurn(nextState);
        }, GAME_CONFIG.ROUND_END_DELAY * 1000);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clearTimer, broadcastGameState, addMessage, startTurn, myPlayerId, userId, roomId]
  );

  const startDrawingTimer = useCallback(
    (state: GameState) => {
      clearTimer();
      let hintCount = 0;
      const hintInterval = Math.floor(
        state.drawTime / (Math.ceil(state.currentWord.length * 0.4) + 1)
      );

      timerRef.current = setInterval(() => {
        setGameState((prev) => {
          const updated = { ...prev, timeRemaining: prev.timeRemaining - 1 };

          // Broadcast timer to keep all clients in sync
          channelRef.current?.trigger("client-timer-sync", { timeRemaining: updated.timeRemaining });

          if (
            updated.timeRemaining > 0 &&
            updated.timeRemaining % hintInterval === 0 &&
            updated.phase === "drawing"
          ) {
            hintCount++;
            const hinted = { ...updated, hintsRevealed: hintCount };
            const computedHint = getWordHint(updated.currentWord, hintCount);
            broadcastGameState({
              ...hinted,
              wordChoices: [],
            });
            // Send the pre-computed hint text so non-drawers display correct letters
            channelRef.current?.trigger("client-hint-update", { hintText: computedHint });
            return hinted;
          }

          if (updated.timeRemaining <= 0) {
            clearTimer();
            setTimeout(() => {
              endTurn(gameStateRef.current);
            }, 100);
            return updated;
          }

          const allGuessed =
            updated.players.filter(
              (p) => p.id !== updated.players[updated.currentDrawerIndex]?.id
            ).length > 0 &&
            updated.players
              .filter(
                (p) =>
                  p.id !== updated.players[updated.currentDrawerIndex]?.id
              )
              .every((p) => p.hasGuessedCorrectly);

          if (allGuessed && updated.phase === "drawing") {
            clearTimer();
            setTimeout(() => {
              endTurn(gameStateRef.current);
            }, 100);
          }

          return updated;
        });
      }, 1000);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clearTimer, broadcastGameState, endTurn]
  );

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
      console.warn("Pusher client keys are missing");
      return;
    }

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      authEndpoint: "/api/pusher/auth",
    });

    const channel = pusher.subscribe(`presence-room-${roomId}`);
    channelRef.current = channel;

    channel.bind("client-draw-batch", (payload: { events: DrawEvent[] }) => {
      payload.events.forEach((event) => {
        drawListenerRef.current?.(event);
      });
    });

    channel.bind("client-clear-canvas", () => {
      setClearFlag((f) => f + 1);
    });

    channel.bind("client-fill", (payload: { color: string }) => {
      setFillEvent(payload);
    });

    channel.bind("client-undo", () => {
      setUndoFlag((f) => f + 1);
    });

    channel.bind("client-game-state", (payload: GameState) => {
      setGameState((prev) => ({
        ...payload,
        // During round-end/game-over the broadcast includes the actual word;
        // during drawing/choosing it's stripped so we keep the local placeholder
        currentWord: payload.currentWord || prev.currentWord,
      }));
    });

    // Timer sync — non-host clients update their timer from host broadcasts
    channel.bind("client-timer-sync", (payload: { timeRemaining: number }) => {
      setGameState((prev) => ({ ...prev, timeRemaining: payload.timeRemaining }));
    });

    // Hint update — non-drawers receive pre-computed hint text from the host
    channel.bind("client-hint-update", (payload: { hintText: string }) => {
      setHintText(payload.hintText);
    });

    channel.bind("client-message", (payload: ChatMessage) => {
      setMessages((prev) => [...prev, payload]);
    });

    channel.bind("client-player-joined", (payload: Player) => {
      setGameState((prev) => {
        const existing = prev.players.find((p) => p.id === payload.id);
        if (existing) {
          // Merge update (e.g. imageUrl arriving late from Clerk)
          const merged = prev.players.map((p) =>
            p.id === payload.id ? { ...p, ...payload, score: p.score, roundScore: p.roundScore } : p
          );
          return { ...prev, players: merged };
        }
        return { ...prev, players: [...prev.players, payload] };
      });
      addMessage({
        playerName: "System",
        playerId: "system",
        text: `${payload.name} joined the room`,
        type: "system",
      });

      // Respond with our own player data so the new player learns about us
      setTimeout(() => {
        const me = gameStateRef.current.players.find((p) => p.id === myPlayerId);
        if (me) {
          channel.trigger("client-player-exists", me);
        }
      }, 100);
    });

    // When an existing player announces themselves
    channel.bind("client-player-exists", (payload: Player) => {
      setGameState((prev) => {
        if (prev.players.find((p) => p.id === payload.id)) return prev;
        return { ...prev, players: [...prev.players, payload] };
      });
    });

    channel.bind("client-player-left", (payload: { playerId: string; playerName: string }) => {
      setGameState((prev) => ({
        ...prev,
        players: prev.players.filter((p) => p.id !== payload.playerId),
      }));
      addMessage({
        playerName: "System",
        playerId: "system",
        text: `${payload.playerName} left the room`,
        type: "system",
      });
    });

    channel.bind("client-start-game", (payload: { rounds: number; drawTime: number; players: Player[] }) => {
      const initial = createInitialGameState(payload.players, payload.rounds, payload.drawTime);
      setGameState(initial);
      setMessages([]);
    });

    channel.bind("client-word-chosen", (payload: { wordLength: number }) => {
      setHintText(""); // Clear old hints from previous turn
      setGameState((prev) => {
        // If we're the drawer, we already know the word — don't overwrite
        const currentDrawer = prev.players[prev.currentDrawerIndex];
        if (currentDrawer?.id === myPlayerId) {
          return {
            ...prev,
            phase: "drawing",
            wordChoices: [],
            timeRemaining: prev.drawTime,
          };
        }
        return {
          ...prev,
          phase: "drawing",
          // Non-drawers get a placeholder of the correct length
          currentWord: "_".repeat(payload.wordLength),
          wordChoices: [],
          timeRemaining: prev.drawTime,
        };
      });
      addMessage({
        playerName: "System",
        playerId: "system",
        text: `Word chosen! ${payload.wordLength} letters`,
        type: "system",
      });
    });

    // Non-host drawers receive word choices to display in the selector
    channel.bind("client-word-choices", (payload: { drawerId: string; words: string[] }) => {
      // Only the designated drawer should see the word choices
      if (payload.drawerId === myPlayerId) {
        setGameState((prev) => ({
          ...prev,
          wordChoices: payload.words,
        }));
      }
    });

    // Host receives word choice from a non-host drawer
    channel.bind("client-drawer-chose-word", (payload: { word: string }) => {
      if (!isCreator) return; // Only the host processes this
      clearTimer();
      const newState: GameState = {
        ...gameStateRef.current,
        phase: "drawing",
        currentWord: payload.word,
        wordChoices: [],
        timeRemaining: gameStateRef.current.drawTime,
      };
      setGameState(newState);
      broadcastGameState(newState);
      channel.trigger("client-word-chosen", { wordLength: payload.word.length });
      startDrawingTimer(newState);
    });

    // Host validates guess attempts from non-drawers
    channel.bind("client-guess-attempt", (payload: { playerId: string; playerName: string; text: string }) => {
      const gs = gameStateRef.current;
      // Only the host (room creator) validates guesses — they have the real word
      if (!isCreator) return;
      // Only host checks — they know the real word
      const me = gs.players.find((p) => p.id === payload.playerId);
      if (me?.hasGuessedCorrectly) return;

      if (
        gs.phase === "drawing" &&
        payload.text.trim().toLowerCase() === gs.currentWord.toLowerCase()
      ) {
        const points = calculateGuesserPoints(gs.timeRemaining, gs.drawTime);
        channel.trigger("client-correct-guess", { playerId: payload.playerId, playerName: payload.playerName, points });
        // Also update host's own state
        setGameState((prev) => {
          const updatedPlayers = prev.players.map((p) =>
            p.id === payload.playerId
              ? { 
                  ...p, 
                  hasGuessedCorrectly: true, 
                  score: p.score + points, 
                  roundScore: points,
                  wordsGuessed: p.wordsGuessed + 1
                }
              : p
          );
          
          return {
            ...prev,
            correctGuessers: prev.correctGuessers + 1,
            players: updatedPlayers,
          };
        });
        addMessage({
          playerName: "System",
          playerId: "system",
          text: `${payload.playerName} guessed the word! (+${points})`,
          type: "correct",
        });
        // Check if all non-drawers have guessed
        const updatedPlayers = gs.players.map((p) =>
          p.id === payload.playerId ? { ...p, hasGuessedCorrectly: true } : p
        );
        const drawer = gs.players[gs.currentDrawerIndex];
        const allGuessed = updatedPlayers
          .filter((p) => p.id !== drawer?.id)
          .every((p) => p.hasGuessedCorrectly);
        if (allGuessed) {
          // End turn early — give drawer bonus points
          const drawerPoints = calculateDrawerPoints(gs.correctGuessers + 1, gs.players.length);
          setGameState((prev) => ({
            ...prev,
            players: prev.players.map((p) =>
              p.id === drawer?.id
                ? { ...p, score: p.score + drawerPoints, roundScore: drawerPoints, roundsWon: p.roundsWon + 1 }
                : p
            ),
          }));
          // Small delay to let state propagate, then end
          setTimeout(() => endTurn(gameStateRef.current), 500);
        }
      } else if (gs.phase === "drawing") {
        const msg: ChatMessage = {
          id: crypto.randomUUID(),
          playerName: payload.playerName,
          playerId: payload.playerId,
          text: payload.text.trim(),
          type: "guess",
          timestamp: Date.now(),
        };
        addMessage(msg);
        channel.trigger("client-message", msg);
      }
    });

    channel.bind("client-correct-guess", (payload: { playerId: string; playerName: string; points: number }) => {
      setGameState((prev) => ({
        ...prev,
        correctGuessers: prev.correctGuessers + 1,
        players: prev.players.map((p) =>
          p.id === payload.playerId
            ? { 
                ...p, 
                hasGuessedCorrectly: true, 
                score: p.score + payload.points, 
                roundScore: payload.points,
                wordsGuessed: p.wordsGuessed + 1
              }
            : p
        ),
      }));
      addMessage({
        playerName: "System",
        playerId: "system",
        text: `${payload.playerName} guessed the word! (+${payload.points})`,
        type: "correct",
      });
    });

    channel.bind("pusher:subscription_succeeded", () => {
      const me: Player = {
        id: myPlayerId,
        name: playerName,
        score: 0,
        hasGuessedCorrectly: false,
        isHost: isCreator,
        avatar: Math.floor(Math.random() * 12),
        roundScore: 0,
        imageUrl: userImageUrl || undefined,
        userId: userId || undefined,
        wordsGuessed: 0,
        roundsWon: 0,
      };

      setGameState((prev) => {
        return { ...prev, players: [...prev.players.filter(p => p.id !== myPlayerId), me] };
      });

      // Broadcast to other players that we joined
      channel.trigger("client-player-joined", me);
    });

    return () => {
      clearTimer();
      channel.trigger("client-player-left", { playerId: myPlayerId, playerName });
      pusher.unsubscribe(`presence-room-${roomId}`);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, playerName, myPlayerId, isCreator]);

  // Update player details when Clerk user loads (after initial subscription)
  useEffect(() => {
    if (!userId && !userImageUrl) return;
    setGameState((prev) => {
      const updated = prev.players.map((p) =>
        p.id === myPlayerId
          ? {
              ...p,
              imageUrl: userImageUrl || p.imageUrl,
              userId: userId || p.userId,
            }
          : p
      );
      return { ...prev, players: updated };
    });
    // Re-broadcast so other clients see the updated user details
    if (channelRef.current) {
      const me = gameStateRef.current.players.find((p) => p.id === myPlayerId);
      if (me) {
        channelRef.current.trigger("client-player-joined", me);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userImageUrl]);

  const sendDraw = useCallback(
    (event: DrawEvent) => {
      drawQueueRef.current.push(event);
    },
    []
  );

  // Flush the accumulated drawing events to Pusher every 100ms to stay within client rate limits (max 10/s)
  useEffect(() => {
    const interval = setInterval(() => {
      if (drawQueueRef.current.length > 0 && channelRef.current) {
        const events = [...drawQueueRef.current];
        drawQueueRef.current = [];
        channelRef.current.trigger("client-draw-batch", { events });
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const sendClearCanvas = useCallback(() => {
    channelRef.current?.trigger("client-clear-canvas", {});
    setClearFlag((f) => f + 1);
  }, []);

  const sendFill = useCallback((color: string) => {
    channelRef.current?.trigger("client-fill", { color });
    setFillEvent({ color });
  }, []);

  const sendUndo = useCallback(() => {
    channelRef.current?.trigger("client-undo", {});
    setUndoFlag((f) => f + 1);
  }, []);

  const isHost = gameState.players.find((p) => p.id === myPlayerId)?.isHost ?? false;
  const isDrawer =
    gameState.phase !== "waiting" &&
    gameState.players[gameState.currentDrawerIndex]?.id === myPlayerId;

  const sendGuess = useCallback(
    (text: string) => {
      const current = gameStateRef.current;
      const trimmed = text.trim();
      if (!trimmed) return;

      if (isDrawer) return;

      const me = current.players.find((p) => p.id === myPlayerId);
      if (me?.hasGuessedCorrectly) return;

      // If we are the creator/host, validate our guess locally!
      if (isCreator) {
        if (
          current.phase === "drawing" &&
          trimmed.toLowerCase() === current.currentWord.toLowerCase()
        ) {
          const points = calculateGuesserPoints(current.timeRemaining, current.drawTime);
          channelRef.current?.trigger("client-correct-guess", {
            playerId: myPlayerId,
            playerName,
            points,
          });
          setGameState((prev) => {
            const updatedCorrectCount = prev.correctGuessers + 1;
            const updatedPlayers = prev.players.map((p) =>
              p.id === myPlayerId
                ? { 
                    ...p, 
                    hasGuessedCorrectly: true, 
                    score: p.score + points, 
                    roundScore: points,
                    wordsGuessed: p.wordsGuessed + 1
                  }
                : p
            );
            
            // Check if all non-drawers have guessed correctly
            const drawer = prev.players[prev.currentDrawerIndex];
            const allGuessed = updatedPlayers
              .filter((p) => p.id !== drawer?.id)
              .every((p) => p.hasGuessedCorrectly);

            if (allGuessed) {
              const drawerPoints = calculateDrawerPoints(updatedCorrectCount, prev.players.length);
              const playersWithDrawerPoints = updatedPlayers.map((p) =>
                p.id === drawer?.id
                  ? { 
                      ...p, 
                      score: p.score + drawerPoints, 
                      roundScore: drawerPoints,
                      roundsWon: p.roundsWon + 1
                    }
                  : p
              );
              
              const nextState = {
                ...prev,
                correctGuessers: updatedCorrectCount,
                players: playersWithDrawerPoints,
              };
              
              setTimeout(() => endTurn(nextState), 500);
              return nextState;
            }

            return {
              ...prev,
              correctGuessers: updatedCorrectCount,
              players: updatedPlayers,
            };
          });

          addMessage({
            playerName: "System",
            playerId: "system",
            text: `${playerName} guessed the word! (+${points})`,
            type: "correct",
          });
        } else if (current.phase === "drawing") {
          const msg: ChatMessage = {
            id: crypto.randomUUID(),
            playerName,
            playerId: myPlayerId,
            text: trimmed,
            type: "guess",
            timestamp: Date.now(),
          };
          addMessage(msg);
          channelRef.current?.trigger("client-message", msg);
        }
      } else {
        // If we are a normal player, send it to the host to validate
        if (current.phase === "drawing") {
          channelRef.current?.trigger("client-guess-attempt", {
            playerId: myPlayerId,
            playerName,
            text: trimmed,
          });
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [myPlayerId, playerName, isDrawer, isCreator, addMessage, endTurn]
  );

  const startGame = useCallback(
    (rounds: number, drawTime: number) => {
      const shuffled = [...gameState.players].sort(() => Math.random() - 0.5);
      const initial = createInitialGameState(shuffled, rounds, drawTime);

      channelRef.current?.trigger("client-start-game", { rounds, drawTime, players: shuffled });

      setGameState(initial);
      setMessages([]);

      setTimeout(() => {
        startTurn(initial);
      }, 500);
    },
    [gameState.players, startTurn]
  );

  const chooseWord = useCallback(
    (word: string) => {
      if (isCreator) {
        // Host handles it directly
        clearTimer();
        const newState: GameState = {
          ...gameStateRef.current,
          phase: "drawing",
          currentWord: word,
          wordChoices: [],
          timeRemaining: gameStateRef.current.drawTime,
        };
        setGameState(newState);
        broadcastGameState(newState);

        channelRef.current?.trigger("client-word-chosen", { wordLength: word.length });

        startDrawingTimer(newState);
      } else {
        // Non-host drawer sends choice to host for processing
        channelRef.current?.trigger("client-drawer-chose-word", { word });
        // Set the word locally so the drawer can see it, clear word choices UI
        setGameState((prev) => ({ ...prev, currentWord: word, wordChoices: [] }));
      }
    },
    [isCreator, clearTimer, broadcastGameState, startDrawingTimer]
  );

  const currentWordDisplay = (() => {
    if (isDrawer || gameState.phase === "round-end" || gameState.phase === "game-over") {
      return gameState.currentWord;
    }
    if (gameState.phase === "drawing" && gameState.currentWord) {
      // Non-drawers use the pre-computed hint text from the host
      if (hintText) {
        return hintText;
      }
      return getBlankWord(gameState.currentWord);
    }
    if (gameState.phase === "choosing-word") {
      return "...";
    }
    return "";
  })();

  return {
    gameState,
    messages,
    myPlayerId,
    isHost,
    isDrawer,
    currentWordDisplay,
    sendDraw,
    sendClearCanvas,
    sendFill,
    sendUndo,
    sendGuess,
    startGame,
    chooseWord,
    registerDrawListener,
    clearFlag,
    fillEvent,
    undoFlag,
  };
}
