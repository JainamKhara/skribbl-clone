"use client";

import { useState } from "react";
import { Player } from "@/lib/game-logic";
import { GAME_CONFIG } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LobbyProps {
  roomId: string;
  players: Player[];
  isHost: boolean;
  onStartGame: (rounds: number, drawTime: number) => void;
}

export default function Lobby({
  roomId,
  players,
  isHost,
  onStartGame,
}: LobbyProps) {
  const [rounds, setRounds] = useState<number>(GAME_CONFIG.DEFAULT_ROUNDS);
  const [drawTime, setDrawTime] = useState<number>(
    GAME_CONFIG.DEFAULT_DRAW_TIME,
  );
  const [copied, setCopied] = useState(false);

  const copyRoomCode = async () => {
    await navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canStart = players.length >= GAME_CONFIG.MIN_PLAYERS;

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Waiting for Players
          </h1>
          <Card className="inline-flex flex-row items-center gap-3 px-5 py-3">
            <span className="text-muted-foreground text-sm">Room Code:</span>
            <span className="text-xl font-mono font-bold text-primary tracking-widest">
              {roomId}
            </span>
            <Button onClick={copyRoomCode} variant="secondary" size="sm">
              {copied ? "✅ Copied!" : "📋 Copy"}
            </Button>
          </Card>
        </div>

        {/* Players */}
        <Card className="mb-5">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
              Players ({players.length}/{GAME_CONFIG.MAX_PLAYERS})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary"
                >
                  <span className="text-2xl">
                    {AVATARS[p.avatar % AVATARS.length]}
                  </span>
                  <div>
                    <span className="text-foreground/80 font-medium text-sm">
                      {p.name}
                    </span>
                    {p.isHost && (
                      <Badge
                        variant="outline"
                        className="ml-2 text-[10px] text-primary border-primary/40"
                      >
                        Host
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {Array.from({
                length: Math.max(0, GAME_CONFIG.MIN_PLAYERS - players.length),
              }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-border text-muted-foreground"
                >
                  <span className="text-2xl">❓</span>
                  <span className="text-sm">Waiting...</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Settings — Host Only */}
        {isHost && (
          <Card className="mb-5">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
                Game Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Rounds
                  </label>
                  <div className="flex items-center gap-2">
                    {[2, 3, 4, 5].map((r) => (
                      <Button
                        key={r}
                        onClick={() => setRounds(r)}
                        variant={rounds === r ? "default" : "outline"}
                        size="sm"
                      >
                        {r}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Draw Time
                  </label>
                  <div className="flex items-center gap-2">
                    {[60, 80, 100, 120].map((t) => (
                      <Button
                        key={t}
                        onClick={() => setDrawTime(t)}
                        variant={drawTime === t ? "default" : "outline"}
                        size="sm"
                      >
                        {t}s
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Start Button */}
        {isHost && (
          <Button
            onClick={() => onStartGame(rounds, drawTime)}
            disabled={!canStart}
            className="w-full"
            size="lg"
          >
            {canStart
              ? `Start Game (${players.length} players)`
              : `Need ${GAME_CONFIG.MIN_PLAYERS - players.length} more player(s)`}
          </Button>
        )}

        {!isHost && (
          <p className="text-center text-muted-foreground text-sm">
            Waiting for the host to start the game...
          </p>
        )}
      </div>
    </div>
  );
}
