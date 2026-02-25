"use client";

import { Player, getPlayerRankings } from "@/lib/game-logic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GameOverProps {
  players: Player[];
  onPlayAgain: () => void;
  onExit: () => void;
  isHost: boolean;
}

export default function GameOver({
  players,
  onPlayAgain,
  onExit,
  isHost,
}: GameOverProps) {
  const ranked = getPlayerRankings(players);
  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  const AVATARS = [
    "😀",
    "😎",
    "🤠",
    "🥳",
    "😈",
    "👻",
    "🤖",
    "👽",
    "🦊",
    "🐱",
    "🐸",
    "🦄",
  ];
  const medals = ["🥇", "🥈", "🥉"];

  // Confetti colors that work across themes
  const confettiColors = [
    "#e07020",
    "#8b5cf6",
    "#ef4444",
    "#22c55e",
    "#f59e0b",
    "#3b82f6",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
    "#f97316",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-5%`,
              backgroundColor: confettiColors[i % confettiColors.length],
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-lg w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-foreground mb-2">
            Game Over!
          </h1>
          <p className="text-muted-foreground">Final Results</p>
        </div>

        {/* Podium */}
        <div className="flex justify-center items-end gap-3 mb-8">
          {[1, 0, 2].map((rankIndex) => {
            const player = podium[rankIndex];
            if (!player) return <div key={rankIndex} className="w-28" />;
            const heights = ["h-36", "h-28", "h-24"];

            return (
              <div key={player.id} className="flex flex-col items-center">
                <span className="text-3xl mb-2">
                  {AVATARS[player.avatar % AVATARS.length]}
                </span>
                <span className="text-sm font-semibold text-foreground/80 mb-1 truncate max-w-[100px]">
                  {player.name}
                </span>
                <span className="text-2xl mb-2">{medals[rankIndex]}</span>
                <div
                  className={`w-28 ${heights[rankIndex]} rounded-t-xl border border-b-0 flex items-center justify-center ${
                    rankIndex === 0
                      ? "bg-primary/15 border-primary/30"
                      : rankIndex === 1
                        ? "bg-muted border-border"
                        : "bg-warning/15 border-warning/30"
                  }`}
                >
                  <span className="text-xl font-bold text-foreground">
                    {player.score}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rest of players */}
        {rest.length > 0 && (
          <Card className="mb-6">
            <CardContent className="py-4">
              {rest.map((player, i) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                >
                  <Badge variant="secondary" className="text-xs">
                    #{i + 4}
                  </Badge>
                  <span className="text-lg">
                    {AVATARS[player.avatar % AVATARS.length]}
                  </span>
                  <span className="flex-1 text-muted-foreground text-sm">
                    {player.name}
                  </span>
                  <span className="text-foreground/80 font-semibold">
                    {player.score}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isHost ? (
            <Button onClick={onPlayAgain} size="lg" className="w-full text-lg">
              🎮 Play Again
            </Button>
          ) : (
            <p className="text-center text-muted-foreground text-sm">
              Waiting for host to start a new game...
            </p>
          )}
          <Button onClick={onExit} variant="outline" className="w-full">
            🚪 Exit Room
          </Button>
        </div>
      </div>
    </div>
  );
}
