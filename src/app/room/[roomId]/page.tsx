"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { useGameChannel } from "@/hooks/useGameChannel";
import Canvas from "@/components/Canvas";
import Chat from "@/components/Chat";
import Scoreboard from "@/components/Scoreboard";
import Lobby from "@/components/Lobby";
import WordSelector from "@/components/WordSelector";
import Timer from "@/components/Timer";
import GameOver from "@/components/GameOver";
import RoundEnd from "@/components/RoundEnd";

function GameRoom() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const playerName = searchParams.get("name") || "Player";
  const isCreator = searchParams.get("create") === "true";

  const {
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
  } = useGameChannel(roomId, playerName, isCreator);

  const { phase, players, currentDrawerIndex, timeRemaining } = gameState;

  // Show lobby if waiting
  if (phase === "waiting" && gameState.turnCount === 0) {
    return (
      <Lobby
        roomId={roomId}
        players={players}
        isHost={isHost}
        onStartGame={startGame}
      />
    );
  }

  const currentDrawer = players[currentDrawerIndex];
  const me = players.find((p) => p.id === myPlayerId);

  return (
    <div className="min-h-screen bg-background p-3 lg:p-4">
      {/* Word Selector Modal */}
      {phase === "choosing-word" && isDrawer && (
        <WordSelector
          words={gameState.wordChoices}
          timeRemaining={timeRemaining}
          onChoose={chooseWord}
        />
      )}

      {/* Round End Modal */}
      {phase === "round-end" && (
        <RoundEnd
          currentWord={gameState.currentWord}
          players={players}
          timeRemaining={timeRemaining}
        />
      )}

      {/* Game Over Modal */}
      {phase === "game-over" && (
        <GameOver
          players={players}
          onPlayAgain={() =>
            startGame(gameState.totalRounds, gameState.drawTime)
          }
          onExit={() => router.push("/")}
          isHost={isHost}
        />
      )}

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto">
        {/* Timer & Word Bar */}
        <div className="mb-3">
          <Timer
            timeRemaining={timeRemaining}
            totalTime={phase === "choosing-word" ? 15 : gameState.drawTime}
            currentWord={currentWordDisplay}
            currentRound={gameState.currentRound}
            totalRounds={gameState.totalRounds}
            drawerName={currentDrawer?.name || ""}
            isDrawer={isDrawer}
            gamePhase={phase}
          />
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_300px] gap-3">
          {/* Left — Scoreboard */}
          <div className="order-3 lg:order-1">
            <Scoreboard
              players={players}
              currentDrawerIndex={currentDrawerIndex}
              myPlayerId={myPlayerId}
              gamePhase={phase}
            />
          </div>

          {/* Center — Canvas */}
          <div className="order-1 lg:order-2">
            <Canvas
              isDrawer={isDrawer}
              registerDrawListener={registerDrawListener}
              clearFlag={clearFlag}
              fillEvent={fillEvent}
              undoFlag={undoFlag}
              onDraw={sendDraw}
              onClear={sendClearCanvas}
              onFill={sendFill}
              onUndo={sendUndo}
            />
          </div>

          {/* Right — Chat */}
          <div className="order-2 lg:order-3 h-[400px] lg:h-auto">
            <Chat
              messages={messages}
              onGuess={sendGuess}
              isDrawer={isDrawer}
              hasGuessedCorrectly={me?.hasGuessedCorrectly ?? false}
              gamePhase={phase}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Loading game...</p>
          </div>
        </div>
      }
    >
      <GameRoom />
    </Suspense>
  );
}
