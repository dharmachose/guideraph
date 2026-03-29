"use client";
import { useRef, useEffect, useState, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const W = 375;
const H = 520;
const LANE_XS = [W * 0.2, W * 0.5, W * 0.8] as const;
const BLOCK_W = 88;
const BLOCK_H = 30;
const SKIER_Y = H * 0.74;
const SKIER_HIT_HALF = 16; // collision half-width (lane-based)
const MAX_LIVES = 3;
const INVINCIBLE_MS = 1400;

// ─── Types ────────────────────────────────────────────────────────────────────
type Lane = 0 | 1 | 2;
type BlockType = "snow" | "ice" | "rock";

interface Block {
  lane: Lane;
  y: number;
  speed: number;
  type: BlockType;
  scored: boolean;
}

interface GameState {
  phase: "ready" | "playing" | "gameover";
  laneIdx: Lane;
  skierX: number;
  blocks: Block[];
  lives: number;
  score: number;
  combo: number;
  invincibleMs: number;
  deathFlash: number;
  scrollY: number;
  elapsed: number; // seconds since game start
  nextSpawnMs: number; // ms until next spawn
}

function spawnInterval(score: number): number {
  // ms between spawns — decreases steeply
  if (score < 5) return 1400;
  if (score < 10) return 1150;
  if (score < 15) return 950;
  if (score < 20) return 800;
  if (score < 30) return 650;
  return 520;
}

function blockSpeed(score: number): number {
  // px/s — ramps sharply
  return Math.min(520, 200 + score * 11);
}

function maxSimultaneous(score: number): number {
  if (score < 10) return 1;
  if (score < 25) return 2;
  return 2; // keep 2 max but faster/denser
}

function comboMultiplier(combo: number): number {
  if (combo >= 15) return 4;
  if (combo >= 10) return 3;
  if (combo >= 5) return 2;
  return 1;
}

function makeInitState(): GameState {
  return {
    phase: "ready",
    laneIdx: 1,
    skierX: LANE_XS[1],
    blocks: [],
    lives: MAX_LIVES,
    score: 0,
    combo: 0,
    invincibleMs: 0,
    deathFlash: 0,
    scrollY: 0,
    elapsed: 0,
    nextSpawnMs: 1000,
  };
}

function pickBlockType(score: number): BlockType {
  if (score >= 20 && Math.random() < 0.18) return "rock";
  if (score >= 12 && Math.random() < 0.3) return "ice";
  return "snow";
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AvalancheGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(makeInitState());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [scale, setScale] = useState(1);
  const [phase, setPhase] = useState<GameState["phase"]>("ready");
  const [gameOverData, setGameOverData] = useState<{
    score: number;
    bestCombo: number;
  } | null>(null);
  const bestComboRef = useRef(0);

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

    // Background — scrolling snow slope
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#BDD9EF");
    bg.addColorStop(1, "#E5F2F9");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Scrolling ski tracks
    ctx.strokeStyle = "rgba(140,185,210,0.45)";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 16]);
    const trackXs = [W * 0.08, W * 0.35, W * 0.65, W * 0.92];
    for (const tx of trackXs) {
      const offset = s.scrollY % 26;
      ctx.beginPath();
      ctx.moveTo(tx, -offset);
      ctx.lineTo(tx + 10, H - offset + 26);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Speed lines at high speed
    const spd = blockSpeed(s.score);
    if (spd > 340 && s.phase === "playing") {
      const alpha = Math.min(0.22, (spd - 340) / 800);
      ctx.strokeStyle = `rgba(180,210,230,${alpha})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 12; i++) {
        const lx = 20 + (i * 31) % (W - 40);
        const ly = (s.scrollY * 2 + i * 47) % H;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + 4, ly + 18);
        ctx.stroke();
      }
    }

    // Lane dividers (subtle)
    ctx.strokeStyle = "rgba(120,170,200,0.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 18]);
    for (const divX of [W / 3, (W * 2) / 3]) {
      ctx.beginPath();
      ctx.moveTo(divX, 0);
      ctx.lineTo(divX, H);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Warning arrows for blocks above the screen
    for (const b of s.blocks) {
      if (b.y >= 0) continue;
      const bx = LANE_XS[b.lane];
      const arrowColor =
        b.type === "rock"
          ? "#E8804A"
          : b.type === "ice"
          ? "#5EADD4"
          : "#F0F4F8";
      ctx.fillStyle = arrowColor;
      ctx.globalAlpha = 0.85;
      // Downward triangle warning
      ctx.beginPath();
      ctx.moveTo(bx - 12, 8);
      ctx.lineTo(bx + 12, 8);
      ctx.lineTo(bx, 26);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Blocks
    for (const b of s.blocks) {
      if (b.y < 0) continue;
      const bx = LANE_XS[b.lane] - BLOCK_W / 2;

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.beginPath();
      ctx.roundRect(bx + 5, b.y + 5, BLOCK_W, BLOCK_H, 7);
      ctx.fill();

      if (b.type === "rock") {
        // Jagged rock appearance
        ctx.fillStyle = "#4A5568";
        ctx.beginPath();
        ctx.roundRect(bx, b.y, BLOCK_W, BLOCK_H, 4);
        ctx.fill();
        ctx.fillStyle = "#2D3748";
        // Cracks
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bx + BLOCK_W * 0.25, b.y + 4);
        ctx.lineTo(bx + BLOCK_W * 0.4, b.y + BLOCK_H - 4);
        ctx.moveTo(bx + BLOCK_W * 0.6, b.y + 6);
        ctx.lineTo(bx + BLOCK_W * 0.75, b.y + BLOCK_H - 6);
        ctx.stroke();
        // Rock label
        ctx.font = "11px Inter, sans-serif";
        ctx.fillStyle = "#E8804A";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("ROCHER", LANE_XS[b.lane], b.y + BLOCK_H / 2);
      } else if (b.type === "ice") {
        const iceGrad = ctx.createLinearGradient(bx, b.y, bx, b.y + BLOCK_H);
        iceGrad.addColorStop(0, "#A8D8F0");
        iceGrad.addColorStop(1, "#6BB8E0");
        ctx.fillStyle = iceGrad;
        ctx.beginPath();
        ctx.roundRect(bx, b.y, BLOCK_W, BLOCK_H, 7);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.beginPath();
        ctx.roundRect(bx + 4, b.y + 4, BLOCK_W - 8, 7, 3);
        ctx.fill();
      } else {
        // Snow block
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.roundRect(bx, b.y, BLOCK_W, BLOCK_H, 7);
        ctx.fill();
        ctx.fillStyle = "rgba(200,225,240,0.7)";
        ctx.beginPath();
        ctx.roundRect(bx + 4, b.y + 4, BLOCK_W - 8, 7, 3);
        ctx.fill();
        ctx.strokeStyle = "rgba(150,190,215,0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx + BLOCK_W * 0.35, b.y + 10);
        ctx.lineTo(bx + BLOCK_W * 0.48, b.y + BLOCK_H - 5);
        ctx.stroke();
      }
    }

    // Skier
    const visible =
      s.invincibleMs <= 0 ||
      Math.floor(s.invincibleMs / 120) % 2 === 0;
    if (visible && s.phase !== "gameover") {
      ctx.save();
      ctx.font = "32px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // Lean in direction of movement
      const dx = s.skierX - LANE_XS[s.laneIdx];
      ctx.translate(s.skierX, SKIER_Y);
      ctx.rotate(dx * 0.015);
      ctx.fillText("🎿", 0, 0);
      ctx.restore();
    }

    // Death flash
    if (s.deathFlash > 0) {
      ctx.fillStyle = `rgba(255,40,40,${(s.deathFlash / 18) * 0.5})`;
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

      // Score
      ctx.fillStyle = "rgba(10,20,30,0.7)";
      ctx.beginPath();
      ctx.roundRect(W - 90, 8, 80, 44, 10);
      ctx.fill();
      ctx.fillStyle = "#F0F4F8";
      ctx.font = "bold 22px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.fillText(`${s.score}`, W - 14, 12);
      ctx.font = "11px Inter, sans-serif";
      ctx.fillStyle = "#5EADD4";
      ctx.fillText("pts", W - 14, 36);

      // Combo (when meaningful)
      const mult = comboMultiplier(s.combo);
      if (s.combo >= 5) {
        ctx.fillStyle = "rgba(10,20,30,0.7)";
        ctx.beginPath();
        ctx.roundRect(W / 2 - 48, 8, 96, 34, 10);
        ctx.fill();
        ctx.fillStyle =
          mult >= 4 ? "#E8804A" : mult >= 3 ? "#FFE66D" : "#4CAF82";
        ctx.font = `bold 16px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`🔥 x${mult} COMBO`, W / 2, 25);
      }

      // Speed bar (bottom)
      const speedFrac = Math.min(1, (spd - 200) / 320);
      ctx.fillStyle = "rgba(10,20,30,0.5)";
      ctx.beginPath();
      ctx.roundRect(10, H - 18, W - 20, 8, 4);
      ctx.fill();
      const barColor =
        speedFrac > 0.75
          ? "#E8804A"
          : speedFrac > 0.45
          ? "#FFE66D"
          : "#4CAF82";
      ctx.fillStyle = barColor;
      ctx.beginPath();
      ctx.roundRect(10, H - 18, (W - 20) * speedFrac, 8, 4);
      ctx.fill();
    }

    // Ready overlay
    if (s.phase === "ready") {
      ctx.fillStyle = "rgba(10,20,35,0.82)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#F0F4F8";
      ctx.font = "bold 38px 'Bebas Neue', Impact, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("ÉVITE L'AVALANCHE", W / 2, H / 2 - 95);
      ctx.font = "36px serif";
      ctx.fillText("🏔️", W / 2, H / 2 - 46);
      ctx.font = "15px Inter, sans-serif";
      ctx.fillStyle = "#94A3B8";
      ctx.fillText("3 couloirs · TAP gauche ou droite", W / 2, H / 2 + 5);
      ctx.fillText("pour changer de couloir", W / 2, H / 2 + 25);
      ctx.fillText("⬛ Rochers = pas d'invincibilité !", W / 2, H / 2 + 52);
      ctx.fillStyle = "#E8804A";
      ctx.font = "bold 22px Inter, sans-serif";
      ctx.fillText("TAP pour commencer", W / 2, H / 2 + 100);
    }
  }, []);

  // ─── Update ────────────────────────────────────────────────────────────────
  const update = useCallback((dt: number) => {
    const s = stateRef.current;
    if (s.phase !== "playing") return;

    s.elapsed += dt;
    s.scrollY += blockSpeed(s.score) * dt * 0.55;

    // Skier lerp toward target lane
    const targetX = LANE_XS[s.laneIdx];
    s.skierX += (targetX - s.skierX) * Math.min(1, 18 * dt);

    // Move blocks
    for (const b of s.blocks) {
      b.y += b.speed * dt;
    }

    // Spawn blocks
    s.nextSpawnMs -= dt * 1000;
    if (s.nextSpawnMs <= 0) {
      const count = Math.random() < 0.5 ? 1 : maxSimultaneous(s.score);
      const lanes: Lane[] = [0, 1, 2];
      const shuffled = lanes.sort(() => Math.random() - 0.5);
      const chosen = shuffled.slice(0, count) as Lane[];

      const spd = blockSpeed(s.score);
      // Spawn high enough to give ~0.55s warning
      const spawnY = -(spd * 0.55);

      for (const lane of chosen) {
        s.blocks.push({
          lane,
          y: spawnY,
          speed: spd * (pickBlockType(s.score) === "ice" ? 1.35 : 1),
          type: pickBlockType(s.score),
          scored: false,
        });
      }
      s.nextSpawnMs = spawnInterval(s.score);
    }

    // Collision (lane-based)
    if (s.invincibleMs <= 0) {
      const skierTop = SKIER_Y - SKIER_HIT_HALF;
      const skierBot = SKIER_Y + SKIER_HIT_HALF;
      for (const b of s.blocks) {
        if (b.lane !== s.laneIdx) continue;
        if (b.y + BLOCK_H < skierTop || b.y > skierBot) continue;
        // HIT
        s.lives--;
        s.combo = 0;
        bestComboRef.current = Math.max(bestComboRef.current, 0);
        s.deathFlash = 18;
        if (b.type !== "rock") {
          s.invincibleMs = INVINCIBLE_MS;
        }
        if ("vibrate" in navigator) navigator.vibrate([120, 60, 200]);
        if (s.lives <= 0) {
          s.phase = "gameover";
          setPhase("gameover");
          setGameOverData({
            score: s.score,
            bestCombo: bestComboRef.current,
          });
        }
        break;
      }
    }

    // Score: blocks that passed skier
    for (const b of s.blocks) {
      if (!b.scored && b.y > SKIER_Y + 40) {
        b.scored = true;
        if (b.lane === s.laneIdx) continue; // shouldn't happen but guard
        s.combo++;
        if (s.combo > bestComboRef.current)
          bestComboRef.current = s.combo;
        s.score += comboMultiplier(s.combo);
      }
    }

    // Prune off-screen
    s.blocks = s.blocks.filter((b) => b.y < H + 60);

    // Timers
    if (s.invincibleMs > 0) s.invincibleMs -= dt * 1000;
    if (s.deathFlash > 0) s.deathFlash -= dt * 60;
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
    bestComboRef.current = 0;
    stateRef.current = { ...makeInitState(), phase: "playing" };
    lastTimeRef.current = 0;
    setPhase("playing");
    setGameOverData(null);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      if (s.phase === "ready" || s.phase === "gameover") {
        startGame();
        return;
      }
      if (s.phase === "playing") {
        const rect = canvasRef.current!.getBoundingClientRect();
        const touchX = (e.touches[0].clientX - rect.left) / scale;
        if (touchX < W / 2) {
          s.laneIdx = Math.max(0, s.laneIdx - 1) as Lane;
        } else {
          s.laneIdx = Math.min(2, s.laneIdx + 1) as Lane;
        }
      }
    },
    [scale, startGame]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const s = stateRef.current;
      if (s.phase === "ready" || s.phase === "gameover") {
        startGame();
        return;
      }
      if (s.phase === "playing") {
        if (e.clientX < window.innerWidth / 2) {
          s.laneIdx = Math.max(0, s.laneIdx - 1) as Lane;
        } else {
          s.laneIdx = Math.min(2, s.laneIdx + 1) as Lane;
        }
      }
    },
    [startGame]
  );

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
          onTouchStart={handleTouchStart}
          onClick={handleClick}
        />

        {/* Game over overlay */}
        {phase === "gameover" && gameOverData && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-alpine-dark/90 animate-[fadeIn_0.35s_ease-out]"
            onClick={startGame}
          >
            <h2 className="font-heading text-5xl text-alpen-glow">
              GAME OVER
            </h2>
            <p className="text-snow font-bold text-3xl mt-2">
              {gameOverData.score}{" "}
              <span className="text-glacier text-xl">pts</span>
            </p>
            {gameOverData.bestCombo >= 5 && (
              <p className="text-summit text-sm mt-1">
                Meilleur combo : {gameOverData.bestCombo} 🔥
              </p>
            )}
            <p className="text-mist text-sm mt-1">
              {gameOverData.score >= 60
                ? "Skieur de l'extrême ! 🏆"
                : gameOverData.score >= 30
                ? "Bonne descente !"
                : gameOverData.score >= 10
                ? "Entraîne-toi !"
                : "L'avalanche t'a eu..."}
            </p>
            <p className="text-glacier text-xs mt-6">TAP pour rejouer</p>
          </div>
        )}
      </div>

      <p className="text-mist text-xs mt-2 text-center px-4">
        TAP gauche = couloir gauche · TAP droite = couloir droit · 3 vies
      </p>
    </div>
  );
}
