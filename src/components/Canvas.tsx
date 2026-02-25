"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { CANVAS_CONFIG, COLORS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

interface DrawEvent {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: string;
  size: number;
  tool: "pen" | "eraser";
  isStart: boolean;
}

interface CanvasProps {
  isDrawer: boolean;
  registerDrawListener: (listener: (event: DrawEvent) => void) => () => void;
  clearFlag: number;
  fillEvent: { color: string } | null;
  undoFlag: number;
  onDraw: (event: DrawEvent) => void;
  onClear: () => void;
  onFill: (color: string) => void;
  onUndo: () => void;
}

export default function Canvas({
  isDrawer,
  registerDrawListener,
  clearFlag,
  fillEvent,
  undoFlag,
  onDraw,
  onClear,
  onFill,
  onUndo,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const historyRef = useRef<ImageData[]>([]);
  const [color, setColor] = useState<string>(CANVAS_CONFIG.DEFAULT_COLOR);
  const [brushSize, setBrushSize] = useState<number>(
    CANVAS_CONFIG.DEFAULT_BRUSH_SIZE,
  );
  const [tool, setTool] = useState<"pen" | "eraser" | "fill">("pen");

  const getCanvasSize = useCallback(() => {
    return { width: 800, height: 600 };
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const { width, height } = getCanvasSize();
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = CANVAS_CONFIG.CANVAS_BG;
      ctx.fillRect(0, 0, width, height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, [getCanvasSize]);

  useEffect(() => {
    resizeCanvas();
  }, [resizeCanvas]);

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current.push(data);
    if (historyRef.current.length > 30) historyRef.current.shift();
  }, []);

  const drawLine = useCallback(
    (
      x: number,
      y: number,
      prevX: number,
      prevY: number,
      strokeColor: string,
      size: number,
      drawTool: "pen" | "eraser",
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(x, y);
      ctx.strokeStyle =
        drawTool === "eraser" ? CANVAS_CONFIG.CANVAS_BG : strokeColor;
      ctx.lineWidth = drawTool === "eraser" ? size * 3 : size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    },
    [],
  );

  // Register callback for remote draw events — bypasses React state entirely
  useEffect(() => {
    const unsubscribe = registerDrawListener((event: DrawEvent) => {
      drawLine(
        event.x,
        event.y,
        event.prevX,
        event.prevY,
        event.color,
        event.size,
        event.tool,
      );
    });
    return unsubscribe;
  }, [registerDrawListener, drawLine]);

  // Handle clear
  useEffect(() => {
    if (clearFlag === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = CANVAS_CONFIG.CANVAS_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    historyRef.current = [];
  }, [clearFlag]);

  // Handle fill
  useEffect(() => {
    if (!fillEvent) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = fillEvent.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [fillEvent]);

  // Handle undo
  useEffect(() => {
    if (undoFlag === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (historyRef.current.length > 0) {
      const data = historyRef.current.pop()!;
      ctx.putImageData(data, 0, 0);
    }
  }, [undoFlag]);

  const getPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const { width } = getCanvasSize();
      const scale = width / rect.width;

      if ("touches" in e) {
        const touch = e.touches[0];
        return {
          x: (touch.clientX - rect.left) * scale,
          y: (touch.clientY - rect.top) * scale,
        };
      }
      return {
        x: (e.clientX - rect.left) * scale,
        y: (e.clientY - rect.top) * scale,
      };
    },
    [getCanvasSize],
  );

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawer) return;
      e.preventDefault();

      if (tool === "fill") {
        onFill(color);
        return;
      }

      saveHistory();
      isDrawing.current = true;
      const pos = getPos(e);
      lastPos.current = pos;

      const event: DrawEvent = {
        x: pos.x,
        y: pos.y,
        prevX: pos.x,
        prevY: pos.y,
        color,
        size: brushSize,
        tool: tool === "eraser" ? "eraser" : "pen",
        isStart: true,
      };
      drawLine(
        pos.x,
        pos.y,
        pos.x,
        pos.y,
        color,
        brushSize,
        tool === "eraser" ? "eraser" : "pen",
      );
      onDraw(event);
    },
    [
      isDrawer,
      tool,
      color,
      brushSize,
      getPos,
      drawLine,
      onDraw,
      onFill,
      saveHistory,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawer || !isDrawing.current) return;
      e.preventDefault();
      const pos = getPos(e);

      const event: DrawEvent = {
        x: pos.x,
        y: pos.y,
        prevX: lastPos.current.x,
        prevY: lastPos.current.y,
        color,
        size: brushSize,
        tool: tool === "eraser" ? "eraser" : "pen",
        isStart: false,
      };
      drawLine(
        pos.x,
        pos.y,
        lastPos.current.x,
        lastPos.current.y,
        color,
        brushSize,
        tool === "eraser" ? "eraser" : "pen",
      );
      onDraw(event);
      lastPos.current = pos;
    },
    [isDrawer, getPos, color, brushSize, tool, drawLine, onDraw],
  );

  const handlePointerUp = useCallback(() => {
    isDrawing.current = false;
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden shadow-2xl border border-white/10"
      >
        <canvas
          ref={canvasRef}
          className="w-full aspect-[4/3] touch-none"
          style={{
            cursor: isDrawer
              ? tool === "fill"
                ? "crosshair"
                : "crosshair"
              : "default",
          }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
        {!isDrawer && (
          <div
            className="absolute inset-0 z-10"
            style={{ pointerEvents: "auto" }}
          />
        )}
      </div>

      {/* Toolbar — show only for drawer */}
      {isDrawer && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-card border">
          {/* Colors */}
          <div className="flex flex-wrap gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setTool("pen");
                }}
                className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-110 ${
                  color === c && tool === "pen"
                    ? "border-primary shadow-[0_0_8px] shadow-primary/50"
                    : "border-border"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Brush Size */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Size</span>
            <Slider
              min={CANVAS_CONFIG.MIN_BRUSH_SIZE}
              max={CANVAS_CONFIG.MAX_BRUSH_SIZE}
              value={[brushSize]}
              onValueChange={(v) => setBrushSize(v[0])}
              className="w-24"
            />
            <span className="text-xs text-muted-foreground w-6 text-center">
              {brushSize}
            </span>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Tools */}
          <div className="flex gap-1.5">
            <Button
              onClick={() => setTool("pen")}
              variant={tool === "pen" ? "default" : "outline"}
              size="sm"
            >
              ✏️ Pen
            </Button>
            <Button
              onClick={() => setTool("eraser")}
              variant={tool === "eraser" ? "default" : "outline"}
              size="sm"
            >
              🧹 Eraser
            </Button>
            <Button
              onClick={() => setTool("fill")}
              variant={tool === "fill" ? "default" : "outline"}
              size="sm"
            >
              🪣 Fill
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Actions */}
          <div className="flex gap-1.5">
            <Button onClick={onUndo} variant="outline" size="sm">
              ↩️ Undo
            </Button>
            <Button onClick={onClear} variant="destructive" size="sm">
              🗑️ Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
