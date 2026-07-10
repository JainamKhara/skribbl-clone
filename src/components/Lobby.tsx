"use client";

import { useState } from "react";
import { Player } from "@/lib/game-logic";
import { GAME_CONFIG } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Users, Gamepad2, Settings, User } from "lucide-react";
import Avatar from "@/components/Avatar";

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-xl animate-fadeIn">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-foreground mb-4 tracking-tight bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
            Game Lobby
          </h1>
          <div className="inline-flex flex-row items-center gap-3 px-5 py-3 rounded-2xl cyber-card cyber-card-glow-primary border-primary/30">
            <span className="text-muted-foreground text-sm font-medium">Room Code:</span>
            <span className="text-2xl font-mono font-black text-primary tracking-widest">
              {roomId}
            </span>
            <Button onClick={copyRoomCode} variant="secondary" size="sm" className="gap-1.5 rounded-lg">
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-success" />
                  <span className="text-success font-semibold text-xs">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-xs">Copy</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Players List Card */}
        <Card className="mb-5 cyber-card border-border/40">
          <CardHeader className="border-b border-border/30 pb-3">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Players ({players.length}/{GAME_CONFIG.MAX_PLAYERS})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/40 border border-border/30 hover:border-primary/20 transition-all"
                >
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/40"
                    />
                  ) : (
                    <Avatar index={p.avatar} name={p.name} className="w-9 h-9" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-foreground font-semibold text-sm truncate">
                        {p.name}
                      </span>
                      {p.isHost && (
                        <Badge
                          variant="outline"
                          className="text-[9px] font-bold px-1.5 py-0 text-primary border-primary/45 bg-primary/5 uppercase tracking-wide"
                        >
                          Host
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {Array.from({
                length: Math.max(0, GAME_CONFIG.MIN_PLAYERS - players.length),
              }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border/60 text-muted-foreground bg-black/10"
                >
                  <span className="w-9 h-9 flex items-center justify-center rounded-full bg-muted/10">
                    <User className="w-4 h-4 text-muted-foreground/40" />
                  </span>
                  <span className="text-sm font-medium text-muted-foreground/60">Waiting...</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Settings — Host Only */}
        {isHost && (
          <Card className="mb-6 cyber-card border-border/40">
            <CardHeader className="border-b border-border/30 pb-3">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                Game Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                    Rounds
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[2, 3, 4, 5].map((r) => (
                      <Button
                        key={r}
                        onClick={() => setRounds(r)}
                        variant={rounds === r ? "default" : "outline"}
                        size="sm"
                        className="w-10 h-8 rounded-lg font-bold"
                      >
                        {r}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                    Draw Time
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[60, 80, 100, 120].map((t) => (
                      <Button
                        key={t}
                        onClick={() => setDrawTime(t)}
                        variant={drawTime === t ? "default" : "outline"}
                        size="sm"
                        className="px-3 h-8 rounded-lg font-bold"
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
            className={`w-full h-12 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
              canStart
                ? "arcade-btn bg-primary text-primary-foreground font-black hover:bg-primary/95 border-2 border-border shadow-[4px_4px_0px_0px_#000] rounded-xl tracking-wider"
                : "bg-muted cursor-not-allowed text-muted-foreground border-2 border-dashed border-border/50"
            }`}
          >
            <Gamepad2 className="w-4 h-4 mr-2" />
            {canStart
              ? `Start Match (${players.length} Players)`
              : `Waiting for ${GAME_CONFIG.MIN_PLAYERS - players.length} more player(s)`}
          </Button>
        )}

        {!isHost && (
          <div className="p-4 rounded-xl bg-secondary/20 border border-border/30 text-center cyber-card">
            <p className="text-muted-foreground text-sm font-medium animate-pulse">
              Waiting for host to start the match...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
