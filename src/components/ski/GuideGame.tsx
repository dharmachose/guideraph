"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { usePlayer } from "@/lib/player-context";

// ─── Constants ────────────────────────────────────────────────────────────────
const W = 375;
const H = 520;
const ROUNDS = 5;
const FADE_MS = 550;
const DRAW_LIMIT_MS = 9000;

const ROUND_CONFIG = [
  { pts: 4, showMs: 2200 },
  { pts: 5, showMs: 1900 },
  { pts: 6, showMs: 1600 },
  { pts: 7, showMs: 1350 },
  { pts: 8, showMs: 1100 },
] as const;

// ─── Path generation ──────────────────────────────────────────────────────────
function generatePath(numPts: number): [number, number][] {
  const pts: [number, number][] = [];
  pts.push([60 + Math.random() * (W - 120), 50]);
  for (let i = 1; i < numPts - 1; i++) {
    const progress = i / (numPts - 1);
    const y = 50 + (H - 120) * progress + (Math.random() - 0.5) * 18;
    const lastX = pts[pts.length - 1][0];
    const dir = (i % 2 === 0 ? 1 : -1) * (Math.random() > 0.25 ? 1 : -1);
    const dx = dir * (40 + Math.random() * 95);
    const x = Math.max(48, Math.min(W - 48, lastX + dx));
    pts.push([x, Math.min(H - 80, y)]);
  }
  pts.push([60 + Math.random() * (W - 120), H - 60]);
  return pts;
}

// ─── Scoring helpers ──────────────────────────────────────────────────────────
function samplePath(pts: [number, number][], n: number): [number, number][] {
  if (pts.length < 2) return pts;
  const lens: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dy = pts[i][1] - pts[i - 1][1];
    lens.push(lens[i - 1] + Math.hypot(dx, dy));
  }
  const total = lens[lens.length - 1];
  const result: [number, number][] = [];
  for (let k = 0; k < n; k++) {
    const t = (k / (n - 1)) * total;
    let i = 1;
    while (i < lens.length - 1 && lens[i] < t) i++;
    const segT = (t - lens[i - 1]) / (lens[i] - lens[i - 1]);
    result.push([
      pts[i - 1][0] + segT * (pts[i][0] - pts[i - 1][0]),
      pts[i - 1][1] + segT * (pts[i][1] - pts[i - 1][1]),
    ]);
  }
  return result;
}

function minDistToPolyline(
  px: number,
  py: number,
  pts: [number, number][]
): number {
  let minD = Infinity;
  for (const [x, y] of pts) {
    const d = Math.hypot(px - x, py - y);
    if (d < minD) minD = d;
  }
  return minD;
}

function scoreRound(
  raphPath: [number, number][],
  playerPts: [number, number][]
): number {
  if (playerPts.length < 5) return 0;
  const sampled = samplePath(raphPath, 28);
  let total = 0;
  for (const [rx, ry] of sampled) {
    total += minDistToPolyline(rx, ry, playerPts);
  }
  const avg = total / sampled.length;
  return Math.max(0, Math.round(100 - avg * 1.45));
}

// ─── State ────────────────────────────────────────────────────────────────────
type Phase = "ready" | "show" | "fade" | "draw" | "score" | "done";

interface GameState {
  phase: Phase;
  round: number;
  phaseStart: number;
  showProgress: number;
  fadeAlpha: number;
  playerPoints: [number, number][];
  roundScores: number[];
  currentScore: number;
}

function makeInitState(): GameState {
  return {
    phase: "ready",
    round: 0,
    phaseStart: 0,
    showProgress: 0,
    fadeAlpha: 1,
    playerPoints: [],
    roundScores: [],
    currentScore: 0,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export function GuideGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(makeInitState());
  const rafRef = useRef<number>(0);
  const pathsRef = useRef<[number, number][][]>([]);
  const [scale, setScale] = useState(1);
  const [phase, setPhase] = useState<Phase>("ready");
  const [doneData, setDoneData] = useState<{
    scores: number[];
    avg: number;
  } | null>(null);
  const { player } = usePlayer();
  const playerColor = player?.color ?? "#5EADD4";

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
    const now = Date.now();

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#C5E0F0");
    bg.addColorStop(1, "#E8F4FA");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = "rgba(140,190,215,0.2)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    const raphPath = pathsRef.current[s.round];
    if (!raphPath) return;

    // ── SHOW phase ──────────────────────────────────────────────────────────
    if (s.phase === "show" || s.phase === "fade") {
      const alpha = s.phase === "fade" ? s.fadeAlpha : 1;
      if (alpha > 0) {
        ctx.globalAlpha = alpha;
        const totalPts = raphPath.length;
        const drawCount =
          s.phase === "show"
            ? Math.max(1, Math.round(s.showProgress * (totalPts - 1)) + 1)
            : totalPts;

        // Path line
        ctx.strokeStyle = "#85C1E9";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.setLineDash([14, 7]);
        ctx.beginPath();
        ctx.moveTo(raphPath[0][0], raphPath[0][1]);
        for (let i = 1; i < drawCount; i++) {
          ctx.lineTo(raphPath[i][0], raphPath[i][1]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Waypoint dots — appear as path reaches them
        for (let i = 0; i < drawCount; i++) {
          const [px, py] = raphPath[i];
          const isStart = i === 0;
          const isEnd = i === raphPath.length - 1;
          const r = isStart || isEnd ? 11 : 8;
          const fill = isStart
            ? "#4CAF82"
            : isEnd
            ? "#E8804A"
            : "#FFE66D";

          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fillStyle = fill;
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.7)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Raph emoji at head of drawn path
        if (s.phase === "show") {
          const head = raphPath[drawCount - 1];
          ctx.font = "22px serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("🗺️", head[0], head[1] - 22);
        }

        ctx.globalAlpha = 1;
      }
    }

    // ── DRAW phase ──────────────────────────────────────────────────────────
    if (s.phase === "draw") {
      // Timer bar at top
      const elapsed = now - s.phaseStart;
      const remaining = Math.max(0, DRAW_LIMIT_MS - elapsed);
      const frac = remaining / DRAW_LIMIT_MS;
      const barColor =
        frac > 0.5 ? "#4CAF82" : frac > 0.25 ? "#FFE66D" : "#E8804A";
      ctx.fillStyle = "rgba(10,20,30,0.4)";
      ctx.fillRect(0, 0, W, 10);
      ctx.fillStyle = barColor;
      ctx.fillRect(0, 0, W * frac, 10);

      // Start dot (pulsing green)
      const pulse = (Math.sin(now / 280) + 1) / 2;
      const [sx, sy] = raphPath[0];
      ctx.beginPath();
      ctx.arc(sx, sy, 9 + pulse * 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(76,175,130,${0.25 + pulse * 0.2})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx, sy, 9, 0, Math.PI * 2);
      ctx.fillStyle = "#4CAF82";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Player's drawn path
      if (s.playerPoints.length > 1) {
        ctx.strokeStyle = playerColor;
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(s.playerPoints[0][0], s.playerPoints[0][1]);
        for (let i = 1; i < s.playerPoints.length; i++) {
          ctx.lineTo(s.playerPoints[i][0], s.playerPoints[i][1]);
        }
        ctx.stroke();

        // Trail head dot
        const last = s.playerPoints[s.playerPoints.length - 1];
        ctx.beginPath();
        ctx.arc(last[0], last[1], 7, 0, Math.PI * 2);
        ctx.fillStyle = playerColor;
        ctx.fill();
      }
    }

    // ── SCORE phase ─────────────────────────────────────────────────────────
    if (s.phase === "score") {
      // Ghost: Raph's path
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = "#85C1E9";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.setLineDash([12, 6]);
      ctx.beginPath();
      ctx.moveTo(raphPath[0][0], raphPath[0][1]);
      for (const [px, py] of raphPath) ctx.lineTo(px, py);
      ctx.stroke();
      ctx.setLineDash([]);

      // Waypoint dots (ghost)
      for (let i = 0; i < raphPath.length; i++) {
        const [px, py] = raphPath[i];
        ctx.beginPath();
        ctx.arc(px, py, i === 0 || i === raphPath.length - 1 ? 10 : 7, 0, Math.PI * 2);
        ctx.fillStyle =
          i === 0 ? "#4CAF82" : i === raphPath.length - 1 ? "#E8804A" : "#FFE66D";
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // Player's path
      if (s.playerPoints.length > 1) {
        ctx.strokeStyle = playerColor;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.moveTo(s.playerPoints[0][0], s.playerPoints[0][1]);
        for (const [px, py] of s.playerPoints) ctx.lineTo(px, py);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Score overlay panel
      const pct = s.currentScore;
      const color =
        pct >= 75 ? "#4CAF82" : pct >= 45 ? "#FFE66D" : "#E8804A";
      ctx.fillStyle = "rgba(10,20,30,0.84)";
      ctx.beginPath();
      ctx.roundRect(W / 2 - 130, H / 2 - 90, 260, 200, 20);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.font = "bold 72px 'Bebas Neue', Impact, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${pct}`, W / 2, H / 2 - 28);

      ctx.fillStyle = "#F0F4F8";
      ctx.font = "bold 18px Inter, sans-serif";
      ctx.fillText("/ 100", W / 2, H / 2 + 20);

      ctx.font = "13px Inter, sans-serif";
      ctx.fillStyle = "#94A3B8";
      const msg =
        pct >= 80
          ? "Parfait, tu connais le chemin !"
          : pct >= 55
          ? "Bonne mémoire !"
          : pct >= 30
          ? "Pas mal, continue !"
          : "Perdu dans la neige !";
      ctx.fillText(msg, W / 2, H / 2 + 52);

      ctx.fillStyle = "#5EADD4";
      ctx.font = "bold 14px Inter, sans-serif";
      const nextLabel =
        s.round < ROUNDS - 1
          ? "TAP → manche suivante"
          : "TAP → résultat final";
      ctx.fillText(nextLabel, W / 2, H / 2 + 86);
    }

    // ── HUD (manche counter) ─────────────────────────────────────────────────
    if (s.phase !== "ready" && s.phase !== "done") {
      ctx.fillStyle = "rgba(10,20,30,0.72)";
      ctx.beginPath();
      ctx.roundRect(
        s.phase === "draw" ? 8 : 8,
        s.phase === "draw" ? 16 : 10,
        150,
        34,
        10
      );
      ctx.fill();
      ctx.fillStyle = "#F0F4F8";
      ctx.font = "bold 15px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `Manche ${s.round + 1} / ${ROUNDS}`,
        18,
        s.phase === "draw" ? 33 : 27
      );

      // Phase hint
      if (s.phase === "show") {
        ctx.fillStyle = "#85C1E9";
        ctx.font = "bold 13px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Mémorise le chemin !", W / 2, H - 20);
      }
      if (s.phase === "fade") {
        ctx.fillStyle = "#FFE66D";
        ctx.font = "bold 13px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Il disparaît… Prépare-toi !", W / 2, H - 20);
      }
      if (s.phase === "draw") {
        ctx.fillStyle = "#4CAF82";
        ctx.font = "bold 14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Trace le chemin de mémoire !", W / 2, H - 20);
      }
    }

    // ── READY overlay ────────────────────────────────────────────────────────
    if (s.phase === "ready") {
      ctx.fillStyle = "rgba(10,20,35,0.82)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#F0F4F8";
      ctx.font = "bold 38px 'Bebas Neue', Impact, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SUIT RAPH LE GUIDE", W / 2, H / 2 - 90);
      ctx.font = "36px serif";
      ctx.fillText("🗺️", W / 2, H / 2 - 42);
      ctx.font = "14px Inter, sans-serif";
      ctx.fillStyle = "#94A3B8";
      ctx.fillText(`${ROUNDS} manches · chemin aléatoire`, W / 2, H / 2 + 10);
      ctx.fillText("Mémorise · puis trace en 9 secondes", W / 2, H / 2 + 30);
      ctx.fillText("🟢 départ  ●  waypoints  🟠 arrivée", W / 2, H / 2 + 54);
      ctx.fillStyle = "#85C1E9";
      ctx.font = "bold 22px Inter, sans-serif";
      ctx.fillText("TAP pour commencer", W / 2, H / 2 + 100);
    }
  }, [playerColor]);

  // ─── Animation loop ────────────────────────────────────────────────────────
  const loop = useCallback(() => {
    const s = stateRef.current;
    const now = Date.now();

    if (s.phase === "show") {
      const elapsed = now - s.phaseStart;
      const cfg = ROUND_CONFIG[s.round];
      s.showProgress = Math.min(1, elapsed / cfg.showMs);
      if (elapsed >= cfg.showMs) {
        s.phase = "fade";
        s.phaseStart = now;
        s.fadeAlpha = 1;
      }
    } else if (s.phase === "fade") {
      const elapsed = now - s.phaseStart;
      s.fadeAlpha = Math.max(0, 1 - elapsed / FADE_MS);
      if (elapsed >= FADE_MS) {
        s.phase = "draw";
        s.fadeAlpha = 0;
        s.playerPoints = [];
        s.phaseStart = now;
      }
    } else if (s.phase === "draw") {
      const elapsed = now - s.phaseStart;
      if (elapsed >= DRAW_LIMIT_MS && s.playerPoints.length >= 2) {
        // Auto-score when timer runs out
        const score = scoreRound(pathsRef.current[s.round], s.playerPoints);
        s.currentScore = score;
        s.roundScores = [...s.roundScores, score];
        s.phase = "score";
        setPhase("score");
      } else if (elapsed >= DRAW_LIMIT_MS) {
        // No drawing — score 0
        s.currentScore = 0;
        s.roundScores = [...s.roundScores, 0];
        s.phase = "score";
        setPhase("score");
      }
    }

    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  // ─── Input helpers ─────────────────────────────────────────────────────────
  const toCanvas = useCallback(
    (e: React.TouchEvent | React.MouseEvent): [number, number] => {
      const canvas = canvasRef.current;
      if (!canvas) return [0, 0];
      const rect = canvas.getBoundingClientRect();
      const clientX =
        "touches" in e
          ? e.touches[0].clientX
          : (e as React.MouseEvent).clientX;
      const clientY =
        "touches" in e
          ? e.touches[0].clientY
          : (e as React.MouseEvent).clientY;
      return [
        (clientX - rect.left) / scale,
        (clientY - rect.top) / scale,
      ];
    },
    [scale]
  );

  const startGame = useCallback(() => {
    pathsRef.current = ROUND_CONFIG.map((cfg) => generatePath(cfg.pts));
    stateRef.current = {
      ...makeInitState(),
      phase: "show",
      phaseStart: Date.now(),
    };
    setPhase("show");
    setDoneData(null);
  }, []);

  const advanceFromScore = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== "score") return;
    if (s.round < ROUNDS - 1) {
      s.round++;
      s.phase = "show";
      s.phaseStart = Date.now();
      s.showProgress = 0;
      s.fadeAlpha = 1;
      s.playerPoints = [];
      setPhase("show");
    } else {
      s.phase = "done";
      setPhase("done");
      const avg = Math.round(
        s.roundScores.reduce((a, b) => a + b, 0) / s.roundScores.length
      );
      setDoneData({ scores: s.roundScores, avg });
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      if (s.phase === "ready" || s.phase === "done") {
        startGame();
        return;
      }
      if (s.phase === "score") {
        advanceFromScore();
        return;
      }
      if (s.phase === "draw") {
        const pos = toCanvas(e);
        s.playerPoints = [pos];
      }
    },
    [toCanvas, startGame, advanceFromScore]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      if (s.phase !== "draw") return;
      s.playerPoints.push(toCanvas(e));
    },
    [toCanvas]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      if (s.phase !== "draw" || s.playerPoints.length < 2) return;
      const score = scoreRound(pathsRef.current[s.round], s.playerPoints);
      s.currentScore = score;
      s.roundScores = [...s.roundScores, score];
      s.phase = "score";
      setPhase("score");
    },
    []
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
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => {
            const s = stateRef.current;
            if (s.phase === "ready" || s.phase === "done") startGame();
            else if (s.phase === "score") advanceFromScore();
          }}
        />

        {/* Done overlay */}
        {phase === "done" && doneData && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-alpine-dark/92 animate-[fadeIn_0.35s_ease-out]"
            onClick={startGame}
          >
            <h2 className="font-heading text-4xl text-glacier mb-3">
              RÉSULTAT FINAL
            </h2>
            <div className="space-y-1.5 w-56">
              {doneData.scores.map((sc, i) => {
                const color =
                  sc >= 75
                    ? "text-summit"
                    : sc >= 45
                    ? "text-[#FFE66D]"
                    : "text-alpen-glow";
                return (
                  <div
                    key={i}
                    className="flex justify-between bg-alpine-mid/80 rounded-lg px-4 py-2"
                  >
                    <span className="text-mist text-sm">
                      Manche {i + 1}
                    </span>
                    <span className={`font-bold text-sm ${color}`}>
                      {sc} / 100
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-center">
              <p className="text-snow font-bold text-3xl">
                {doneData.avg}
                <span className="text-mist text-lg font-normal"> / 100</span>
              </p>
              <p className="text-mist text-sm mt-1">
                {doneData.avg >= 70
                  ? "Tu connais le chemin ! 🏆"
                  : doneData.avg >= 45
                  ? "Bonne mémoire !"
                  : "Raph t'attend encore…"}
              </p>
            </div>
            <p className="text-glacier text-xs mt-5">TAP pour rejouer</p>
          </div>
        )}
      </div>

      <p className="text-mist text-xs mt-2 text-center px-4">
        Observe · mémorise · trace en 9s · {ROUNDS} manches
      </p>
    </div>
  );
}
