"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

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

  const timerColorClass =
    progress > 0.5
      ? "text-primary"
      : progress > 0.25
        ? "text-warning"
        : "text-destructive animate-pulse";

  return (
    <Card className="flex flex-row items-center gap-4 px-5 py-3.5 cyber-card border-border/40">
      {/* Timer Circle */}
      <div className={`relative w-14 h-14 shrink-0 ${timerColorClass}`}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            className="stroke-border/40"
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
          <span className="text-base font-black tracking-tight">{timeRemaining}</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <Badge
            variant="outline"
            className="text-[10px] font-bold px-2 py-0.5 text-primary border-primary/35 bg-primary/5 uppercase tracking-wide"
          >
            Round {currentRound}/{totalRounds}
          </Badge>
          {gamePhase === "drawing" && (
            <span className="text-xs font-semibold text-muted-foreground">
              {isDrawer ? "You are drawing" : `${drawerName} is drawing`}
            </span>
          )}
          {gamePhase === "choosing-word" && (
            <span className="text-xs font-semibold text-warning">
              {isDrawer ? "Choose a word!" : `${drawerName} is choosing...`}
            </span>
          )}
        </div>

        {/* Word Display */}
        {currentWord && gamePhase === "drawing" && (
          <div className="font-mono text-2xl font-black tracking-[0.25em] text-foreground bg-black/15 px-3 py-1 rounded-lg inline-block border border-border/20">
            {currentWord}
          </div>
        )}
      </div>
    </Card>
  );
}
