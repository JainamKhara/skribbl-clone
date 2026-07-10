"use client";

import { Player, getPlayerRankings } from "@/lib/game-logic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Pencil, CheckCircle2, Trophy } from "lucide-react";
import Avatar from "@/components/Avatar";

interface ScoreboardProps {
  players: Player[];
  currentDrawerIndex: number;
  myPlayerId: string;
  gamePhase: string;
}

export default function Scoreboard({
  players,
  currentDrawerIndex,
  myPlayerId,
  gamePhase,
}: ScoreboardProps) {
  const ranked =
    gamePhase === "game-over" ? getPlayerRankings(players) : players;

  return (
    <Card className="py-0 gap-0 cyber-card border-border/40">
      <CardHeader className="px-4 py-3 border-b border-border/30">
        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Trophy className="w-3.5 h-3.5 text-primary" />
          Scoreboard
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 space-y-1.5 bg-black/10">
        {ranked.map((player, index) => {
          const isDrawer =
            gamePhase !== "waiting" &&
            gamePhase !== "game-over" &&
            players[currentDrawerIndex]?.id === player.id;
          const isMe = player.id === myPlayerId;
          const rank = getPlayerRankings(players).findIndex(
            (p) => p.id === player.id,
          );
          const isFirstPlace = rank === 0 && players.some((p) => p.score > 0);

          return (
            <div
              key={player.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border ${
                isMe
                  ? "bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(168,85,247,0.06)]"
                  : "bg-secondary/20 hover:bg-secondary/40 border-border/25"
              } ${isDrawer ? "ring-1 ring-warning/35 border-warning/30" : ""}`}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-6">
                {isFirstPlace ? (
                  <Crown className="w-4.5 h-4.5 text-warning fill-warning/30 animate-bounce" />
                ) : (
                  <span className="text-xs font-black text-muted-foreground">
                    #{index + 1}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <Avatar index={player.avatar} name={player.name} imageUrl={player.imageUrl} className="w-8 h-8 rounded-full" />

              {/* Name & status */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-semibold text-sm truncate ${
                      isMe ? "text-primary" : "text-foreground/90"
                    }`}
                  >
                    {player.name}
                    {isMe && " (you)"}
                  </span>
                  {player.isHost && (
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1.5 py-0 font-bold text-primary border-primary/30 bg-primary/5 uppercase"
                    >
                      Host
                    </Badge>
                  )}
                </div>
                
                {/* Status Tags */}
                {isDrawer && (
                  <span className="text-[10px] font-bold text-warning flex items-center gap-1 mt-0.5">
                    <Pencil className="w-3 h-3 animate-pulse" /> Drawing...
                  </span>
                )}
                {player.hasGuessedCorrectly &&
                  gamePhase === "drawing" &&
                  !isDrawer && (
                    <span className="text-[10px] font-bold text-success flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Guessed!
                    </span>
                  )}
              </div>

              {/* Score */}
              <div className="text-right">
                <div className="text-sm font-black text-foreground/90">
                  {player.score}
                </div>
                {player.roundScore > 0 && gamePhase === "round-end" && (
                  <div className="text-[10px] text-success font-black tracking-wide animate-pulse">
                    +{player.roundScore}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
