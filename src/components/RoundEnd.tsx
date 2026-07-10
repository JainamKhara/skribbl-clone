"use client";

import { Player } from "@/lib/game-logic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timer, CheckCircle } from "lucide-react";
import Avatar from "@/components/Avatar";

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

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <Card className="max-w-md w-full mx-4 text-center cyber-card border-border/40 animate-fadeIn">
        <CardHeader className="border-b border-border/25 pb-4">
          <CardTitle className="text-muted-foreground text-sm font-bold uppercase tracking-widest">
            The word was
          </CardTitle>
          <div className="text-4xl font-black text-primary uppercase tracking-widest mt-2 bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
            {currentWord}
          </div>
        </CardHeader>

        {scorers.length > 0 ? (
          <CardContent className="py-4 space-y-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center justify-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-success" />
              Points Earned
            </h3>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto scrollbar-thin pr-1">
              {scorers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-secondary/35 border border-border/25 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Avatar index={p.avatar} name={p.name} className="w-7 h-7" />
                    <span className="text-foreground/80 font-semibold text-sm">{p.name}</span>
                  </div>
                  <span className="text-success font-black text-sm">+{p.roundScore}</span>
                </div>
              ))}
            </div>
          </CardContent>
        ) : (
          <CardContent className="py-6">
            <p className="text-muted-foreground text-sm font-medium italic">Nobody guessed the word this round!</p>
          </CardContent>
        )}

        <div className="pb-5 pt-2 text-muted-foreground text-xs font-semibold flex items-center justify-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-primary animate-pulse" />
          Next round in {timeRemaining}s...
        </div>
      </Card>
    </div>
  );
}
