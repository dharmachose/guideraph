"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { PLAYERS } from "@/data/players";
import { usePlayer } from "@/lib/player-context";
import { submitDvaScore, fetchDvaLeaderboard, type DvaScore } from "@/lib/leaderboard";

// ─── Constants ───────────────────────────────────────────────────────────────
const W = 375;
const H = 500;
const CAPTURE_RADIUS = 38;
const SIGNAL_RANGE = 250; // max distance for any signal
const BURIED_COUNT = 5;
// Exclude Raph from buried (he's the guide)
const BURIED_PLAYERS = PLAYERS.filter((p) => p.id !== "raph");

// ─── Types ───────────────────────────────────────────────────────────────────
interface BuriedPlayer {
  id: string;
  name: string;
  emoji: string;
  color: string;
  x: number;
  y: number;
  found: boolean;
}

interface GameState {
  phase: "ready" | "playing" | "win";
  buried: BuriedPlayer[];
  probeX: number;
  probeY: number;
  probeActive: boolean;
  startTime: number;
  endTime: number;
  foundFlash: { text: string; x: number; y: number; life: number } | null;
}

// Seeded pseudo-random using date-based seed for reproducible daily positions
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function makeBuriedPositions(): BuriedPlayer[] {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const rng = seededRandom(seed);

  const shuffled = [...BURIED_PLAYERS].sort(() => rng() - 0.5);
  const chosen = shuffled.slice(0, BURIED_COUNT);

  return chosen.map((p) => ({
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    color: p.color,
    x: 50 + rng() * (W - 100),
    y: 80 + rng() * (H - 160),
    found: false,
  }));
}

function makeInitState(): GameState {
  return {
    phase: "ready",
    buried: makeBuriedPositions(),
    probeX: W / 2,
    probeY: H / 2,
    probeActive: false,
    startTime: 0,
    endTime: 0,
    foundFlash: null,
  };
}

// Compute signal strength (0-5) based on distance to nearest unfound player
function getSignal(state: GameState): { bars: number; dist: number; nearestId: string | null } {
  const unfound = state.buried.filter((b) => !b.found);
  if (unfound.length === 0 || !state.probeActive) return { bars: 0, dist: Infinity, nearestId: null };

  let minDist = Infinity;
  let nearestId: string | null = null;
  for (const b of unfound) {
    const d = Math.hypot(state.probeX - b.x, state.probeY - b.y);
    if (d < minDist) {
      minDist = d;
      nearestId = b.id;
    }
  }

  const bars = Math.max(0, Math.round(5 * (1 - minDist / SIGNAL_RANGE)));
  return { bars, dist: minDist, nearestId };
}

export function DvaGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(makeInitState());
  const rafRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const [scale, setScale] = useState(1);
  const [displayState, setDisplayState] = useState<{
    phase: GameState["phase"];
    found: number;
    elapsed: number;
    score: number;
  }>({ phase: "ready", found: 0, elapsed: 0, score: 0 });
  const [leaderboard, setLeaderboard] = useState<DvaScore[]>([]);
  const { player } = usePlayer();

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

  // ─── Leaderboard submit + fetch on win ───────────────────────────────────
  useEffect(() => {
    if (displayState.phase !== "win") return;
    const run = async () => {
      if (player) {
        await submitDvaScore({
          player_id: player.id,
          player_name: player.name,
          player_emoji: player.emoji,
          score: displayState.score,
          found_count: displayState.found,
          elapsed_seconds: displayState.elapsed,
        });
      }
      const rows = await fetchDvaLeaderboard();
      setLeaderboard(rows);
    };
    run();
  }, [displayState.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Draw ─────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;

    // Snow background
    ctx.fillStyle = "#EAF4F8";
    ctx.fillRect(0, 0, W, H);

    // Snow texture — subtle dots
    ctx.fillStyle = "rgba(180,215,230,0.4)";
    for (let i = 0; i < 60; i++) {
      const px = ((i * 173 + 37) % W);
      const py = ((i * 97 + 53) % H);
      ctx.beginPath();
      ctx.arc(px, py, 2 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }

    // Signal ripple from nearest unfound player (hint visualization)
    if (s.phase === "playing" && s.probeActive) {
      const { bars, nearestId } = getSignal(s);
      if (nearestId) {
        const nearest = s.buried.find((b) => b.id === nearestId);
        if (nearest && bars > 0) {
          const t = (Date.now() % 1200) / 1200;
          for (let i = 0; i < 3; i++) {
            const rippleT = (t + i / 3) % 1;
            const r = rippleT * CAPTURE_RADIUS * 2.5;
            ctx.beginPath();
            ctx.arc(nearest.x, nearest.y, r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(94,173,212,${(1 - rippleT) * 0.3})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      }
    }

    // Found players (revealed)
    for (const b of s.buried) {
      if (b.found) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, b.y, 26, 0, Math.PI * 2);
        ctx.fillStyle = b.color + "40";
        ctx.fill();
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        ctx.font = "24px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(b.emoji, b.x, b.y);
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.fillStyle = b.color;
        ctx.fillText(b.name, b.x, b.y + 20);
      }
    }

    // Found flash animation
    if (s.foundFlash && s.foundFlash.life > 0) {
      const alpha = Math.min(1, s.foundFlash.life / 20);
      const yOffset = (30 - s.foundFlash.life) * 0.8;
      ctx.font = `bold ${16 + (30 - s.foundFlash.life) * 0.3}px Inter, sans-serif`;
      ctx.fillStyle = `rgba(76,175,130,${alpha})`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(s.foundFlash.text, s.foundFlash.x, s.foundFlash.y - yOffset);
    }

    // DVA Probe
    if (s.phase === "playing" && s.probeActive) {
      const { bars, dist } = getSignal(s);

      // Probe circle
      ctx.beginPath();
      ctx.arc(s.probeX, s.probeY, 22, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(15,25,35,0.85)";
      ctx.fill();
      ctx.strokeStyle = bars > 3 ? "#4CAF82" : bars > 1 ? "#FFE66D" : "#5EADD4";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Signal bars inside probe
      for (let i = 0; i < 5; i++) {
        const bh = 4 + i * 2;
        ctx.fillStyle = i < bars ? (bars > 3 ? "#4CAF82" : bars > 1 ? "#FFE66D" : "#5EADD4") : "rgba(255,255,255,0.2)";
        ctx.fillRect(s.probeX - 11 + i * 5, s.probeY - bh / 2, 4, bh);
      }

      // Distance label
      if (dist < SIGNAL_RANGE) {
        const m = Math.round(dist * 0.4); // fake meters
        ctx.font = "bold 12px Inter, sans-serif";
        ctx.fillStyle = "#F0F4F8";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${m}m`, s.probeX, s.probeY + 32);
      }
    }

    // HUD: timer & found count
    if (s.phase === "playing") {
      const elapsed = Math.floor((Date.now() - s.startTime) / 1000);
      const found = s.buried.filter((b) => b.found).length;

      ctx.fillStyle = "rgba(15,25,35,0.7)";
      ctx.beginPath();
      ctx.roundRect(10, 10, 120, 44, 10);
      ctx.fill();
      ctx.fillStyle = "#F0F4F8";
      ctx.font = "bold 20px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`⏱ ${elapsed}s`, 20, 28);
      ctx.font = "12px Inter, sans-serif";
      ctx.fillStyle = "#4CAF82";
      ctx.fillText(`${found}/${BURIED_COUNT} trouvés`, 20, 46);
    }

    // Overlays
    if (s.phase === "ready") {
      ctx.fillStyle = "rgba(15,25,35,0.78)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#F0F4F8";
      ctx.font = "bold 36px 'Bebas Neue', Impact, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("DVA SEARCH", W / 2, H / 2 - 70);
      ctx.font = "bold 28px serif";
      ctx.fillText("📡", W / 2, H / 2 - 20);
      ctx.font = "15px Inter, sans-serif";
      ctx.fillStyle = "#94A3B8";
      ctx.fillText("Glisse ton doigt sur la neige", W / 2, H / 2 + 20);
      ctx.fillText(`pour localiser ${BURIED_COUNT} potes ensevelis`, W / 2, H / 2 + 42);
      ctx.fillStyle = "#5EADD4";
      ctx.font = "bold 20px Inter, sans-serif";
      ctx.fillText("TAP pour commencer", W / 2, H / 2 + 90);
    }

    if (s.phase === "win") {
      const elapsed = Math.floor((s.endTime - s.startTime) / 1000);
      const score = Math.max(0, 300 - elapsed) * BURIED_COUNT;
      ctx.fillStyle = "rgba(15,25,35,0.88)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#4CAF82";
      ctx.font = "bold 44px 'Bebas Neue', Impact, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TOUS SAUVÉS !", W / 2, H / 2 - 80);

      // Show found players
      const found = s.buried;
      const cols = Math.ceil(found.length / 2);
      found.forEach((b, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = W / 2 - ((cols - 1) * 55) / 2 + col * 55;
        const y = H / 2 - 20 + row * 55;
        ctx.font = "28px serif";
        ctx.fillText(b.emoji, x, y);
      });

      ctx.fillStyle = "#F0F4F8";
      ctx.font = "bold 22px Inter, sans-serif";
      ctx.fillText(`${elapsed}s · Score : ${score}`, W / 2, H / 2 + 90);
      ctx.font = "14px Inter, sans-serif";
      ctx.fillStyle = "#94A3B8";
      const msg = elapsed < 30 ? "Sauveteur pro !" : elapsed < 60 ? "Bien joué !" : "La prochaine fois...";
      ctx.fillText(msg, W / 2, H / 2 + 120);
      ctx.fillStyle = "#5EADD4";
      ctx.font = "bold 18px Inter, sans-serif";
      ctx.fillText("TAP pour rejouer", W / 2, H / 2 + 160);
    }
  }, []);

  // ─── Animation loop ───────────────────────────────────────────────────────
  const loop = useCallback(() => {
    const s = stateRef.current;
    // Animate flash
    if (s.foundFlash && s.foundFlash.life > 0) {
      s.foundFlash.life--;
    }
    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  // ─── Touch handlers ──────────────────────────────────────────────────────
  const toCanvas = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      return {
        x: (clientX - rect.left) / scale,
        y: (clientY - rect.top) / scale,
      };
    },
    [scale]
  );

  const checkCapture = useCallback((s: GameState) => {
    if (s.phase !== "playing") return;
    for (const b of s.buried) {
      if (b.found) continue;
      const d = Math.hypot(s.probeX - b.x, s.probeY - b.y);
      if (d <= CAPTURE_RADIUS) {
        b.found = true;
        s.foundFlash = { text: `${b.emoji} ${b.name} sauvé !`, x: b.x, y: b.y - 30, life: 40 };
        if ("vibrate" in navigator) navigator.vibrate(200);
        const allFound = s.buried.every((p) => p.found);
        if (allFound) {
          s.phase = "win";
          s.endTime = Date.now();
          const elapsed = Math.floor((s.endTime - s.startTime) / 1000);
          const score = Math.max(0, 300 - elapsed) * BURIED_COUNT;
          setDisplayState({ phase: "win", found: BURIED_COUNT, elapsed, score });
        } else {
          setDisplayState((prev) => ({ ...prev, found: s.buried.filter((p) => p.found).length }));
        }
        break;
      }
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      if (s.phase === "ready" || s.phase === "win") {
        stateRef.current = { ...makeInitState(), phase: "playing", startTime: Date.now(), buried: makeBuriedPositions(), probeActive: false, endTime: 0, foundFlash: null };
        stateRef.current.phase = "playing";
        stateRef.current.startTime = Date.now();
        setDisplayState({ phase: "playing", found: 0, elapsed: 0, score: 0 });
        return;
      }
      const pos = toCanvas(e);
      s.probeX = pos.x;
      s.probeY = pos.y;
      s.probeActive = true;
      checkCapture(s);
    },
    [toCanvas, checkCapture]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      if (s.phase !== "playing") return;
      const pos = toCanvas(e);
      s.probeX = pos.x;
      s.probeY = pos.y;
      s.probeActive = true;
      checkCapture(s);
    },
    [toCanvas, checkCapture]
  );

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    stateRef.current.probeActive = false;
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
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => {
            const s = stateRef.current;
            if (s.phase === "ready" || s.phase === "win") {
              stateRef.current = makeInitState();
              stateRef.current.phase = "playing";
              stateRef.current.startTime = Date.now();
              stateRef.current.buried = makeBuriedPositions();
              setDisplayState({ phase: "playing", found: 0, elapsed: 0, score: 0 });
            }
          }}
        />
      </div>
      <p className="text-mist text-xs mt-2 text-center px-4">
        Glisse le doigt · signal = barres vertes · approche pour capturer
      </p>

      {displayState.phase === "win" && leaderboard.length > 0 && (
        <div className="w-full max-w-sm mt-4 px-4">
          <h3 className="font-heading text-glacier text-lg mb-2 text-center">🏆 Classement</h3>
          <div className="space-y-1">
            {leaderboard.map((row, i) => (
              <div
                key={row.id ?? i}
                className="flex items-center gap-2 bg-alpine-mid rounded-xl px-3 py-2"
              >
                <span className="text-mist text-xs w-4 text-right">{i + 1}</span>
                <span className="text-base">{row.player_emoji}</span>
                <span className="flex-1 text-snow text-sm font-semibold">{row.player_name}</span>
                <span className="text-glacier text-xs">{row.elapsed_seconds}s</span>
                <span className="text-[#4CAF82] text-xs font-bold">{row.score} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
