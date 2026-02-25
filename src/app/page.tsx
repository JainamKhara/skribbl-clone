"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useUser, UserButton } from "@clerk/nextjs";
import { Trophy, LogIn } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { isSignedIn, user, isLoaded } = useUser();
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [mode, setMode] = useState<"home" | "join">("home");

  // Pre-fill nickname from Clerk user
  useEffect(() => {
    if (isSignedIn && user && !nickname) {
      setNickname(
        user.firstName ||
          user.username ||
          user.emailAddresses[0]?.emailAddress?.split("@")[0] ||
          "",
      );
    }
  }, [isSignedIn, user, nickname]);

  const generateRoomId = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let id = "";
    for (let i = 0; i < 6; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  };

  const handleCreateRoom = () => {
    if (!nickname.trim()) return;
    const roomId = generateRoomId();
    router.push(
      `/room/${roomId}?name=${encodeURIComponent(nickname.trim())}&create=true`,
    );
  };

  const handleJoinRoom = () => {
    if (!nickname.trim() || !roomCode.trim()) return;
    router.push(
      `/room/${roomCode.trim().toUpperCase()}?name=${encodeURIComponent(
        nickname.trim(),
      )}`,
    );
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-primary mb-2">Skribbl</h1>
          <p className="text-muted-foreground text-sm">Draw · Guess · Win</p>
        </div>

        {/* Auth bar */}
        {isLoaded && (
          <div className="flex items-center justify-center gap-3 mb-6">
            {isSignedIn ? (
              <>
                <UserButton afterSignOutUrl="/" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/profile")}
                >
                  Profile
                </Button>
                <span className="text-border">|</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/leaderboard")}
                  className="gap-2"
                >
                  <Trophy className="size-4" />
                  Leaderboard
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/login")}
                  className="gap-2"
                >
                  <LogIn className="size-4" />
                  Sign In
                </Button>
                <span className="text-border">|</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/leaderboard")}
                  className="gap-2"
                >
                  <Trophy className="size-4" />
                  Leaderboard
                </Button>
              </>
            )}
          </div>
        )}

        {/* Card */}
        <Card>
          <CardContent className="pt-6">
            {/* Nickname */}
            <div className="mb-5">
              <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Your Name
              </label>
              {isSignedIn ? (
                <div className="flex items-center gap-3">
                  {user?.imageUrl && (
                    <img
                      src={user.imageUrl}
                      alt={nickname}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/30 shrink-0"
                    />
                  )}
                  <Input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Enter your nickname..."
                    maxLength={20}
                  />
                </div>
              ) : (
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter your nickname..."
                  maxLength={20}
                />
              )}
            </div>

            {mode === "home" ? (
              <>
                <Button
                  onClick={handleCreateRoom}
                  disabled={!nickname.trim()}
                  className="w-full mb-3"
                  size="lg"
                >
                  Create Room
                </Button>

                <div className="flex items-center gap-4 my-4">
                  <Separator className="flex-1" />
                  <span className="text-muted-foreground text-xs uppercase">
                    or
                  </span>
                  <Separator className="flex-1" />
                </div>

                <Button
                  onClick={() => setMode("join")}
                  disabled={!nickname.trim()}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Join Room
                </Button>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Room Code
                  </label>
                  <Input
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-letter code..."
                    maxLength={6}
                    className="text-center font-mono text-2xl tracking-[0.5em] placeholder:text-sm placeholder:tracking-normal"
                  />
                </div>

                <Button
                  onClick={handleJoinRoom}
                  disabled={!nickname.trim() || roomCode.length < 4}
                  className="w-full mb-3"
                  size="lg"
                >
                  Join Game
                </Button>

                <Button
                  onClick={() => setMode("home")}
                  variant="ghost"
                  className="w-full text-muted-foreground"
                >
                  ← Back
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
