"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { usePlayer } from "@/lib/player-context";

// ─── Constants ───────────────────────────────────────────────────────────────
const W = 375;
const H = 500;
const SHOW_DURATION = 2500;   // ms to show Raph's path
const FADE_DURATION = 800;    // ms to fade it out
const ROUNDS = 3;

// ─── Raph's paths: array of control points for bezier curves ─────────────────
// Each path is an array of [x,y] points; we draw as a polyline through them
const RAPH_PATHS: [number, number][][] = [
  // Round 1: gentle S-curve (easy)
  [
    [60, 80], [100, 150], [160, 200], [220, 160],
    [280, 220], [320, 300], [300, 380],
  ],
  // Round 2: zigzag (medium)
  [
    [50, 60], [130, 100], [80, 180], [200, 220],
    [120, 310], [260, 350], [310, 440],
  ],
  // Round 3: tight spiral start + long curve (hard)
  [
    [80, 50], [60, 120], [140, 160], [100, 240],
    [200, 260], [160, 350], [280, 370],
    [320, 430],
  ],
];

// Sample N equidistant points along a polyline
function samplePath(pts: [number, number][], n: number): [number, number][] {
  if (pts.length < 2) return pts;
  // Compute cumulative lengths
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
    const x = pts[i - 1][0] + segT * (pts[i][0] - pts[i - 1][0]);
    const y = pts[i - 1][1] + segT * (pts[i][1] - pts[i - 1][1]);
    result.push([x, y]);
  }
  return result;
}

// Min distance from a point to a polyline
function minDistToPolyline(px: number, py: number, pts: [number, number][]): number {
  let minD = Infinity;
  for (const [x, y] of pts) {
    const d = Math.hypot(px - x, py - y);
    if (d < minD) minD = d;
  }
  return minD;
}

type Phase = "ready" | "show" | "fade" | "draw" | "score" | "done";

interface GameState {
  phase: Phase;
  round: number;
  phaseStart: number;
  showProgress: number; // 0-1, how much of Raph's path is drawn
  fadeAlpha: number;    // 1 → 0 during fade
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

export function GuideGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(makeInitState());
  const rafRef = useRef<number>(0);
  const [scale, setScale] = useState(1);
  const [displayPhase, setDisplayPhase] = useState<Phase>("ready");
  const [displayRound, setDisplayRound] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
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

  const playerColor = player?.color ?? "#5EADD4";

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

    // Subtle grid / snow texture
    ctx.strokeStyle = "rgba(150,200,220,0.25)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    const raphPath = RAPH_PATHS[s.round] ?? RAPH_PATHS[0];

    // Raph's path
    if (s.phase === "show" || s.phase === "fade") {
      const alpha = s.phase === "fade" ? s.fadeAlpha : 1;
      if (alpha > 0) {
        const totalPts = raphPath.length;
        const drawCount = s.phase === "show"
          ? Math.max(1, Math.round(s.showProgress * totalPts))
          : totalPts;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = "#85C1E9";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.setLineDash([12, 6]);
        ctx.beginPath();
        ctx.moveTo(raphPath[0][0], raphPath[0][1]);
        for (let i = 1; i < drawCount; i++) {
          ctx.lineTo(raphPath[i][0], raphPath[i][1]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Raph emoji at head of path
        if (s.phase === "show") {
          const head = raphPath[drawCount - 1];
          ctx.font = "22px serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("🗺️", head[0], head[1] - 18);
        }
        ctx.restore();
      }
    }

    // Player's drawn path
    if (
      (s.phase === "draw" || s.phase === "score") &&
      s.playerPoints.length > 1
    ) {
      ctx.strokeStyle = playerColor;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(s.playerPoints[0][0], s.playerPoints[0][1]);
      for (let i = 1; i < s.playerPoints.length; i++) {
        ctx.lineTo(s.playerPoints[i][0], s.playerPoints[i][1]);
      }
      ctx.stroke();
    }

    // Show Raph's path as ghost during score phase
    if (s.phase === "score") {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = "#85C1E9";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.setLineDash([12, 6]);
      ctx.beginPath();
      ctx.moveTo(raphPath[0][0], raphPath[0][1]);
      for (let i = 1; i < raphPath.length; i++) {
        ctx.lineTo(raphPath[i][0], raphPath[i][1]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // HUD
    if (s.phase !== "ready" && s.phase !== "done") {
      ctx.fillStyle = "rgba(15,25,35,0.7)";
      ctx.beginPath();
      ctx.roundRect(10, 10, 160, 36, 10);
      ctx.fill();
      ctx.fillStyle = "#F0F4F8";
      ctx.font = "bold 15px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`Manche ${s.round + 1} / ${ROUNDS}`, 20, 28);

      if (s.phase === "show") {
        ctx.fillStyle = "#85C1E9";
        ctx.font = "bold 14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Mémorise le chemin de Raph !", W / 2, H - 30);
      }
      if (s.phase === "fade") {
        ctx.fillStyle = "#FFE66D";
        ctx.font = "bold 14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Il disparaît... Prépare-toi !", W / 2, H - 30);
      }
      if (s.phase === "draw") {
        ctx.fillStyle = "#4CAF82";
        ctx.font = "bold 15px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Trace le chemin de mémoire !", W / 2, H - 30);
      }
    }

    // Score overlay
    if (s.phase === "score") {
      ctx.fillStyle = "rgba(15,25,35,0.82)";
      ctx.fillRect(0, 0, W, H);
      const pct = s.currentScore;
      const color = pct >= 70 ? "#4CAF82" : pct >= 40 ? "#FFE66D" : "#E8804A";
      ctx.fillStyle = color;
      ctx.font = "bold 64px 'Bebas Neue', Impact, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${pct}`, W / 2, H / 2 - 30);
      ctx.fillStyle = "#F0F4F8";
      ctx.font = "bold 20px Inter, sans-serif";
      ctx.fillText("/ 100", W / 2, H / 2 + 20);
      const msg = pct >= 80 ? "Guide-né !" : pct >= 50 ? "Bonne mémoire !" : "Perdu dans la neige !";
      ctx.font = "14px Inter, sans-serif";
      ctx.fillStyle = "#94A3B8";
      ctx.fillText(msg, W / 2, H / 2 + 60);
      ctx.fillStyle = "#5EADD4";
      ctx.font = "bold 16px Inter, sans-serif";
      const nextLabel = s.round < ROUNDS - 1 ? "TAP pour la manche suivante" : "TAP pour le résultat final";
      ctx.fillText(nextLabel, W / 2, H / 2 + 110);
    }

    // Ready overlay
    if (s.phase === "ready") {
      ctx.fillStyle = "rgba(15,25,35,0.78)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#F0F4F8";
      ctx.font = "bold 36px 'Bebas Neue', Impact, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SUIT RAPH LE GUIDE", W / 2, H / 2 - 70);
      ctx.font = "28px serif";
      ctx.fillText("🗺️", W / 2, H / 2 - 20);
      ctx.font = "14px Inter, sans-serif";
      ctx.fillStyle = "#94A3B8";
      ctx.fillText("Regarde le chemin de Raph,", W / 2, H / 2 + 18);
      ctx.fillText("mémorise-le et reproduis-le !", W / 2, H / 2 + 38);
      ctx.fillStyle = "#85C1E9";
      ctx.font = "bold 20px Inter, sans-serif";
      ctx.fillText("TAP pour commencer", W / 2, H / 2 + 90);
    }

    // Done overlay
    if (s.phase === "done") {
      const total = s.roundScores.reduce((a, b) => a + b, 0);
      const avg = Math.round(total / s.roundScores.length);
      ctx.fillStyle = "rgba(15,25,35,0.88)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#85C1E9";
      ctx.font = "bold 40px 'Bebas Neue', Impact, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("RÉSULTAT FINAL", W / 2, H / 2 - 100);

      s.roundScores.forEach((sc, i) => {
        const color = sc >= 70 ? "#4CAF82" : sc >= 40 ? "#FFE66D" : "#E8804A";
        ctx.fillStyle = color;
        ctx.font = "bold 22px Inter, sans-serif";
        ctx.fillText(`Manche ${i + 1} : ${sc} / 100`, W / 2, H / 2 - 40 + i * 40);
      });

      ctx.fillStyle = "#F0F4F8";
      ctx.font = "bold 28px Inter, sans-serif";
      ctx.fillText(`Moyenne : ${avg} / 100`, W / 2, H / 2 + 90);

      const msg = avg >= 70 ? "Tu connais le chemin !" : avg >= 40 ? "Pas mal !" : "Raph attend encore !";
      ctx.font = "14px Inter, sans-serif";
      ctx.fillStyle = "#94A3B8";
      ctx.fillText(msg, W / 2, H / 2 + 130);

      ctx.fillStyle = "#5EADD4";
      ctx.font = "bold 18px Inter, sans-serif";
      ctx.fillText("TAP pour rejouer", W / 2, H / 2 + 170);
    }
  }, [playerColor]);

  // ─── Animation loop ───────────────────────────────────────────────────────
  const loop = useCallback(() => {
    const s = stateRef.current;
    const now = Date.now();

    if (s.phase === "show") {
      const elapsed = now - s.phaseStart;
      s.showProgress = Math.min(1, elapsed / SHOW_DURATION);
      if (elapsed >= SHOW_DURATION) {
        s.phase = "fade";
        s.phaseStart = now;
        s.fadeAlpha = 1;
        setDisplayPhase("fade");
      }
    } else if (s.phase === "fade") {
      const elapsed = now - s.phaseStart;
      s.fadeAlpha = Math.max(0, 1 - elapsed / FADE_DURATION);
      if (elapsed >= FADE_DURATION) {
        s.phase = "draw";
        s.fadeAlpha = 0;
        s.playerPoints = [];
        setDisplayPhase("draw");
      }
    }

    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  // ─── Score computation ────────────────────────────────────────────────────
  const computeScore = useCallback((round: number, playerPts: [number, number][]): number => {
    if (playerPts.length < 2) return 0;
    const raphPath = RAPH_PATHS[round];
    const sampled = samplePath(raphPath, 20);
    let totalDist = 0;
    for (const [rx, ry] of sampled) {
      totalDist += minDistToPolyline(rx, ry, playerPts);
    }
    const avgDist = totalDist / sampled.length;
    return Math.max(0, Math.round(100 - avgDist / 2));
  }, []);

  // ─── Touch ────────────────────────────────────────────────────────────────
  const toCanvas = useCallback(
    (e: React.TouchEvent | React.MouseEvent): [number, number] => {
      const canvas = canvasRef.current;
      if (!canvas) return [0, 0];
      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      return [
        (clientX - rect.left) / scale,
        (clientY - rect.top) / scale,
      ];
    },
    [scale]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      if (s.phase === "ready" || s.phase === "done") {
        stateRef.current = { ...makeInitState(), phase: "show", phaseStart: Date.now() };
        setDisplayPhase("show");
        setDisplayRound(0);
        return;
      }
      if (s.phase === "score") {
        // Go to next round or done
        if (s.round < ROUNDS - 1) {
          const nextRound = s.round + 1;
          s.round = nextRound;
          s.phase = "show";
          s.phaseStart = Date.now();
          s.showProgress = 0;
          s.fadeAlpha = 1;
          s.playerPoints = [];
          setDisplayPhase("show");
          setDisplayRound(nextRound);
        } else {
          s.phase = "done";
          setDisplayPhase("done");
          const total = s.roundScores.reduce((a, b) => a + b, 0);
          setDisplayScore(Math.round(total / s.roundScores.length));
        }
        return;
      }
      if (s.phase === "draw") {
        const pos = toCanvas(e);
        s.playerPoints = [pos];
      }
    },
    [toCanvas]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      if (s.phase !== "draw") return;
      const pos = toCanvas(e);
      s.playerPoints.push(pos);
    },
    [toCanvas]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      if (s.phase !== "draw") return;
      if (s.playerPoints.length < 2) return;

      // Score the drawn path
      const score = computeScore(s.round, s.playerPoints);
      s.currentScore = score;
      s.roundScores = [...s.roundScores, score];
      s.phase = "score";
      setDisplayPhase("score");
      setDisplayScore(score);
    },
    [computeScore]
  );

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
            if (s.phase === "ready" || s.phase === "done") {
              stateRef.current = { ...makeInitState(), phase: "show", phaseStart: Date.now() };
              setDisplayPhase("show");
              setDisplayRound(0);
            } else if (s.phase === "score") {
              if (s.round < ROUNDS - 1) {
                const nextRound = s.round + 1;
                s.round = nextRound;
                s.phase = "show";
                s.phaseStart = Date.now();
                s.showProgress = 0;
                s.fadeAlpha = 1;
                s.playerPoints = [];
                setDisplayPhase("show");
                setDisplayRound(nextRound);
              } else {
                s.phase = "done";
                setDisplayPhase("done");
              }
            }
          }}
        />
      </div>
      <p className="text-mist text-xs mt-2 text-center px-4">
        Observe · mémorise · reproduis · {ROUNDS} manches
      </p>
    </div>
  );
}
