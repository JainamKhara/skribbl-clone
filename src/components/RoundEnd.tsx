"use client";

import { Player } from "@/lib/game-logic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RoundEndProps {
  currentWord: string;
  players: Player[];
  timeRemaining: number;
}

export default function RoundEnd({
  currentWord,
  players,
  timeRemaining,
}: RoundEndProps) {
  const scorers = players
    .filter((p) => p.roundScore > 0)
    .sort((a, b) => b.roundScore - a.roundScore);
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

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <Card className="max-w-md w-full mx-4 text-center">
        <CardHeader>
          <CardTitle className="text-muted-foreground text-xl font-bold">
            The word was
          </CardTitle>
          <div className="text-4xl font-black text-primary uppercase tracking-wider mt-2">
            {currentWord}
          </div>
        </CardHeader>

        {scorers.length > 0 && (
          <CardContent className="space-y-2">
            <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
              Points Earned
            </h3>
            {scorers.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-4 py-2 rounded-lg bg-secondary"
              >
                <div className="flex items-center gap-2">
                  <span>{AVATARS[p.avatar % AVATARS.length]}</span>
                  <span className="text-foreground/70 text-sm">{p.name}</span>
                </div>
                <span className="text-success font-bold">+{p.roundScore}</span>
              </div>
            ))}
          </CardContent>
        )}

        <div className="pb-6 text-muted-foreground text-sm">
          Next round in {timeRemaining}s...
        </div>
      </Card>
    </div>
  );
}
