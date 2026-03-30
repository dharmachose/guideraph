"use client";
import { useRef, useEffect, useState, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const W = 375;
const H = 520;
const GROUND_Y = 400;
const SKIER_X = 80;
const GRAVITY = 920; // px/s²
const JUMP_VY = -405; // px/s
const DOUBLE_JUMP_VY = -340; // px/s (weaker second jump)
const MAX_LIVES = 3;
const BASE_SPEED = 240; // px/s
const MAX_SPEED = 660; // px/s
const INVINCIBLE_MS = 1400;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Crevasse {
  startX: number;
  width: number;
  scored: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

interface GameState {
  phase: "ready" | "playing" | "gameover";
  camX: number;
  speed: number;
  skierY: number;
  vy: number;
  onGround: boolean;
  jumpCount: number; // 0=ground, 1=single jump used, 2=double jump used
  lives: number;
  score: number; // crevasses cleared
  distance: number; // camX / 10 for display
  invincibleMs: number;
  deathFlash: number;
  shakeMs: number;
  crevasses: Crevasse[];
  nextCrevasseX: number;
  particles: Particle[];
}

function crWidth(score: number): number {
  return Math.min(215, 75 + score * 2.8);
}

function crGap(score: number): number {
  return Math.max(155, 380 - score * 3.2);
}

function currentSpeed(camX: number): number {
  return Math.min(MAX_SPEED, BASE_SPEED + camX * 0.16);
}

function makeInitState(): GameState {
  return {
    phase: "ready",
    camX: 0,
    speed: BASE_SPEED,
    skierY: GROUND_Y,
    vy: 0,
    onGround: true,
    jumpCount: 0,
    lives: MAX_LIVES,
    score: 0,
    distance: 0,
    invincibleMs: 0,
    deathFlash: 0,
    shakeMs: 0,
    crevasses: [],
    nextCrevasseX: 500,
    particles: [],
  };
}

function spawnParticles(
  s: GameState,
  x: number,
  y: number,
  type: "jump" | "land"
) {
  const count = type === "land" ? 6 : 4;
  for (let i = 0; i < count; i++) {
    const angle =
      type === "land"
        ? Math.PI + ((Math.random() - 0.5) * Math.PI) / 2
        : Math.PI / 2 + ((Math.random() - 0.5) * Math.PI) / 2;
    const speed = 40 + Math.random() * 90;
    s.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (type === "jump" ? 30 : 0),
      life: 0.4 + Math.random() * 0.3,
      maxLife: 0.7,
    });
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export function CrevasseGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(makeInitState());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [scale, setScale] = useState(1);
  const [phase, setPhase] = useState<GameState["phase"]>("ready");
  const [gameOverData, setGameOverData] = useState<{
    score: number;
    distance: number;
  } | null>(null);

  useEffect(() => {
    const calc = () => {
      const availH = window.innerHeight - 56 - 60;
      setScale(Math.min(1, availH / H, window.innerWidth / W));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  // ─── Draw ──────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;

    // Screen shake
    const shakeX = s.shakeMs > 0 ? (Math.random() - 0.5) * 7 : 0;
    const shakeY = s.shakeMs > 0 ? (Math.random() - 0.5) * 7 : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, "#090F18");
    sky.addColorStop(1, "#12253A");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Stars (static + twinkling)
    const now = Date.now();
    const starData = [17, 53, 89, 137, 211, 293, 349, 421, 503, 577, 631, 719];
    for (const seed of starData) {
      const sx = (seed * 37 + 13) % W;
      const sy = (seed * 19 + 7) % (GROUND_Y - 60);
      const twinkle = 0.4 + Math.sin((now / 800 + seed) * 1.7) * 0.35;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${twinkle})`;
      ctx.fill();
    }

    // Parallax layer 1: distant mountains (slowest)
    const p1 = (s.camX * 0.07) % 450;
    ctx.fillStyle = "#0B1E30";
    for (let i = -1; i < 3; i++) {
      const mx = i * 450 - p1;
      ctx.beginPath();
      ctx.moveTo(mx, GROUND_Y);
      ctx.lineTo(mx + 80, GROUND_Y - 150);
      ctx.lineTo(mx + 160, GROUND_Y - 90);
      ctx.lineTo(mx + 230, GROUND_Y - 170);
      ctx.lineTo(mx + 310, GROUND_Y - 70);
      ctx.lineTo(mx + 450, GROUND_Y);
      ctx.fill();
    }

    // Parallax layer 2: mid hills (medium)
    const p2 = (s.camX * 0.22) % 320;
    ctx.fillStyle = "#0F2535";
    for (let i = -1; i < 3; i++) {
      const mx = i * 320 - p2;
      ctx.beginPath();
      ctx.moveTo(mx, GROUND_Y);
      ctx.lineTo(mx + 50, GROUND_Y - 90);
      ctx.lineTo(mx + 130, GROUND_Y - 50);
      ctx.lineTo(mx + 200, GROUND_Y - 110);
      ctx.lineTo(mx + 280, GROUND_Y - 55);
      ctx.lineTo(mx + 320, GROUND_Y);
      ctx.fill();
    }

    // Snow ground segments
    let prevEnd = 0;
    const drawGround = (startWorldX: number, endWorldX: number) => {
      const sx = startWorldX - s.camX;
      const ex = endWorldX - s.camX;
      if (ex < -5 || sx > W + 5) return;
      const x = Math.max(-5, sx);
      const w = Math.min(W + 5, ex) - x;
      if (w <= 0) return;

      // Snow surface
      ctx.fillStyle = "#D4ECFA";
      ctx.fillRect(x, GROUND_Y, w, H - GROUND_Y);
      // Top edge
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(x, GROUND_Y, w, 5);
      // Left cliff shadow
      if (sx > -5) {
        ctx.fillStyle = "#8BBCD4";
        ctx.fillRect(x, GROUND_Y, 4, H - GROUND_Y);
      }
    };

    for (const cr of s.crevasses) {
      drawGround(prevEnd, cr.startX);
      prevEnd = cr.startX + cr.width;
    }
    drawGround(prevEnd, s.camX + W + 200);

    // Crevasse voids + approach warning
    for (const cr of s.crevasses) {
      const sx = cr.startX - s.camX;
      const sw = cr.width;
      if (sx + sw < -5 || sx > W + 5) continue;

      // Approach warning: shadow on ground before the gap
      const warningDist = 260;
      const distToEdge = sx;
      if (distToEdge > 0 && distToEdge < warningDist) {
        const alpha = (1 - distToEdge / warningDist) * 0.45;
        const warnGrad = ctx.createLinearGradient(
          sx - warningDist,
          0,
          sx,
          0
        );
        warnGrad.addColorStop(0, `rgba(232,128,74,0)`);
        warnGrad.addColorStop(1, `rgba(232,128,74,${alpha})`);
        ctx.fillStyle = warnGrad;
        ctx.fillRect(
          Math.max(0, sx - warningDist),
          GROUND_Y,
          Math.min(warningDist, sx),
          8
        );
      }

      // Void
      const gx = Math.max(-5, sx);
      const gw = Math.min(W + 5, sx + sw) - gx;
      if (gw <= 0) continue;
      const voidGrad = ctx.createLinearGradient(gx, GROUND_Y, gx, H);
      voidGrad.addColorStop(0, "#050C14");
      voidGrad.addColorStop(1, "#000508");
      ctx.fillStyle = voidGrad;
      ctx.fillRect(gx, GROUND_Y + 5, gw, H - GROUND_Y);

      // Jagged ice edges
      ctx.strokeStyle = "#1A2F42";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gx, GROUND_Y + 5);
      for (let xi = 0; xi < gw; xi += 7) {
        ctx.lineTo(
          gx + xi + 3.5,
          GROUND_Y + 5 + (xi % 3 === 0 ? 10 : 3)
        );
        ctx.lineTo(gx + xi + 7, GROUND_Y + 5);
      }
      ctx.stroke();

      // Ice glow at edges
      const edgeGlow = ctx.createLinearGradient(gx, GROUND_Y, gx + 12, GROUND_Y);
      edgeGlow.addColorStop(0, "rgba(94,173,212,0.4)");
      edgeGlow.addColorStop(1, "rgba(94,173,212,0)");
      ctx.fillStyle = edgeGlow;
      ctx.fillRect(gx, GROUND_Y, 12, H - GROUND_Y);
    }

    // Particles
    for (const p of s.particles) {
      const alpha = (p.life / p.maxLife) * 0.8;
      const r = 3 + (1 - p.life / p.maxLife) * 3;
      ctx.beginPath();
      ctx.arc(p.x - s.camX + s.camX, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,240,252,${alpha})`;
      ctx.fill();
    }

    // Skier
    const visible =
      s.invincibleMs <= 0 || Math.floor(s.invincibleMs / 130) % 2 === 0;
    if (visible && s.phase !== "gameover") {
      const airLean = s.vy < -50 ? -0.25 : s.vy > 80 ? 0.18 : 0;
      const scaleY = s.onGround ? 0.9 : 1 + Math.abs(s.vy) / 2400;
      ctx.save();
      ctx.translate(SKIER_X, s.skierY);
      ctx.rotate(airLean);
      ctx.scale(1, Math.min(1.3, scaleY));
      ctx.font = "32px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("🎿", 0, 0);
      ctx.restore();
    }

    // Double jump indicator (dots above skier when double jump available)
    if (!s.onGround && s.jumpCount === 1 && s.invincibleMs <= 0) {
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.arc(SKIER_X - 8 + i * 14, s.skierY - 40, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,230,109,0.8)";
        ctx.fill();
      }
    }

    // Death flash
    if (s.deathFlash > 0) {
      ctx.fillStyle = `rgba(255,40,40,${s.deathFlash * 0.022})`;
      ctx.fillRect(0, 0, W, H);
    }

    // HUD
    if (s.phase === "playing") {
      // Lives
      ctx.font = "20px serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      for (let i = 0; i < MAX_LIVES; i++) {
        ctx.fillText(i < s.lives ? "❤️" : "🖤", 10 + i * 30, 10);
      }

      // Score + distance
      ctx.fillStyle = "rgba(10,20,30,0.68)";
      ctx.beginPath();
      ctx.roundRect(W - 105, 8, 96, 46, 10);
      ctx.fill();
      ctx.fillStyle = "#F0F4F8";
      ctx.font = "bold 18px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.fillText(`⚡ ${s.score}`, W - 12, 12);
      ctx.font = "11px Inter, sans-serif";
      ctx.fillStyle = "#5EADD4";
      ctx.fillText(`${Math.floor(s.distance)}m`, W - 12, 36);

      // Speed bar
      const spFrac = (s.speed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED);
      const spColor =
        spFrac > 0.65 ? "#E8804A" : spFrac > 0.35 ? "#FFE66D" : "#4CAF82";
      ctx.fillStyle = "rgba(10,20,30,0.4)";
      ctx.fillRect(0, H - 10, W, 10);
      ctx.fillStyle = spColor;
      ctx.fillRect(0, H - 10, W * Math.min(1, spFrac), 10);
    }

    // Ready overlay
    if (s.phase === "ready") {
      ctx.fillStyle = "rgba(10,20,35,0.82)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#F0F4F8";
      ctx.font = "bold 40px 'Bebas Neue', Impact, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("CREVO-HOP", W / 2, H / 2 - 85);
      ctx.font = "36px serif";
      ctx.fillText("⚡", W / 2, H / 2 - 38);
      ctx.font = "14px Inter, sans-serif";
      ctx.fillStyle = "#94A3B8";
      ctx.fillText("TAP pour sauter · TAP mid-air pour", W / 2, H / 2 + 10);
      ctx.fillText("double saut 🟡🟡 (limité ×1)", W / 2, H / 2 + 30);
      ctx.fillText("Orange sur sol = crevasse qui approche !", W / 2, H / 2 + 52);
      ctx.fillStyle = "#4CAF82";
      ctx.font = "bold 22px Inter, sans-serif";
      ctx.fillText("TAP pour commencer", W / 2, H / 2 + 96);
    }

    ctx.restore(); // shake
  }, []);

  // ─── Update ────────────────────────────────────────────────────────────────
  const update = useCallback((dt: number) => {
    const s = stateRef.current;
    if (s.phase !== "playing") return;

    // Speed
    s.speed = currentSpeed(s.camX);
    s.camX += s.speed * dt;
    s.distance = s.camX / 10;

    // Physics
    s.vy += GRAVITY * dt;
    s.skierY += s.vy * dt;

    // Ground detection
    const worldX = s.camX + SKIER_X;
    let inCrevasse = false;
    for (const cr of s.crevasses) {
      if (worldX + 12 > cr.startX && worldX - 12 < cr.startX + cr.width) {
        inCrevasse = true;
        break;
      }
    }

    if (!inCrevasse && s.skierY >= GROUND_Y) {
      const wasAirborne = !s.onGround;
      s.skierY = GROUND_Y;
      s.vy = 0;
      if (!s.onGround) {
        s.onGround = true;
        s.jumpCount = 0;
        if (wasAirborne) spawnParticles(s, SKIER_X, GROUND_Y, "land");
      }
    } else if (inCrevasse) {
      s.onGround = false;
    }

    // Fell too deep → die
    if (s.skierY > GROUND_Y + 100 && s.invincibleMs <= 0) {
      s.lives--;
      s.deathFlash = 18;
      s.shakeMs = 300;
      if ("vibrate" in navigator) navigator.vibrate([150, 60, 200]);
      if (s.lives <= 0) {
        s.phase = "gameover";
        setPhase("gameover");
        setGameOverData({ score: s.score, distance: Math.floor(s.distance) });
      } else {
        // Respawn past crevasse
        const cr = s.crevasses.find(
          (c) => worldX + 12 > c.startX && worldX - 12 < c.startX + c.width
        );
        if (cr) s.camX = cr.startX + cr.width - SKIER_X + 15;
        s.skierY = GROUND_Y;
        s.vy = 0;
        s.onGround = true;
        s.jumpCount = 0;
        s.invincibleMs = INVINCIBLE_MS;
      }
    }

    // Score crevasses
    for (const cr of s.crevasses) {
      if (!cr.scored && worldX - 12 > cr.startX + cr.width) {
        cr.scored = true;
        s.score++;
      }
    }

    // Spawn crevasses
    if (s.nextCrevasseX < s.camX + W + 150) {
      const w = crWidth(s.score);
      s.crevasses.push({ startX: s.nextCrevasseX, width: w, scored: false });
      s.nextCrevasseX += w + crGap(s.score);
    }

    s.crevasses = s.crevasses.filter(
      (cr) => cr.startX + cr.width > s.camX - 50
    );

    // Update particles
    for (const p of s.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt;
      p.life -= dt;
    }
    s.particles = s.particles.filter((p) => p.life > 0);

    // Timers
    if (s.invincibleMs > 0) s.invincibleMs -= dt * 1000;
    if (s.deathFlash > 0) s.deathFlash -= dt * 60;
    if (s.shakeMs > 0) s.shakeMs -= dt * 1000;
  }, []);

  // ─── Loop ──────────────────────────────────────────────────────────────────
  const loop = useCallback(
    (timestamp: number) => {
      const dt = Math.min(
        (timestamp - (lastTimeRef.current || timestamp)) / 1000,
        0.05
      );
      lastTimeRef.current = timestamp;
      update(dt);
      draw();
      rafRef.current = requestAnimationFrame(loop);
    },
    [update, draw]
  );

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  // ─── Input ─────────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    stateRef.current = { ...makeInitState(), phase: "playing" };
    lastTimeRef.current = 0;
    setPhase("playing");
    setGameOverData(null);
  }, []);

  const handleJump = useCallback(() => {
    const s = stateRef.current;
    if (s.phase === "ready" || s.phase === "gameover") {
      startGame();
      return;
    }
    if (s.phase !== "playing") return;
    if (s.onGround) {
      s.vy = JUMP_VY;
      s.onGround = false;
      s.jumpCount = 1;
      spawnParticles(s, SKIER_X, GROUND_Y, "jump");
    } else if (s.jumpCount === 1) {
      // Double jump
      s.vy = DOUBLE_JUMP_VY;
      s.jumpCount = 2;
      spawnParticles(s, SKIER_X, s.skierY, "jump");
    }
  }, [startGame]);

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
          onTouchStart={(e) => {
            e.preventDefault();
            handleJump();
          }}
          onClick={handleJump}
        />

        {/* Game over overlay */}
        {phase === "gameover" && gameOverData && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-alpine-dark/90 animate-[fadeIn_0.35s_ease-out]"
            onClick={startGame}
          >
            <h2 className="font-heading text-5xl text-[#FF6B6B]">
              GAME OVER
            </h2>
            <p className="text-snow font-bold text-2xl mt-2">
              ⚡ {gameOverData.score} crevasses
            </p>
            <p className="text-glacier text-sm mt-0.5">
              {gameOverData.distance}m parcourus
            </p>
            <p className="text-mist text-sm mt-2">
              {gameOverData.score >= 15
                ? "Sauteur de l'extrême ! 🏆"
                : gameOverData.score >= 8
                ? "Impressionnant !"
                : gameOverData.score >= 4
                ? "Pas mal !"
                : "Entraîne-toi !"}
            </p>
            <p className="text-glacier text-xs mt-6">TAP pour rejouer</p>
          </div>
        )}
      </div>

      <p className="text-mist text-xs mt-2 text-center px-4">
        TAP = saut · TAP mid-air = double saut (×1) · les 🟡🟡 = dispo
      </p>
    </div>
  );
}
