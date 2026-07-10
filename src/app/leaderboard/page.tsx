"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLeaderboard, LeaderboardEntry } from "@/lib/auth";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, Trophy, Crown, Medal } from "lucide-react";
import Avatar from "@/components/Avatar";

const MEDAL_COLORS = ["text-yellow-400", "text-slate-300", "text-amber-600"];

export default function LeaderboardPage() {
  const router = useRouter();
  const { user } = useUser();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard().then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.push("/")}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Leaderboard</h1>
        </div>
        <div className="w-20" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Trophy className="size-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No players on the leaderboard yet.</p>
            <p className="text-xs mt-1">Play some games to get ranked!</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Top 3 Podium */}
          {entries.length >= 3 && (
            <div className="flex justify-center items-end gap-3 mb-8">
              {[1, 0, 2].map((idx) => {
                const entry = entries[idx];
                if (!entry) return null;
                const heights = ["h-32", "h-24", "h-20"];
                return (
                  <div key={entry.id} className="flex flex-col items-center">
                    <Avatar index={entry.avatar_index} name={entry.username} className="w-12 h-12 mb-1" />
                    <span className="text-xs font-medium text-foreground/80 truncate max-w-[90px] mb-1">
                      {entry.username}
                    </span>
                    <div
                      className={`w-24 ${heights[idx]} rounded-t-xl border border-b-0 flex flex-col items-center justify-center ${
                        idx === 0
                          ? "bg-primary/15 border-primary/30"
                          : idx === 1
                            ? "bg-muted border-border"
                            : "bg-warning/15 border-warning/30"
                      }`}
                    >
                      <Medal className={`w-6 h-6 mb-1 ${
                        idx === 0 ? "text-yellow-400" :
                        idx === 1 ? "text-slate-300" : "text-amber-600"
                      }`} />
                      <span className="text-lg font-bold text-foreground">
                        {entry.total_score.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {entry.games_won}W / {entry.games_played}G
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full list */}
          <div className="space-y-2">
            {entries.map((entry) => {
              const isMe = user && user.id === entry.id;
              const winRate =
                entry.games_played > 0
                  ? Math.round((entry.games_won / entry.games_played) * 100)
                  : 0;

              return (
                <Card
                  key={entry.id}
                  className={isMe ? "border-primary/50 bg-primary/5" : ""}
                >
                  <CardContent className="py-3 flex items-center gap-3">
                    {/* Rank */}
                    <div className="w-8 text-center">
                      {entry.rank <= 3 ? (
                        <Medal className={`w-5 h-5 ${MEDAL_COLORS[entry.rank - 1]}`} />
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">
                          {entry.rank}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <Avatar index={entry.avatar_index} name={entry.username} className="w-8 h-8" />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">
                          {entry.username}
                        </span>
                        {isMe && (
                          <Badge variant="secondary" className="text-[10px]">
                            You
                          </Badge>
                        )}
                        {entry.rank === 1 && (
                          <Crown className="size-3 text-primary" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {entry.games_played} games · {entry.games_won} wins ·{" "}
                        {winRate}%
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className="font-bold text-foreground">
                        {entry.total_score.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        points
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
