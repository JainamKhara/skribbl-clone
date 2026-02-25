"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <Card className="max-w-md w-full mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Choose a Word!</CardTitle>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge variant="secondary" className="text-warning">
              ⏱ {timeRemaining}s
            </Badge>
            <span className="text-muted-foreground text-sm">remaining</span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {words.map((word) => (
            <Button
              key={word}
              onClick={() => onChoose(word)}
              variant="outline"
              size="lg"
              className="text-lg font-semibold py-6 hover:bg-primary/10 hover:border-primary/50 hover:text-primary"
            >
              {word}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
