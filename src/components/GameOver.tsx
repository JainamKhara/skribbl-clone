"use client";

import { Player, getPlayerRankings } from "@/lib/game-logic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Gamepad2, LogOut, Medal, Users } from "lucide-react";

interface GameOverProps {
  players: Player[];
  onPlayAgain: () => void;
  onExit: () => void;
  isHost: boolean;
}

import Avatar from "@/components/Avatar";

export default function GameOver({
  players,
  onPlayAgain,
  onExit,
  isHost,
}: GameOverProps) {
  const router = useRouter();
  const ranked = getPlayerRankings(players);
  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md">
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2.5 h-2.5 rounded-full animate-confetti"
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

      <div className="relative z-10 max-w-lg w-full mx-4 animate-fadeIn">
        <div className="text-center mb-8">
          <Trophy className="w-16 h-16 text-warning mx-auto mb-4 animate-bounce" />
          <h1 className="text-4xl font-extrabold text-foreground mb-2 bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
            Game Over!
          </h1>
          <p className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">Final Rankings</p>
        </div>

        {/* Podium */}
        <div className="flex justify-center items-end gap-3 mb-8">
          {[1, 0, 2].map((rankIndex) => {
            const player = podium[rankIndex];
            if (!player) return <div key={rankIndex} className="w-28" />;
            const heights = ["h-36", "h-26", "h-22"];

            return (
              <div key={player.id} className="flex flex-col items-center">
                <Avatar index={player.avatar} name={player.name} className="w-12 h-12 mb-2" />
                <span className="text-xs font-bold text-foreground/80 mb-2 truncate max-w-[90px]">
                  {player.name}
                </span>
                <div
                  className={`w-28 ${heights[rankIndex]} rounded-t-2xl border border-b-0 flex flex-col items-center justify-center gap-1.5 shadow-lg ${
                    rankIndex === 0
                      ? "bg-primary/20 border-primary/45 shadow-[4px_4px_0px_0px_rgba(255,107,0,0.15)]"
                      : rankIndex === 1
                        ? "bg-secondary/40 border-border/30 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]"
                        : "bg-warning/20 border-warning/45 shadow-[4px_4px_0px_0px_rgba(255,215,0,0.15)]"
                  }`}
                >
                  <Medal className={`w-5 h-5 ${
                    rankIndex === 0
                      ? "text-yellow-400"
                      : rankIndex === 1
                        ? "text-slate-300"
                        : "text-amber-600"
                  }`} />
                  <span className="text-lg font-black text-foreground">
                    {player.score}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rest of players */}
        {rest.length > 0 && (
          <Card className="mb-6 cyber-card border-border/40">
            <CardContent className="py-4 space-y-2 max-h-[180px] overflow-y-auto scrollbar-thin">
              {rest.map((player, i) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 py-2 border-b border-border/25 last:border-0"
                >
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    #{i + 4}
                  </Badge>
                  <Avatar index={player.avatar} name={player.name} className="w-7 h-7" />
                  <span className="flex-1 text-muted-foreground text-sm font-semibold">
                    {player.name}
                  </span>
                  <span className="text-foreground font-black text-sm">
                    {player.score}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          {isHost ? (
            <Button
              onClick={onPlayAgain}
              size="lg"
              className="w-full h-11 text-sm font-bold uppercase tracking-wider arcade-btn bg-primary text-primary-foreground hover:bg-primary/95 border-2 border-border shadow-[4px_4px_0px_0px_#000] rounded-xl"
            >
              <Gamepad2 className="w-4 h-4 mr-2" /> Play Again
            </Button>
          ) : (
            <div className="p-3 rounded-lg bg-secondary/35 border border-border/30 text-center mb-1">
              <p className="text-muted-foreground text-xs font-semibold animate-pulse">
                Waiting for the host to restart the game...
              </p>
            </div>
          )}
          <Button onClick={onExit} variant="outline" className="w-full h-10 border-border/45 hover:bg-secondary/40 font-semibold text-sm">
            <LogOut className="w-4 h-4 mr-2" /> Exit Room
          </Button>
          <Button
            onClick={() => router.push("/leaderboard")}
            variant="ghost"
            className="w-full h-10 text-muted-foreground hover:text-primary font-semibold text-sm"
          >
            <Trophy className="w-4 h-4 mr-2 text-primary" /> View Leaderboard
          </Button>
        </div>
      </div>
    </div>
  );
}
