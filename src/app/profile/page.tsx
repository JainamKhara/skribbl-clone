"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useUser, UserButton } from "@clerk/nextjs";
import {
  getOrCreateProfile,
  getUserGameHistory,
  GameHistoryEntry,
  Profile,
} from "@/lib/auth";
import { Trophy, Gamepad2, Target, ArrowLeft } from "lucide-react";

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

export default function ProfilePage() {
  const router = useRouter();
  const { isSignedIn, user, isLoaded } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/login");
      return;
    }

    if (isSignedIn && user) {
      const username =
        user.firstName ||
        user.username ||
        user.emailAddresses[0]?.emailAddress?.split("@")[0] ||
        "Player";

      getOrCreateProfile(user.id, username).then((p) => {
        setProfile(p);
        setLoading(false);
      });

      getUserGameHistory(user.id).then(setHistory);
    }
  }, [isSignedIn, user, isLoaded, router]);

  if (!isLoaded || loading || !profile) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </main>
    );
  }

  const winRate =
    profile.games_played > 0
      ? Math.round((profile.games_won / profile.games_played) * 100)
      : 0;

  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.push("/")}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <UserButton afterSignOutUrl="/" />
      </div>

      {/* Profile card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="text-5xl">
              {AVATARS[profile.avatar_index % AVATARS.length]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {profile.username}
              </h1>
              <p className="text-sm text-muted-foreground">
                Member since {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                <Gamepad2 className="size-3" /> Games
              </div>
              <div className="text-2xl font-bold text-foreground">
                {profile.games_played}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                <Trophy className="size-3" /> Wins
              </div>
              <div className="text-2xl font-bold text-primary">
                {profile.games_won}
              </div>
              <div className="text-xs text-muted-foreground">
                {winRate}% rate
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                <Target className="size-3" /> Score
              </div>
              <div className="text-2xl font-bold text-foreground">
                {profile.total_score.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game History */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Recent Games
        </h2>

        {history.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              No games played yet. Start playing to see your history!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {history.map((game) => (
              <Card key={game.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={game.rank === 1 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      #{game.rank}
                    </Badge>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {game.score} pts
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {game.total_rounds} rounds · {game.player_count} players
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(game.played_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
