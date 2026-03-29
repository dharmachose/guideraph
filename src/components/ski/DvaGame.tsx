"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { PLAYERS } from "@/data/players";
import { usePlayer } from "@/lib/player-context";
import { submitDvaScore, fetchDvaLeaderboard, type DvaScore } from "@/lib/leaderboard";

// ─── Constants ────────────────────────────────────────────────────────────────
const W = 375;
const H = 520;
const CAPTURE_RADIUS = 30;
const SIGNAL_RANGE = 220;
const BURIED_COUNT = 5;
const TRAIL_MAX = 50;
const BURIED_PLAYERS = PLAYERS.filter((p) => p.id !== "raph");

// ─── Types ────────────────────────────────────────────────────────────────────
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
  trail: { x: number; y: number }[];
  foundFlash: { text: string; x: number; y: number; life: number } | null;
  captureFlash: { x: number; y: number; r: number; life: number } | null;
}

function randPos(): BuriedPlayer[] {
  const shuffled = [...BURIED_PLAYERS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, BURIED_COUNT).map((p) => ({
    ...p,
    x: 55 + Math.random() * (W - 110),
    y: 75 + Math.random() * (H - 150),
    found: false,
  }));
}

function makeInitState(): GameState {
  return {
    phase: "ready",
    buried: randPos(),
    probeX: W / 2,
    probeY: H / 2,
    probeActive: false,
    startTime: 0,
    endTime: 0,
    trail: [],
    foundFlash: null,
    captureFlash: null,
  };
}

function getSignal(s: GameState): {
  bars: number;
  dist: number;
  angle: number;
  nearestId: string | null;
} {
  const unfound = s.buried.filter((b) => !b.found);
  if (unfound.length === 0 || !s.probeActive)
    return { bars: 0, dist: Infinity, angle: 0, nearestId: null };

  let minDist = Infinity;
  let nearest: BuriedPlayer | null = null;
  for (const b of unfound) {
    const d = Math.hypot(s.probeX - b.x, s.probeY - b.y);
    if (d < minDist) {
      minDist = d;
      nearest = b;
    }
  }

  const bars = Math.max(0, Math.round(5 * (1 - minDist / SIGNAL_RANGE)));
  const angle = nearest
    ? Math.atan2(nearest.y - s.probeY, nearest.x - s.probeX)
    : 0;
  return { bars, dist: minDist, angle, nearestId: nearest?.id ?? null };
}

// ─── Audio beeper ─────────────────────────────────────────────────────────────
let audioCtx: AudioContext | null = null;
let beepTimer: ReturnType<typeof setTimeout> | null = null;
let currentBars = 0;

function stopBeep() {
  if (beepTimer) {
    clearTimeout(beepTimer);
    beepTimer = null;
  }
}

function scheduleBeep(bars: number) {
  stopBeep();
  currentBars = bars;
  if (bars === 0 || !audioCtx) return;

  const intervals = [0, 700, 450, 250, 130, 65] as const;
  const interval = intervals[bars as 0 | 1 | 2 | 3 | 4 | 5];

  const doBeep = () => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 380 + bars * 140;
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.07);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.07);
  };

  doBeep();
  beepTimer = setTimeout(() => scheduleBeep(currentBars), interval);
}

// ─── Component ────────────────────────────────────────────────────────────────
export function DvaGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(makeInitState());
  const rafRef = useRef<number>(0);
  const [scale, setScale] = useState(1);
  const [phase, setPhase] = useState<GameState["phase"]>("ready");
  const [winData, setWinData] = useState<{ elapsed: number; score: number } | null>(null);
  const [leaderboard, setLeaderboard] = useState<DvaScore[]>([]);
  const lastBarsRef = useRef(0);
  const { player } = usePlayer();

  // Scale to fit viewport
  useEffect(() => {
    const calc = () => {
      const availH = window.innerHeight - 56 - 60;
      setScale(Math.min(1, availH / H, window.innerWidth / W));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  // Leaderboard on win
  useEffect(() => {
    if (phase !== "win" || !winData) return;
    const run = async () => {
      if (player) {
        await submitDvaScore({
          player_id: player.id,
          player_name: player.name,
          player_emoji: player.emoji,
          score: winData.score,
          found_count: BURIED_COUNT,
          elapsed_seconds: winData.elapsed,
        });
      }
      setLeaderboard(await fetchDvaLeaderboard());
    };
    run();
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Draw ──────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;

    // Snow field background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#C8E4F4");
    bg.addColorStop(1, "#E8F4FA");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Snow texture dots
    ctx.fillStyle = "rgba(190,220,238,0.55)";
    for (let i = 0; i < 90; i++) {
      ctx.beginPath();
      ctx.arc(
        (i * 137 + 31) % W,
        (i * 89 + 17) % H,
        0.8 + (i % 3) * 0.6,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Subtle snow bumps above unfound buried victims
    if (s.phase === "playing") {
      for (const b of s.buried) {
        if (b.found) continue;
        const g = ctx.createRadialGradient(b.x, b.y - 6, 2, b.x, b.y, 26);
        g.addColorStop(0, "rgba(255,255,255,0.42)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, 24, 15, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Probe trail (fading dots)
    const trail = s.trail;
    for (let i = 1; i < trail.length; i++) {
      const alpha = (i / trail.length) * 0.38;
      const r = 1.5 + (i / trail.length) * 2;
      ctx.beginPath();
      ctx.arc(trail[i].x, trail[i].y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(94,173,212,${alpha})`;
      ctx.fill();
    }

    // Found players (revealed)
    for (const b of s.buried) {
      if (!b.found) continue;
      const glow = ctx.createRadialGradient(b.x, b.y, 6, b.x, b.y, 32);
      glow.addColorStop(0, b.color + "50");
      glow.addColorStop(1, b.color + "00");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 32, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, 22, 0, Math.PI * 2);
      ctx.fillStyle = b.color + "25";
      ctx.fill();
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      ctx.font = "22px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(b.emoji, b.x, b.y);
      ctx.font = "bold 10px Inter, sans-serif";
      ctx.fillStyle = b.color;
      ctx.fillText(b.name, b.x, b.y + 20);
    }

    // Capture flash burst
    if (s.captureFlash && s.captureFlash.life > 0) {
      const cf = s.captureFlash;
      const alpha = cf.life / 20;
      ctx.strokeStyle = `rgba(76,175,130,${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cf.x, cf.y, cf.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Found flash text
    if (s.foundFlash && s.foundFlash.life > 0) {
      const ff = s.foundFlash;
      const alpha = Math.min(1, ff.life / 20);
      const dy = (45 - ff.life) * 0.65;
      ctx.font = `bold ${14 + (45 - ff.life) * 0.15}px Inter, sans-serif`;
      ctx.fillStyle = `rgba(76,175,130,${alpha})`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ff.text, ff.x, ff.y - dy);
    }

    // DVA Probe
    if (s.phase === "playing" && s.probeActive) {
      const { bars, dist, angle } = getSignal(s);
      const color =
        bars >= 4 ? "#4CAF82" : bars >= 2 ? "#FFE66D" : "#5EADD4";

      // Warm glow when close
      if (bars >= 3) {
        const warmGrad = ctx.createRadialGradient(
          s.probeX, s.probeY, 12, s.probeX, s.probeY, 60
        );
        warmGrad.addColorStop(0, `rgba(76,175,130,${bars * 0.045})`);
        warmGrad.addColorStop(1, "rgba(76,175,130,0)");
        ctx.fillStyle = warmGrad;
        ctx.beginPath();
        ctx.arc(s.probeX, s.probeY, 60, 0, Math.PI * 2);
        ctx.fill();
      }

      // Probe body
      ctx.beginPath();
      ctx.arc(s.probeX, s.probeY, 24, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(10,20,30,0.9)";
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Directional arrow pointing toward nearest victim
      if (bars > 0 && dist < SIGNAL_RANGE) {
        const arrowLen = 13 + bars * 1.8;
        const ax = s.probeX + Math.cos(angle) * arrowLen;
        const ay = s.probeY + Math.sin(angle) * arrowLen;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        // Shaft
        ctx.beginPath();
        ctx.moveTo(
          s.probeX + Math.cos(angle) * 7,
          s.probeY + Math.sin(angle) * 7
        );
        ctx.lineTo(ax, ay);
        ctx.stroke();
        // Arrowhead
        ctx.translate(ax, ay);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-8, -4);
        ctx.lineTo(-8, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Signal bars inside probe
      for (let i = 0; i < 5; i++) {
        const bh = 3 + i * 1.8;
        ctx.fillStyle =
          i < bars ? color : "rgba(255,255,255,0.14)";
        ctx.fillRect(
          s.probeX - 11 + i * 5,
          s.probeY - bh / 2 - 1,
          4,
          bh
        );
      }

      // Distance label
      if (dist < SIGNAL_RANGE) {
        const m = Math.round(dist * 0.35);
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.fillStyle = "#D8EAF8";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${m}m`, s.probeX, s.probeY + 36);
      }
    }

    // HUD (top-left)
    if (s.phase === "playing") {
      const elapsed = Math.floor((Date.now() - s.startTime) / 1000);
      const found = s.buried.filter((b) => b.found).length;

      ctx.fillStyle = "rgba(10,20,30,0.75)";
      ctx.beginPath();
      ctx.roundRect(10, 10, 138, 50, 12);
      ctx.fill();

      ctx.fillStyle = "#F0F4F8";
      ctx.font = "bold 22px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`⏱ ${elapsed}s`, 22, 30);

      ctx.font = "12px Inter, sans-serif";
      ctx.fillStyle = "#4CAF82";
      ctx.fillText(`${found}/${BURIED_COUNT} sauvés`, 22, 51);
    }

    // Ready overlay
    if (s.phase === "ready") {
      ctx.fillStyle = "rgba(10,20,35,0.82)";
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#F0F4F8";
      ctx.font = "bold 40px 'Bebas Neue', Impact, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("DVA SEARCH", W / 2, H / 2 - 90);

      ctx.font = "38px serif";
      ctx.fillText("📡", W / 2, H / 2 - 38);

      ctx.font = "15px Inter, sans-serif";
      ctx.fillStyle = "#94A3B8";
      ctx.fillText(`Localise ${BURIED_COUNT} potes ensevelis`, W / 2, H / 2 + 18);
      ctx.fillText("La flèche indique la direction →", W / 2, H / 2 + 40);
      ctx.fillText("Plus de barres = plus proche", W / 2, H / 2 + 60);

      ctx.fillStyle = "#5EADD4";
      ctx.font = "bold 22px Inter, sans-serif";
      ctx.fillText("TAP pour commencer", W / 2, H / 2 + 100);
    }
  }, []);

  // Animation loop
  const loop = useCallback(() => {
    const s = stateRef.current;
    if (s.foundFlash && s.foundFlash.life > 0) s.foundFlash.life--;
    if (s.captureFlash && s.captureFlash.life > 0) {
      s.captureFlash.life--;
      s.captureFlash.r += 2.5;
    }
    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      stopBeep();
    };
  }, [loop]);

  const toCanvas = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const clientX =
        "touches" in e
          ? e.touches[0].clientX
          : (e as React.MouseEvent).clientX;
      const clientY =
        "touches" in e
          ? e.touches[0].clientY
          : (e as React.MouseEvent).clientY;
      return {
        x: (clientX - rect.left) / scale,
        y: (clientY - rect.top) / scale,
      };
    },
    [scale]
  );

  const startGame = useCallback(() => {
    if (!audioCtx) {
      try {
        audioCtx = new AudioContext();
      } catch {
        audioCtx = null;
      }
    }
    stateRef.current = {
      phase: "playing",
      buried: randPos(),
      probeX: W / 2,
      probeY: H / 2,
      probeActive: false,
      startTime: Date.now(),
      endTime: 0,
      trail: [],
      foundFlash: null,
      captureFlash: null,
    };
    lastBarsRef.current = 0;
    setPhase("playing");
    setWinData(null);
    setLeaderboard([]);
  }, []);

  const checkCapture = useCallback((s: GameState) => {
    if (s.phase !== "playing") return;
    for (const b of s.buried) {
      if (b.found) continue;
      const d = Math.hypot(s.probeX - b.x, s.probeY - b.y);
      if (d <= CAPTURE_RADIUS) {
        b.found = true;
        s.foundFlash = {
          text: `${b.emoji} ${b.name} sauvé !`,
          x: b.x,
          y: b.y - 30,
          life: 45,
        };
        s.captureFlash = { x: b.x, y: b.y, r: CAPTURE_RADIUS, life: 20 };
        if ("vibrate" in navigator) navigator.vibrate([80, 40, 180]);
        if (s.buried.every((p) => p.found)) {
          s.phase = "win";
          s.endTime = Date.now();
          stopBeep();
          const elapsed = Math.floor((s.endTime - s.startTime) / 1000);
          const score = Math.max(0, 300 - elapsed) * BURIED_COUNT;
          setPhase("win");
          setWinData({ elapsed, score });
        }
        break;
      }
    }
  }, []);

  const updateBeep = useCallback((s: GameState) => {
    const { bars } = getSignal(s);
    if (bars !== lastBarsRef.current) {
      scheduleBeep(bars);
      lastBarsRef.current = bars;
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      if (s.phase === "ready" || s.phase === "win") {
        startGame();
        return;
      }
      const pos = toCanvas(e);
      s.probeX = pos.x;
      s.probeY = pos.y;
      s.probeActive = true;
      s.trail = [pos];
      checkCapture(s);
      updateBeep(s);
    },
    [toCanvas, checkCapture, startGame, updateBeep]
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
      s.trail.push(pos);
      if (s.trail.length > TRAIL_MAX) s.trail.shift();
      checkCapture(s);
      updateBeep(s);
    },
    [toCanvas, checkCapture, updateBeep]
  );

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    stateRef.current.probeActive = false;
    stopBeep();
    lastBarsRef.current = 0;
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => {
            const s = stateRef.current;
            if (s.phase === "ready" || s.phase === "win") startGame();
          }}
        />

        {/* Win overlay — HTML layer over canvas */}
        {phase === "win" && winData && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-alpine-dark/92 animate-[fadeIn_0.4s_ease-out]"
            onClick={startGame}
          >
            <div className="text-5xl mb-1">🏔️</div>
            <h2 className="font-heading text-4xl text-summit leading-none">
              TOUS SAUVÉS !
            </h2>
            <p className="text-snow font-bold text-xl mt-2">
              {winData.elapsed}s &nbsp;·&nbsp;
              <span className="text-summit">{winData.score} pts</span>
            </p>
            <p className="text-mist text-sm">
              {winData.elapsed < 30
                ? "Sauveteur pro ! 🔥"
                : winData.elapsed < 60
                ? "Bien joué !"
                : "La prochaine fois..."}
            </p>

            {leaderboard.length > 0 && (
              <div className="mt-3 w-[260px]">
                <p className="text-glacier text-xs font-bold text-center mb-1.5 tracking-widest">
                  🏆 CLASSEMENT
                </p>
                <div className="space-y-1">
                  {leaderboard.slice(0, 5).map((row, i) => (
                    <div
                      key={row.id ?? i}
                      className="flex items-center gap-2 bg-alpine-mid/80 rounded-lg px-3 py-1.5"
                    >
                      <span className="text-mist text-xs w-3 shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm">{row.player_emoji}</span>
                      <span className="flex-1 text-snow text-xs font-semibold truncate">
                        {row.player_name}
                      </span>
                      <span className="text-mist text-xs shrink-0">
                        {row.elapsed_seconds}s
                      </span>
                      <span className="text-summit text-xs font-bold shrink-0">
                        {row.score}pt
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-glacier text-xs mt-4">TAP pour rejouer</p>
          </div>
        )}
      </div>

      <p className="text-mist text-xs mt-2 text-center px-4">
        Glisse le doigt · la flèche indique la direction · approche pour
        capturer
      </p>
    </div>
  );
}
