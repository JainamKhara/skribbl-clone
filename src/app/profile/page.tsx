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
import { Trophy, Gamepad2, Target, ArrowLeft, Calendar, User, Clock, Crown, Medal, Star, Users } from "lucide-react";
import Avatar from "@/components/Avatar";

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
      <div className="flex items-center justify-between mb-8">
        <Button variant="outline" className="arcade-btn" onClick={() => router.push("/")}>
          <ArrowLeft className="size-4 mr-2" /> Back to Game
        </Button>
        <div className="flex items-center gap-4">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {/* Profile Card */}
      <Card className="cyber-card mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left mb-6">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={profile.username}
                className="w-20 h-20 rounded-full object-cover ring-2 ring-primary/40 shadow-md border-2"
              />
            ) : (
              <Avatar index={profile.avatar_index} name={profile.username} className="w-20 h-20 shadow-md border-2" />
            )}
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-foreground tracking-wide uppercase flex items-center justify-center sm:justify-start gap-2">
                <User className="w-6 h-6 text-primary shrink-0" />
                {profile.username}
              </h1>
              <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Member since {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <Separator className="mb-6 bg-border/25" />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs uppercase font-bold tracking-wider">
                <Gamepad2 className="size-3 text-secondary-foreground" /> Games
              </div>
              <div className="text-3xl font-black text-foreground">
                {profile.games_played}
              </div>
            </div>
            <div className="space-y-1 border-x border-border/25">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs uppercase font-bold tracking-wider">
                <Trophy className="size-3 text-primary" /> Wins
              </div>
              <div className="text-3xl font-black text-primary">
                {profile.games_won}
              </div>
              <div className="text-[10px] text-muted-foreground font-semibold">
                {winRate}% win rate
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs uppercase font-bold tracking-wider">
                <Target className="size-3 text-success" /> Score
              </div>
              <div className="text-3xl font-black text-foreground">
                {profile.total_score.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game History */}
      <div className="mb-4">
        <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Recent Games
        </h2>

        {history.length === 0 ? (
          <Card className="cyber-card">
            <CardContent className="py-10 text-center text-muted-foreground text-sm font-medium">
              No games played yet. Start playing to see your history!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((game) => (
              <Card key={game.id} className="cyber-card bg-card/60 hover:bg-card transition-colors">
                <CardContent className="py-4">
                  {/* Game Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Badge
                        className={`text-xs font-black px-2.5 py-1 ${
                          game.isWinner
                            ? "bg-success text-success-foreground border-success/35"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {game.isWinner ? <Crown className="w-3 h-3 mr-1" /> : "#"}{game.rank}
                      </Badge>
                      <div>
                        <div className="text-lg font-bold text-foreground flex items-center gap-2">
                          Room: {game.room_id}
                          {game.isWinner && <Star className="w-4 h-4 text-yellow-400" />}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {game.total_rounds} rounds · {game.player_count} players · {game.draw_time}s draw time
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-muted-foreground">
                      {new Date(game.played_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Winner Info */}
                  <div className="mb-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span className="text-sm font-bold text-foreground">
                        Winner: {game.winnerName} - {game.winnerScore} pts
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Your score: {game.score} pts
                    </div>
                  </div>

                  {/* Your Performance */}
                  <div className="mb-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Your Performance
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 rounded-lg bg-secondary/20 border border-border/25">
                        <div className="text-lg font-bold text-primary">{game.score}</div>
                        <div className="text-xs text-muted-foreground">Points Scored</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-secondary/20 border border-border/25">
                        <div className="text-lg font-bold text-success">{game.rank}</div>
                        <div className="text-xs text-muted-foreground">Final Rank</div>
                      </div>
                    </div>
                  </div>

                  {/* All Participants */}
                  <div className="mb-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      All Players ({game.participants.length})
                    </h3>
                    <div className="space-y-1">
                      {game.participants.map((participant, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                            participant.rank === 1 
                              ? "bg-primary/10 border border-primary/30"
                              : "bg-secondary/20 border border-border/20"
                          }`}
                        >
                          <Badge 
                            className={`text-[10px] font-bold px-1.5 py-0.5 ${
                              participant.rank === 1 
                                ? "bg-primary text-primary-foreground"
                                : participant.userId === user?.id
                                  ? "bg-secondary text-secondary-foreground"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            #{participant.rank}
                          </Badge>
                          <span className="flex-1 font-semibold text-foreground">
                            {participant.playerName}
                            {participant.isHost && " (Host)"}
                          </span>
                          <span className="font-bold text-primary">{participant.score} pts</span>
                          <span className="text-muted-foreground text-[10px]">
                            {participant.wordsGuessed} guessed · {participant.roundsWon} rounds won
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Round Details - Expandable */}
                  {game.rounds.length > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 hover:text-primary transition-colors">
                        Round-by-Round Details ({game.rounds.length} rounds)
                      </summary>
                      <div className="mt-2 space-y-2">
                        {game.rounds.map((round, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-secondary/10 border border-border/20 text-xs">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-foreground">
                                Round {round.roundNumber}
                              </span>
                              <span className="text-muted-foreground">
                                Word: <span className="font-semibold text-primary">{round.word}</span>
                              </span>
                              <span className="text-muted-foreground">
                                Drawer: {round.drawerName}
                              </span>
                            </div>
                            {round.guessers.length > 0 && (
                              <div className="mt-1 space-y-1">
                                <div className="text-muted-foreground text-[10px] mb-1">
                                  Guessers ({round.guessers.length}):
                                </div>
                                {round.guessers.map((guesser, gIdx) => (
                                  <div key={gIdx} className="flex items-center gap-2 text-[10px] text-muted-foreground pl-2">
                                    <span className="text-foreground">{guesser.playerName}</span>
                                    <span className="text-success">+{guesser.pointsEarned} pts</span>
                                    <span>{guesser.timeToGuess}s remaining</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {round.guessers.length === 0 && (
                              <div className="text-[10px] text-muted-foreground/60 mt-1">
                                No one guessed the word
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
