"use client";
import { useRef, useEffect, useState, useCallback } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────
const W = 375;
const H = 500;
const SKIER_W = 36;
const SKIER_H = 36;
const SKIER_Y = H * 0.72;
const MAX_SKIER_X = W - 40;
const MIN_SKIER_X = 40;
const DRIFT_SPEED = 140; // px per second
const MAX_LIVES = 3;
const BLOCK_W_MIN = 40;
const BLOCK_W_MAX = 90;
const BLOCK_H = 28;
const INVINCIBLE_FRAMES = 90;

// ─── Types ───────────────────────────────────────────────────────────────────
interface Block {
  x: number;
  y: number;
  w: number;
  speed: number;
}

interface GameState {
  phase: "ready" | "playing" | "gameover";
  skierX: number;
  driftDir: -1 | 0 | 1;
  blocks: Block[];
  lives: number;
  score: number;
  frames: number;
  invincible: number;
  nextSpawn: number;  // frame count for next spawn
  spawnInterval: number; // frames between spawns
  deathFlash: number;
}

function makeInitState(): GameState {
  return {
    phase: "ready",
    skierX: W / 2,
    driftDir: 0,
    blocks: [],
    lives: MAX_LIVES,
    score: 0,
    frames: 0,
    invincible: 0,
    nextSpawn: 60,
    spawnInterval: 90,
    deathFlash: 0,
  };
}

export function AvalancheGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(makeInitState());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [scale, setScale] = useState(1);
  const [displayPhase, setDisplayPhase] = useState<GameState["phase"]>("ready");
  const [displayScore, setDisplayScore] = useState(0);

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

    // Background: mountain slope
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#C8E4F0");
    bg.addColorStop(1, "#E8F4F8");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Ski tracks (static decorative lines)
    ctx.strokeStyle = "rgba(150,190,210,0.4)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const x = 40 + i * 70;
      ctx.beginPath();
      ctx.setLineDash([8, 12]);
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 20, H);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Blocks (avalanche chunks)
    for (const b of s.blocks) {
      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.beginPath();
      ctx.roundRect(b.x + 4, b.y + 4, b.w, BLOCK_H, 6);
      ctx.fill();
      // Block
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, BLOCK_H, 6);
      ctx.fill();
      // Highlight
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.roundRect(b.x + 3, b.y + 3, b.w - 6, 6, 3);
      ctx.fill();
      // Cracks
      ctx.strokeStyle = "rgba(150,190,210,0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(b.x + b.w * 0.3, b.y + 8);
      ctx.lineTo(b.x + b.w * 0.45, b.y + BLOCK_H - 4);
      ctx.stroke();
    }

    // Skier
    const visible = s.invincible === 0 || Math.floor(s.invincible / 4) % 2 === 0;
    if (visible) {
      ctx.font = "32px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🎿", s.skierX, SKIER_Y);
    }

    // Death flash
    if (s.deathFlash > 0) {
      ctx.fillStyle = `rgba(255,50,50,${(s.deathFlash / 20) * 0.45})`;
      ctx.fillRect(0, 0, W, H);
    }

    // HUD
    ctx.font = "20px serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    for (let i = 0; i < MAX_LIVES; i++) {
      ctx.fillText(i < s.lives ? "❤️" : "🖤", 10 + i * 28, 10);
    }
    ctx.fillStyle = "#0F1923";
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(`${s.score}`, W - 12, 14);
    ctx.font = "12px Inter, sans-serif";
    ctx.fillStyle = "#5EADD4";
    ctx.fillText("pts", W - 12, 34);

    // Overlays
    if (s.phase === "ready") {
      ctx.fillStyle = "rgba(15,25,35,0.7)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#F0F4F8";
      ctx.font = "bold 38px 'Bebas Neue', Impact, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("ÉVITE L'AVALANCHE", W / 2, H / 2 - 60);
      ctx.font = "15px Inter, sans-serif";
      ctx.fillStyle = "#94A3B8";
      ctx.fillText("TAP gauche ou droite pour esquiver", W / 2, H / 2 - 20);
      ctx.fillStyle = "#E8804A";
      ctx.font = "bold 20px Inter, sans-serif";
      ctx.fillText("TAP pour commencer", W / 2, H / 2 + 40);
    }

    if (s.phase === "gameover") {
      ctx.fillStyle = "rgba(15,25,35,0.85)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#E8804A";
      ctx.font = "bold 40px 'Bebas Neue', Impact, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("GAME OVER", W / 2, H / 2 - 60);
      ctx.fillStyle = "#F0F4F8";
      ctx.font = "bold 24px Inter, sans-serif";
      ctx.fillText(`Score : ${s.score}`, W / 2, H / 2 - 10);
      ctx.font = "14px Inter, sans-serif";
      ctx.fillStyle = "#94A3B8";
      const msg = s.score >= 50 ? "Pro de la descente !" : s.score >= 20 ? "Bonne esquive !" : "Entraîne-toi !";
      ctx.fillText(msg, W / 2, H / 2 + 30);
      ctx.fillStyle = "#4CAF82";
      ctx.font = "bold 18px Inter, sans-serif";
      ctx.fillText("TAP pour rejouer", W / 2, H / 2 + 80);
    }
  }, []);

  // ─── Update ───────────────────────────────────────────────────────────────
  const update = useCallback((dt: number) => {
    const s = stateRef.current;
    if (s.phase !== "playing") return;

    s.frames++;

    // Move skier
    if (s.driftDir !== 0) {
      s.skierX += s.driftDir * DRIFT_SPEED * dt;
      s.skierX = Math.max(MIN_SKIER_X, Math.min(MAX_SKIER_X, s.skierX));
    }

    // Move blocks
    for (const b of s.blocks) {
      b.y += b.speed * dt;
    }

    // Collision detection (AABB, skier is ~30px wide)
    if (s.invincible <= 0) {
      const sx = s.skierX - SKIER_W / 2;
      const sy = SKIER_Y - SKIER_H / 2;
      for (const b of s.blocks) {
        if (
          sx < b.x + b.w &&
          sx + SKIER_W > b.x &&
          sy < b.y + BLOCK_H &&
          sy + SKIER_H > b.y
        ) {
          s.lives--;
          s.deathFlash = 20;
          s.invincible = INVINCIBLE_FRAMES;
          if (s.lives <= 0) {
            s.phase = "gameover";
            setDisplayPhase("gameover");
            setDisplayScore(s.score);
          }
          break;
        }
      }
    }

    // Score: count blocks that have passed the skier
    for (const b of s.blocks) {
      if (b.y > H + 10 && !(b as any)._scored) {
        (b as any)._scored = true;
        s.score += 1;
        setDisplayScore(s.score);
      }
    }

    // Prune off-screen blocks
    s.blocks = s.blocks.filter((b) => b.y < H + 50);

    // Spawn blocks
    s.nextSpawn--;
    if (s.nextSpawn <= 0) {
      const bw = BLOCK_W_MIN + Math.random() * (BLOCK_W_MAX - BLOCK_W_MIN);
      const bx = 20 + Math.random() * (W - 40 - bw);
      const speed = 180 + Math.min(s.score * 2, 120); // px/s, increases with score
      s.blocks.push({ x: bx, y: -BLOCK_H, w: bw, speed });
      // Reduce spawn interval over time
      s.spawnInterval = Math.max(30, 90 - Math.floor(s.score / 5) * 5);
      s.nextSpawn = s.spawnInterval;
    }

    // Countdown invincibility
    if (s.invincible > 0) s.invincible--;
    if (s.deathFlash > 0) s.deathFlash--;
  }, []);

  // ─── Loop ────────────────────────────────────────────────────────────────
  const loop = useCallback(
    (timestamp: number) => {
      const dt = Math.min((timestamp - (lastTimeRef.current || timestamp)) / 1000, 0.05);
      lastTimeRef.current = timestamp;
      update(dt);
      draw();
      if (stateRef.current.phase === "playing") {
        rafRef.current = requestAnimationFrame(loop);
      }
    },
    [update, draw]
  );

  useEffect(() => {
    draw();
  }, [draw, scale]);

  // ─── Input ────────────────────────────────────────────────────────────────
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      if (s.phase === "ready" || s.phase === "gameover") {
        cancelAnimationFrame(rafRef.current);
        stateRef.current = { ...makeInitState(), phase: "playing" };
        setDisplayPhase("playing");
        setDisplayScore(0);
        lastTimeRef.current = 0;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      if (s.phase === "playing") {
        const rect = canvasRef.current!.getBoundingClientRect();
        const touchX = (e.touches[0].clientX - rect.left) / scale;
        s.driftDir = touchX < W / 2 ? -1 : 1;
      }
    },
    [loop, scale]
  );

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    stateRef.current.driftDir = 0;
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div style={{ width: W * scale, height: H * scale, position: "relative", overflow: "hidden" }}>
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
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => {
            const s = stateRef.current;
            if (s.phase === "ready" || s.phase === "gameover") {
              cancelAnimationFrame(rafRef.current);
              stateRef.current = { ...makeInitState(), phase: "playing" };
              setDisplayPhase("playing");
              setDisplayScore(0);
              lastTimeRef.current = 0;
              rafRef.current = requestAnimationFrame(loop);
            } else if (s.phase === "playing") {
              s.driftDir = e.clientX < window.innerWidth / 2 ? -1 : 1;
              setTimeout(() => { stateRef.current.driftDir = 0; }, 200);
            }
          }}
        />
      </div>
      <p className="text-mist text-xs mt-2 text-center px-4">
        TAP gauche = aller à gauche · TAP droite = droite · 3 vies
      </p>
    </div>
  );
}
