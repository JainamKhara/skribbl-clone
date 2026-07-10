"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Timer } from "lucide-react";

interface WordSelectorProps {
  words: string[];
  timeRemaining: number;
  onChoose: (word: string) => void;
}

export default function WordSelector({
  words,
  timeRemaining,
  onChoose,
}: WordSelectorProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <Card className="max-w-md w-full mx-4 cyber-card border-border/40 animate-fadeIn">
        <CardHeader className="text-center pb-3">
          <CardTitle className="text-2xl font-black bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Choose a Word!
          </CardTitle>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <Badge
              variant="outline"
              className="text-[11px] font-bold px-2 py-0.5 text-warning border-warning/35 bg-warning/5 uppercase tracking-wide flex items-center gap-1"
            >
              <Timer className="w-3.5 h-3.5" /> {timeRemaining}s
            </Badge>
            <span className="text-muted-foreground text-xs font-medium">remaining</span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          {words.map((word) => (
            <Button
              key={word}
              onClick={() => onChoose(word)}
              variant="outline"
              size="lg"
              className="text-base font-bold py-6 hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all border-border/45 rounded-xl"
            >
              {word}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
