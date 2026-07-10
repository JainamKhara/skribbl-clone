"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/lib/game-logic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageSquare } from "lucide-react";

interface ChatProps {
  messages: ChatMessage[];
  onGuess: (text: string) => void;
  isDrawer: boolean;
  hasGuessedCorrectly: boolean;
  gamePhase: string;
}

export default function Chat({
  messages,
  onGuess,
  isDrawer,
  hasGuessedCorrectly,
  gamePhase,
}: ChatProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onGuess(input);
    setInput("");
  };

  const getMessageStyle = (type: ChatMessage["type"]) => {
    switch (type) {
      case "correct":
        return "bg-success/10 text-success border border-success/35 shadow-[0_0_12px_rgba(16,185,129,0.08)] font-semibold";
      case "close":
        return "bg-warning/10 text-warning border border-warning/35 shadow-[0_0_12px_rgba(245,158,11,0.08)] font-semibold";
      case "system":
        return "bg-secondary/40 text-muted-foreground border border-border/30 italic text-xs py-1";
      default:
        return "bg-secondary/20 text-foreground/90 border border-border/20";
    }
  };

  const getPlaceholder = () => {
    if (gamePhase !== "drawing") return "Waiting...";
    if (isDrawer) return "You are drawing!";
    if (hasGuessedCorrectly) return "You guessed it! 🎉";
    return "Type your guess...";
  };

  const isDisabled = isDrawer || hasGuessedCorrectly || gamePhase !== "drawing";

  return (
    <Card className="flex flex-col h-full overflow-hidden py-0 gap-0 cyber-card border-border/40">
      <CardHeader className="px-4 py-3 border-b border-border/30">
        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-primary" />
          Chat Feed
        </CardTitle>
      </CardHeader>

      <ScrollArea className="flex-1 min-h-0 bg-black/10">
        <div className="p-3 space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`px-3 py-2 rounded-xl text-sm ${getMessageStyle(
                msg.type,
              )} animate-slideIn`}
            >
              {msg.type === "system" || msg.type === "correct" ? (
                <span>{msg.text}</span>
              ) : (
                <div className="flex flex-wrap gap-x-1.5 items-baseline">
                  <span className="font-bold text-primary text-xs tracking-wide">
                    {msg.playerName}:
                  </span>
                  <span className="break-all">{msg.text}</span>
                  {msg.type === "close" && (
                    <span className="text-[10px] font-extrabold text-warning animate-pulse uppercase tracking-wider ml-1">
                      (close!)
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-3 border-t border-border/30 bg-card/40">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={getPlaceholder()}
            disabled={isDisabled}
            maxLength={100}
            className="h-10 bg-black/25 border-border/30 focus-visible:ring-primary/45 rounded-lg text-sm"
          />
          <Button
            type="submit"
            disabled={isDisabled}
            size="icon"
            className="h-10 w-10 shrink-0 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_12px_rgba(168,85,247,0.2)]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
}
