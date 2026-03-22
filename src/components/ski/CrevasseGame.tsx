"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { usePlayer } from "@/lib/player-context";

// ─── Constants ──────────────────────────────────────────────────────────────
const W = 375;
const H = 500;
const GROUND_Y = 400;
const SKIER_X = 80;
const GRAVITY = 0.45;
const JUMP_VY = -10;
const MAX_LIVES = 3;
const BASE_SPEED = 3.5;

// ─── Types ───────────────────────────────────────────────────────────────────
interface Crevasse {
  startX: number; // world X
  width: number;
}

interface GameState {
  phase: "ready" | "playing" | "dead" | "gameover";
  camX: number;
  speed: number;
  skierY: number;
  vy: number;
  onGround: boolean;
  lives: number;
  score: number;
  invincible: number; // frames of invincibility remaining
  crevasses: Crevasse[];
  nextCrevasseX: number;
  deathFlash: number;
}

function makeInitState(): GameState {
  return {
    phase: "ready",
    camX: 0,
    speed: BASE_SPEED,
    skierY: GROUND_Y,
    vy: 0,
    onGround: true,
    lives: MAX_LIVES,
    score: 0,
    invincible: 0,
    crevasses: [],
    nextCrevasseX: 550,
    deathFlash: 0,
  };
}

export function CrevasseGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(makeInitState());
  const rafRef = useRef<number>(0);
  const [displayState, setDisplayState] = useState<{
    phase: GameState["phase"];
    lives: number;
    score: number;
  }>({ phase: "ready", lives: MAX_LIVES, score: 0 });
  const [scale, setScale] = useState(1);
  const { player } = usePlayer();

  // Scale canvas to fit available screen
  useEffect(() => {
    const calc = () => {
      const availH = window.innerHeight - 56 - 72;
      const s = Math.min(1, availH / H, window.innerWidth / W);
      setScale(s);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  // ─── Draw ─────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;

    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#0F1923");
    sky.addColorStop(1, "#1A3550");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    const starSeeds = [17, 53, 89, 137, 211, 293, 349, 421, 503, 577];
    for (const seed of starSeeds) {
      const sx = ((seed * 37 + 13) % W);
      const sy = ((seed * 19 + 7) % (GROUND_Y - 40));
      ctx.beginPath();
      ctx.arc(sx, sy, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mountains silhouette
    ctx.fillStyle = "#0F2535";
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(50, GROUND_Y - 80);
    ctx.lineTo(120, GROUND_Y - 140);
    ctx.lineTo(200, GROUND_Y - 60);
    ctx.lineTo(260, GROUND_Y - 120);
    ctx.lineTo(375, GROUND_Y - 50);
    ctx.lineTo(375, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // Ground segments (left and right of each crevasse)
    // Draw ground from camX perspective
    const groundColor = "#D8EEF4";
    const groundShadow = "#8BBFD4";

    // Draw solid ground before first crevasse and after each crevasse
    const drawGroundSegment = (startWorldX: number, endWorldX: number) => {
      const screenStart = startWorldX - s.camX;
      const screenEnd = endWorldX - s.camX;
      if (screenEnd < 0 || screenStart > W) return;

      const x = Math.max(0, screenStart);
      const w = Math.min(W, screenEnd) - x;
      if (w <= 0) return;

      // Ground surface
      ctx.fillStyle = groundColor;
      ctx.fillRect(x, GROUND_Y, w, H - GROUND_Y);
      // Top edge highlight
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(x, GROUND_Y, w, 4);
      // Side shadow for cliffs
      if (screenStart > 0) {
        ctx.fillStyle = groundShadow;
        ctx.fillRect(x, GROUND_Y, 3, H - GROUND_Y);
      }
    };

    // Draw from 0 to first crevasse
    let prevEnd = 0;
    for (const cr of s.crevasses) {
      drawGroundSegment(prevEnd, cr.startX);
      prevEnd = cr.startX + cr.width;
    }
    drawGroundSegment(prevEnd, s.camX + W + 100);

    // Crevasse darkness (the gaps)
    for (const cr of s.crevasses) {
      const sx = cr.startX - s.camX;
      const sw = cr.width;
      if (sx + sw < 0 || sx > W) continue;
      const x = Math.max(0, sx);
      const w2 = Math.min(W, sx + sw) - x;
      if (w2 <= 0) continue;
      const grad = ctx.createLinearGradient(x, GROUND_Y, x, H);
      grad.addColorStop(0, "#0A1520");
      grad.addColorStop(1, "#000810");
      ctx.fillStyle = grad;
      ctx.fillRect(x, GROUND_Y + 4, w2, H - GROUND_Y);
      // Jagged edges hint
      ctx.strokeStyle = "#1A2B3C";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 4);
      for (let i = 0; i < w2; i += 8) {
        ctx.lineTo(x + i + 4, GROUND_Y + 10 + (i % 3 === 0 ? 6 : 2));
        ctx.lineTo(x + i + 8, GROUND_Y + 4);
      }
      ctx.stroke();
    }

    // Skier
    const skierScreenX = SKIER_X;
    const skierScreenY = s.skierY;
    const visible = s.invincible === 0 || Math.floor(s.invincible / 4) % 2 === 0;
    if (visible) {
      const angle = s.vy < -2 ? -0.3 : s.vy > 2 ? 0.2 : 0;
      ctx.save();
      ctx.translate(skierScreenX, skierScreenY);
      ctx.rotate(angle);
      ctx.font = "32px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("🎿", 0, 0);
      ctx.restore();
    }

    // Death flash
    if (s.deathFlash > 0) {
      ctx.fillStyle = `rgba(255,50,50,${s.deathFlash / 20 * 0.4})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Score label
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(`${s.score} ⚡`, W - 12, 12);

    // Lives
    ctx.textAlign = "left";
    ctx.font = "20px serif";
    for (let i = 0; i < MAX_LIVES; i++) {
      ctx.fillText(i < s.lives ? "❤️" : "🖤", 12 + i * 28, 10);
    }

    // Overlays
    if (s.phase === "ready") {
      ctx.fillStyle = "rgba(15,25,35,0.75)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#F0F4F8";
      ctx.font = "bold 36px 'Bebas Neue', Impact, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("CREVO-HOP", W / 2, H / 2 - 50);
      ctx.font = "16px Inter, sans-serif";
      ctx.fillStyle = "#94A3B8";
      ctx.fillText("Sauteur de crevasses", W / 2, H / 2 - 10);
      ctx.fillStyle = "#4CAF82";
      ctx.font = "bold 20px Inter, sans-serif";
      ctx.fillText("TAP pour commencer", W / 2, H / 2 + 40);
    }

    if (s.phase === "gameover") {
      ctx.fillStyle = "rgba(15,25,35,0.85)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#FF6B6B";
      ctx.font = "bold 40px 'Bebas Neue', Impact, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("GAME OVER", W / 2, H / 2 - 60);
      ctx.fillStyle = "#F0F4F8";
      ctx.font = "bold 24px Inter, sans-serif";
      ctx.fillText(`${s.score} crevasses franchies`, W / 2, H / 2 - 10);
      ctx.font = "14px Inter, sans-serif";
      ctx.fillStyle = "#94A3B8";
      ctx.fillText("⚡ " + (s.score >= 10 ? "Impressionnant !" : s.score >= 5 ? "Pas mal !" : "Entraîne-toi !"), W / 2, H / 2 + 30);
      ctx.fillStyle = "#4CAF82";
      ctx.font = "bold 18px Inter, sans-serif";
      ctx.fillText("TAP pour rejouer", W / 2, H / 2 + 80);
    }
  }, []);

  // ─── Update ───────────────────────────────────────────────────────────────
  const update = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== "playing") return;

    // Move world
    s.camX += s.speed;

    // Physics
    s.vy += GRAVITY;
    s.skierY += s.vy;

    // Ground check: is skier over a crevasse?
    const skierWorldX = s.camX + SKIER_X;
    let inCrevasse = false;
    let nextGroundAfterCrevasseY = GROUND_Y;
    for (const cr of s.crevasses) {
      if (skierWorldX + 10 > cr.startX && skierWorldX - 10 < cr.startX + cr.width) {
        inCrevasse = true;
        break;
      }
    }

    if (!inCrevasse) {
      if (s.skierY >= GROUND_Y) {
        s.skierY = GROUND_Y;
        s.vy = 0;
        s.onGround = true;
      }
    } else {
      s.onGround = false;
      // Fell too far → die
      if (s.skierY > GROUND_Y + 120) {
        if (s.invincible <= 0) {
          s.lives -= 1;
          s.deathFlash = 20;
          if (s.lives <= 0) {
            s.phase = "gameover";
          } else {
            // Respawn: move camX so skier is past the crevasse
            const cr = s.crevasses.find(
              (c) => skierWorldX + 10 > c.startX && skierWorldX - 10 < c.startX + c.width
            );
            if (cr) {
              s.camX = cr.startX + cr.width - SKIER_X + 20;
            }
            s.skierY = GROUND_Y;
            s.vy = 0;
            s.onGround = true;
            s.invincible = 90; // 1.5s at 60fps
          }
        }
      }
    }

    // Check if skier fully cleared a crevasse (score)
    for (const cr of s.crevasses) {
      if (!cr.hasOwnProperty("_scored") || !(cr as any)._scored) {
        const skierRightWorldX = skierWorldX + 10;
        if (skierRightWorldX > cr.startX + cr.width && s.onGround) {
          (cr as any)._scored = true;
          s.score += 1;
          // Speed up slightly
          s.speed = Math.min(BASE_SPEED + s.score * 0.2, 10);
        }
      }
    }

    // Spawn new crevasse
    const spawnX = s.camX + W + 100;
    if (s.nextCrevasseX < spawnX) {
      const width = 80 + Math.random() * 80;
      s.crevasses.push({ startX: s.nextCrevasseX, width });
      s.nextCrevasseX += 250 + Math.random() * 200 - s.score * 5;
      s.nextCrevasseX = Math.max(s.nextCrevasseX, s.camX + W + 50);
    }

    // Prune old crevasses
    s.crevasses = s.crevasses.filter((cr) => cr.startX + cr.width > s.camX - 100);

    // Countdown invincibility
    if (s.invincible > 0) s.invincible--;
    if (s.deathFlash > 0) s.deathFlash--;
  }, []);

  // ─── Game loop ────────────────────────────────────────────────────────────
  const loop = useCallback(() => {
    update();
    draw();
    const s = stateRef.current;
    if (s.phase === "playing" || s.phase === "dead") {
      rafRef.current = requestAnimationFrame(loop);
    } else if (s.phase === "gameover") {
      draw(); // final frame
      setDisplayState({ phase: "gameover", lives: s.lives, score: s.score });
    }
  }, [update, draw]);

  useEffect(() => {
    draw(); // Initial draw
  }, [draw, scale]);

  // ─── Input ────────────────────────────────────────────────────────────────
  const handleTap = useCallback(() => {
    const s = stateRef.current;
    if (s.phase === "ready") {
      stateRef.current = { ...makeInitState(), phase: "playing" };
      setDisplayState({ phase: "playing", lives: MAX_LIVES, score: 0 });
      rafRef.current = requestAnimationFrame(loop);
      return;
    }
    if (s.phase === "gameover") {
      cancelAnimationFrame(rafRef.current);
      stateRef.current = { ...makeInitState(), phase: "playing" };
      setDisplayState({ phase: "playing", lives: MAX_LIVES, score: 0 });
      rafRef.current = requestAnimationFrame(loop);
      return;
    }
    if (s.phase === "playing" && s.onGround) {
      s.vy = JUMP_VY;
      s.onGround = false;
    }
  }, [loop]);

  const handleTouch = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      handleTap();
    },
    [handleTap]
  );

  // Sync display state periodically
  useEffect(() => {
    const id = setInterval(() => {
      const s = stateRef.current;
      setDisplayState((prev) => {
        if (
          prev.phase !== s.phase ||
          prev.lives !== s.lives ||
          prev.score !== s.score
        ) {
          return { phase: s.phase, lives: s.lives, score: s.score };
        }
        return prev;
      });
    }, 200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div
        style={{
          width: W * scale,
          height: H * scale,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{
            width: W,
            height: H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            touchAction: "none",
            display: "block",
          }}
          onTouchStart={handleTouch}
          onClick={handleTap}
        />
      </div>
      <p className="text-mist text-xs mt-2 text-center px-4">
        TAP pour sauter · 3 vies · rythme croissant
      </p>
    </div>
  );
}
