"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/lib/game-logic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

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
        return "bg-success/15 text-success border-l-2 border-success";
      case "close":
        return "bg-warning/15 text-warning border-l-2 border-warning";
      case "system":
        return "bg-muted text-muted-foreground italic";
      default:
        return "text-foreground/80";
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
    <Card className="flex flex-col h-full overflow-hidden py-0 gap-0">
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
          Chat
        </CardTitle>
      </CardHeader>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-1.5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`px-3 py-1.5 rounded-lg text-sm ${getMessageStyle(
                msg.type,
              )} animate-slideIn`}
            >
              {msg.type === "system" || msg.type === "correct" ? (
                <span>{msg.text}</span>
              ) : (
                <>
                  <span className="font-semibold text-primary">
                    {msg.playerName}:
                  </span>{" "}
                  <span>{msg.text}</span>
                  {msg.type === "close" && (
                    <span className="ml-2 text-xs text-warning">(close!)</span>
                  )}
                </>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-3 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={getPlaceholder()}
            disabled={isDisabled}
            maxLength={100}
          />
          <Button type="submit" disabled={isDisabled}>
            Send
          </Button>
        </div>
      </form>
    </Card>
  );
}
