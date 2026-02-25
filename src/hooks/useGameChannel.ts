
"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
import {
  GameState,
  GamePhase,
  Player,
  ChatMessage,
  createInitialGameState,
  calculateGuesserPoints,
  calculateDrawerPoints,
} from "@/lib/game-logic";
import { getRandomWords, isCloseGuess, getBlankWord, getWordHint } from "@/lib/words";
import { GAME_CONFIG } from "@/lib/constants";

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
  isCreator: boolean = false
): UseGameChannelReturn {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [myPlayerId] = useState(() => crypto.randomUUID());
  const [gameState, setGameState] = useState<GameState>(
    createInitialGameState([])
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const drawListenerRef = useRef<((event: DrawEvent) => void) | null>(null);
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
      channelRef.current?.send({
        type: "broadcast",
        event: "game-state",
        payload: {
          ...state,
          currentWord: hideWord ? "" : state.currentWord,
          wordChoices: [],
        },
      });
    },
    []
  );

  const startTurn = useCallback(
    (state: GameState) => {
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

      channelRef.current?.send({
        type: "broadcast",
        event: "clear-canvas",
        payload: {},
      });
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
          channelRef.current?.send({
            type: "broadcast",
            event: "timer-sync",
            payload: { timeRemaining: updated.timeRemaining },
          });

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
      clearTimer();
      const drawerIdx = state.currentDrawerIndex;
      const drawer = state.players[drawerIdx];
      const drawerPoints = calculateDrawerPoints(
        state.correctGuessers,
        state.players.length
      );

      const updatedPlayers = state.players.map((p) => {
        if (p.id === drawer?.id) {
          return { ...p, score: p.score + drawerPoints, roundScore: drawerPoints };
        }
        return p;
      });

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
        players: updatedPlayers,
        timeRemaining: GAME_CONFIG.ROUND_END_DELAY,
        turnCount: newTurnCount,
      };

      setGameState(endState);
      broadcastGameState(endState);

      addMessage({
        playerName: "System",
        playerId: "system",
        text: `The word was: ${state.currentWord}`,
        type: "system",
      });

      if (!isGameOver) {
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
    [clearTimer, broadcastGameState, addMessage, startTurn]
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
          channelRef.current?.send({
            type: "broadcast",
            event: "timer-sync",
            payload: { timeRemaining: updated.timeRemaining },
          });

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
            channelRef.current?.send({
              type: "broadcast",
              event: "hint-update",
              payload: { hintText: computedHint },
            });
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
    const channel = supabase.channel(`room:${roomId}`, {
      config: { broadcast: { self: false }, presence: { key: myPlayerId } },
    });

    channelRef.current = channel;

    channel.on("broadcast", { event: "draw" }, ({ payload }) => {
      const event = payload as DrawEvent;
      drawListenerRef.current?.(event);
    });

    channel.on("broadcast", { event: "clear-canvas" }, () => {
      setClearFlag((f) => f + 1);
    });

    channel.on("broadcast", { event: "fill" }, ({ payload }) => {
      setFillEvent(payload as { color: string });
    });

    channel.on("broadcast", { event: "undo" }, () => {
      setUndoFlag((f) => f + 1);
    });

    channel.on("broadcast", { event: "game-state" }, ({ payload }) => {
      const state = payload as GameState;
      setGameState((prev) => ({
        ...state,
        // During round-end/game-over the broadcast includes the actual word;
        // during drawing/choosing it's stripped so we keep the local placeholder
        currentWord: state.currentWord || prev.currentWord,
      }));
    });

    // Timer sync — non-host clients update their timer from host broadcasts
    channel.on("broadcast", { event: "timer-sync" }, ({ payload }) => {
      const { timeRemaining } = payload as { timeRemaining: number };
      setGameState((prev) => ({ ...prev, timeRemaining }));
    });

    // Hint update — non-drawers receive pre-computed hint text from the host
    channel.on("broadcast", { event: "hint-update" }, ({ payload }) => {
      const { hintText: text } = payload as { hintText: string };
      setHintText(text);
    });

    channel.on("broadcast", { event: "message" }, ({ payload }) => {
      const msg = payload as ChatMessage;
      setMessages((prev) => [...prev, msg]);
    });

    channel.on("broadcast", { event: "player-joined" }, ({ payload }) => {
      const newPlayer = payload as Player;
      setGameState((prev) => {
        if (prev.players.find((p) => p.id === newPlayer.id)) return prev;
        return { ...prev, players: [...prev.players, newPlayer] };
      });
      addMessage({
        playerName: "System",
        playerId: "system",
        text: `${newPlayer.name} joined the room`,
        type: "system",
      });

      // Respond with our own player data so the new player learns about us
      setTimeout(() => {
        const me = gameStateRef.current.players.find((p) => p.id === myPlayerId);
        if (me) {
          channel.send({
            type: "broadcast",
            event: "player-exists",
            payload: me,
          });
        }
      }, 100);
    });

    // When an existing player announces themselves
    channel.on("broadcast", { event: "player-exists" }, ({ payload }) => {
      const existingPlayer = payload as Player;
      setGameState((prev) => {
        if (prev.players.find((p) => p.id === existingPlayer.id)) return prev;
        return { ...prev, players: [...prev.players, existingPlayer] };
      });
    });

    channel.on("broadcast", { event: "player-left" }, ({ payload }) => {
      const { playerId, playerName } = payload as {
        playerId: string;
        playerName: string;
      };
      setGameState((prev) => ({
        ...prev,
        players: prev.players.filter((p) => p.id !== playerId),
      }));
      addMessage({
        playerName: "System",
        playerId: "system",
        text: `${playerName} left the room`,
        type: "system",
      });
    });

    channel.on("broadcast", { event: "start-game" }, ({ payload }) => {
      const { rounds, drawTime, players } = payload as {
        rounds: number;
        drawTime: number;
        players: Player[];
      };
      const initial = createInitialGameState(players, rounds, drawTime);
      setGameState(initial);
      setMessages([]);
    });

    channel.on("broadcast", { event: "word-chosen" }, ({ payload }) => {
      const { wordLength } = payload as { wordLength: number };
      setHintText(""); // Clear old hints from previous turn
      setGameState((prev) => ({
        ...prev,
        phase: "drawing",
        // Non-drawers get a placeholder of the correct length
        currentWord: "_".repeat(wordLength),
        wordChoices: [],
        timeRemaining: prev.drawTime,
      }));
      addMessage({
        playerName: "System",
        playerId: "system",
        text: `Word chosen! ${wordLength} letters`,
        type: "system",
      });
    });

    channel.on("broadcast", { event: "correct-guess" }, ({ payload }) => {
      const { playerId: guesserId, playerName: guesserName, points } = payload as {
        playerId: string;
        playerName: string;
        points: number;
      };
      setGameState((prev) => ({
        ...prev,
        correctGuessers: prev.correctGuessers + 1,
        players: prev.players.map((p) =>
          p.id === guesserId
            ? { ...p, hasGuessedCorrectly: true, score: p.score + points, roundScore: points }
            : p
        ),
      }));
      addMessage({
        playerName: "System",
        playerId: "system",
        text: `${guesserName} guessed the word! (+${points})`,
        type: "correct",
      });
    });

    channel
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const me: Player = {
            id: myPlayerId,
            name: playerName,
            score: 0,
            hasGuessedCorrectly: false,
            isHost: isCreator,
            avatar: Math.floor(Math.random() * 12),
            roundScore: 0,
          };

          setGameState((prev) => {
            return { ...prev, players: [...prev.players.filter(p => p.id !== myPlayerId), me] };
          });

          channel.send({
            type: "broadcast",
            event: "player-joined",
            payload: me,
          });
        }
      });

    return () => {
      clearTimer();
      channel.send({
        type: "broadcast",
        event: "player-left",
        payload: { playerId: myPlayerId, playerName },
      });
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, playerName, myPlayerId, isCreator]);

  const sendDraw = useCallback(
    (event: DrawEvent) => {
      channelRef.current?.send({
        type: "broadcast",
        event: "draw",
        payload: event,
      });
    },
    []
  );

  const sendClearCanvas = useCallback(() => {
    channelRef.current?.send({
      type: "broadcast",
      event: "clear-canvas",
      payload: {},
    });
    setClearFlag((f) => f + 1);
  }, []);

  const sendFill = useCallback((color: string) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "fill",
      payload: { color },
    });
    setFillEvent({ color });
  }, []);

  const sendUndo = useCallback(() => {
    channelRef.current?.send({
      type: "broadcast",
      event: "undo",
      payload: {},
    });
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

      if (
        current.phase === "drawing" &&
        trimmed.toLowerCase() === current.currentWord.toLowerCase()
      ) {
        const points = calculateGuesserPoints(
          current.timeRemaining,
          current.drawTime
        );
        channelRef.current?.send({
          type: "broadcast",
          event: "correct-guess",
          payload: {
            playerId: myPlayerId,
            playerName,
            points,
          },
        });
        setGameState((prev) => ({
          ...prev,
          correctGuessers: prev.correctGuessers + 1,
          players: prev.players.map((p) =>
            p.id === myPlayerId
              ? { ...p, hasGuessedCorrectly: true, score: p.score + points, roundScore: points }
              : p
          ),
        }));
        addMessage({
          playerName: "System",
          playerId: "system",
          text: `You guessed the word! (+${points})`,
          type: "correct",
        });
        return;
      }

      if (
        current.phase === "drawing" &&
        isCloseGuess(trimmed, current.currentWord)
      ) {
        addMessage({
          playerName,
          playerId: myPlayerId,
          text: trimmed,
          type: "close",
        });
        channelRef.current?.send({
          type: "broadcast",
          event: "message",
          payload: {
            id: crypto.randomUUID(),
            playerName,
            playerId: myPlayerId,
            text: trimmed,
            type: "close",
            timestamp: Date.now(),
          },
        });
        return;
      }

      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        playerName,
        playerId: myPlayerId,
        text: trimmed,
        type: "guess",
        timestamp: Date.now(),
      };
      addMessage(msg);
      channelRef.current?.send({
        type: "broadcast",
        event: "message",
        payload: msg,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [myPlayerId, playerName, isDrawer, addMessage]
  );

  const startGame = useCallback(
    (rounds: number, drawTime: number) => {
      const shuffled = [...gameState.players].sort(() => Math.random() - 0.5);
      const initial = createInitialGameState(shuffled, rounds, drawTime);

      channelRef.current?.send({
        type: "broadcast",
        event: "start-game",
        payload: { rounds, drawTime, players: shuffled },
      });

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

      channelRef.current?.send({
        type: "broadcast",
        event: "word-chosen",
        payload: { wordLength: word.length },
      });

      startDrawingTimer(newState);
    },
    [clearTimer, broadcastGameState, startDrawingTimer]
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
