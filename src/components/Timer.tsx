"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TimerProps {
  timeRemaining: number;
  totalTime: number;
  currentWord: string;
  currentRound: number;
  totalRounds: number;
  drawerName: string;
  isDrawer: boolean;
  gamePhase: string;
}

export default function Timer({
  timeRemaining,
  totalTime,
  currentWord,
  currentRound,
  totalRounds,
  drawerName,
  isDrawer,
  gamePhase,
}: TimerProps) {
  const progress = totalTime > 0 ? timeRemaining / totalTime : 0;
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference * (1 - progress);

  // Use CSS variable colors via currentColor trick
  const timerColorClass =
    progress > 0.5
      ? "text-primary"
      : progress > 0.25
        ? "text-warning"
        : "text-destructive";

  return (
    <Card className="flex flex-row items-center gap-4 px-5 py-3">
      {/* Timer Circle */}
      <div className={`relative w-16 h-16 shrink-0 ${timerColorClass}`}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            className="stroke-border"
            strokeWidth="4"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">{timeRemaining}</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="secondary" className="text-xs">
            Round {currentRound}/{totalRounds}
          </Badge>
          {gamePhase === "drawing" && (
            <span className="text-xs text-muted-foreground">
              {isDrawer ? "You are drawing" : `${drawerName} is drawing`}
            </span>
          )}
          {gamePhase === "choosing-word" && (
            <span className="text-xs text-warning">
              {isDrawer ? "Pick a word!" : `${drawerName} is choosing...`}
            </span>
          )}
        </div>

        {/* Word Display */}
        {currentWord && gamePhase === "drawing" && (
          <div className="font-mono text-xl font-bold tracking-[0.3em] text-foreground/90">
            {currentWord}
          </div>
        )}
      </div>
    </Card>
  );
}
