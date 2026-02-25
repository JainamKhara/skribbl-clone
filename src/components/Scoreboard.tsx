"use client";

import { Player, getPlayerRankings } from "@/lib/game-logic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ScoreboardProps {
  players: Player[];
  currentDrawerIndex: number;
  myPlayerId: string;
  gamePhase: string;
}

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

export default function Scoreboard({
  players,
  currentDrawerIndex,
  myPlayerId,
  gamePhase,
}: ScoreboardProps) {
  const ranked =
    gamePhase === "game-over" ? getPlayerRankings(players) : players;

  return (
    <Card className="py-0 gap-0">
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
          Players
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 space-y-1">
        {ranked.map((player, index) => {
          const isDrawer =
            gamePhase !== "waiting" &&
            gamePhase !== "game-over" &&
            players[currentDrawerIndex]?.id === player.id;
          const isMe = player.id === myPlayerId;
          const rank = getPlayerRankings(players).findIndex(
            (p) => p.id === player.id,
          );

          return (
            <div
              key={player.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isMe
                  ? "bg-primary/10 border border-primary/25"
                  : "bg-secondary/50 hover:bg-secondary"
              } ${isDrawer ? "ring-1 ring-warning/50" : ""}`}
            >
              {/* Rank */}
              <span className="text-xs font-bold text-muted-foreground w-4 text-center">
                {rank === 0 && players.some((p) => p.score > 0)
                  ? "👑"
                  : `#${index + 1}`}
              </span>

              {/* Avatar */}
              {player.imageUrl ? (
                <img
                  src={player.imageUrl}
                  alt={player.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-primary/30"
                />
              ) : (
                <span className="text-xl">
                  {AVATARS[player.avatar % AVATARS.length]}
                </span>
              )}

              {/* Name & status */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium text-sm truncate ${
                      isMe ? "text-primary" : "text-foreground/80"
                    }`}
                  >
                    {player.name}
                    {isMe && " (you)"}
                  </span>
                  {player.isHost && (
                    <Badge
                      variant="outline"
                      className="text-[10px] text-primary border-primary/40"
                    >
                      Host
                    </Badge>
                  )}
                </div>
                {isDrawer && (
                  <span className="text-[10px] text-warning">
                    ✏️ Drawing...
                  </span>
                )}
                {player.hasGuessedCorrectly &&
                  gamePhase === "drawing" &&
                  !isDrawer && (
                    <span className="text-[10px] text-success">
                      ✅ Guessed!
                    </span>
                  )}
              </div>

              {/* Score */}
              <div className="text-right">
                <div className="text-sm font-bold text-foreground/90">
                  {player.score}
                </div>
                {player.roundScore > 0 && gamePhase === "round-end" && (
                  <div className="text-[10px] text-success font-semibold">
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
