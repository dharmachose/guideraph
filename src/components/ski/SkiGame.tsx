"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { usePlayer } from "@/lib/player-context";
import { PLAYERS } from "@/data/players";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface Vec2 { x: number; y: number }
interface Seg  { x1: number; y1: number; x2: number; y2: number }

type Phase = "drawing" | "running" | "dead" | "win";

interface LevelDef {
  name: string;
  hint: string;
  worldWidth: number;
  terrain: Seg[];
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  trees: Vec2[];
  stars: (Vec2 & { collected: boolean })[];
}

// ─────────────────────────────────────────────
// PHYSICS CONSTANTS
// ─────────────────────────────────────────────
const GRAVITY   = 0.40;
const FRICTION  = 0.993;
const RADIUS    = 11;
const DEATH_Y   = 600;
const WIN_DIST  = 30;
const MAX_VX    = 16;
const STAR_R    = 14;

// ─────────────────────────────────────────────
// LEVELS
// ─────────────────────────────────────────────
function buildLevels(): LevelDef[] {
  return [
    {
      // Level 1 — one gap, almost entirely visible at start (worldWidth 440)
      name: "Combe Douce",
      hint: "Dessine un pont pour franchir la crevasse",
      worldWidth: 440,
      terrain: [
        { x1: -20, y1: 245, x2: 130, y2: 278 },
        // gap 130-200 (70 px) — 290>278 ✓
        { x1: 200, y1: 290, x2: 460, y2: 306 },
      ],
      startX: 55,  startY: 250,
      endX:   375, endY:   302,
      trees: [{ x: 320, y: 303 }],
      stars: [{ x: 278, y: 270, collected: false }],
    },
    {
      // Level 2 — two gaps, worldWidth 580
      name: "Couloir du Guide",
      hint: "Deux crevasses — trace les ponts !",
      worldWidth: 580,
      terrain: [
        { x1: -20, y1: 225, x2: 110, y2: 258 },
        // gap 110-180 (70 px) — 270>258 ✓
        { x1: 180, y1: 270, x2: 290, y2: 284 },
        // gap 290-360 (70 px) — 295>284 ✓
        { x1: 360, y1: 295, x2: 600, y2: 308 },
      ],
      startX: 48,  startY: 228,
      endX:   500, endY:   301,
      trees: [{ x: 242, y: 281 }, { x: 462, y: 305 }],
      stars: [
        { x: 238, y: 264, collected: false },
        { x: 420, y: 289, collected: false },
      ],
    },
    {
      // Level 3 — three gaps, worldWidth 720
      name: "Face Nord de la Grande Casse",
      hint: "Trois crevasses — la ligne de Raph !",
      worldWidth: 720,
      terrain: [
        { x1: -20, y1: 210, x2: 100, y2: 243 },
        // gap 100-170 (70 px) — 255>243 ✓
        { x1: 170, y1: 255, x2: 265, y2: 270 },
        // gap 265-335 (70 px) — 282>270 ✓
        { x1: 335, y1: 282, x2: 430, y2: 294 },
        // gap 430-500 (70 px) — 305>294 ✓
        { x1: 500, y1: 305, x2: 740, y2: 316 },
      ],
      startX: 44,  startY: 213,
      endX:   640, endY:   311,
      trees: [{ x: 218, y: 267 }, { x: 382, y: 291 }, { x: 576, y: 313 }],
      stars: [
        { x: 214, y: 249, collected: false },
        { x: 378, y: 275, collected: false },
        { x: 560, y: 297, collected: false },
      ],
    },
  ];
}

// ─────────────────────────────────────────────
// GEOMETRY HELPERS
// ─────────────────────────────────────────────
function closestOnSeg(px: number, py: number, s: Seg) {
  const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 0.001) return { x: s.x1, y: s.y1 };
  const t = Math.max(0, Math.min(1, ((px - s.x1) * dx + (py - s.y1) * dy) / lenSq));
  return { x: s.x1 + t * dx, y: s.y1 + t * dy };
}

function segFromPoints(pts: Vec2[]): Seg[] {
  const segs: Seg[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    segs.push({ x1: pts[i].x, y1: pts[i].y, x2: pts[i+1].x, y2: pts[i+1].y });
  }
  return segs;
}

// ─────────────────────────────────────────────
// RESOLVE COLLISION (circle vs segment)
// ─────────────────────────────────────────────
function resolveCollisions(
  px: number, py: number,
  vx: number, vy: number,
  allSegs: Seg[]
): { px: number; py: number; vx: number; vy: number; onGround: boolean; groundSeg: Seg | null } {
  let onGround = false;
  let groundSeg: Seg | null = null;

  for (let iter = 0; iter < 4; iter++) {
    for (const s of allSegs) {
      const cp = closestOnSeg(px, py, s);
      const nx = px - cp.x;
      const ny = py - cp.y;
      const dist = Math.hypot(nx, ny);

      if (dist < RADIUS && dist > 0.001) {
        // Normal pointing away from surface
        const nnx = nx / dist;
        const nny = ny / dist;

        // Remove full normal-velocity component (perfectly inelastic — no bouncing)
        const dot = vx * nnx + vy * nny;
        if (dot < 0) {
          vx -= dot * nnx;
          vy -= dot * nny;
        }

        // Push out
        px = cp.x + nnx * (RADIUS + 0.5);
        py = cp.y + nny * (RADIUS + 0.5);

        // If normal points upward (nny < -0.3) → standing on ground
        if (nny < -0.3) { onGround = true; groundSeg = s; }
      }
    }
  }

  return { px, py, vx, vy, onGround, groundSeg };
}

// ─────────────────────────────────────────────
// DRAW HELPERS
// ─────────────────────────────────────────────
function drawSnowSlope(ctx: CanvasRenderingContext2D, segs: Seg[], camX: number, h: number) {
  if (segs.length === 0) return;
  ctx.save();
  ctx.fillStyle = "#E8F4F8";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (const s of segs) {
    const x1 = s.x1 - camX, x2 = s.x2 - camX;
    // Draw snow body below the segment
    ctx.beginPath();
    ctx.moveTo(x1, s.y1);
    ctx.lineTo(x2, s.y2);
    ctx.lineTo(x2, h + 50);
    ctx.lineTo(x1, h + 50);
    ctx.closePath();
    ctx.fill();
    // White surface line
    ctx.beginPath();
    ctx.moveTo(x1, s.y1);
    ctx.lineTo(x2, s.y2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  // Trunk
  ctx.fillStyle = "#6B4423";
  ctx.fillRect(x - 3, y - 8, 6, 10);
  // Layers
  const layers = [
    { w: 20, h: 14, dy: -18 },
    { w: 16, h: 12, dy: -28 },
    { w: 12, h: 10, dy: -36 },
  ];
  for (const l of layers) {
    ctx.fillStyle = "#2D6A3F";
    ctx.beginPath();
    ctx.moveTo(x, y + l.dy - l.h);
    ctx.lineTo(x + l.w / 2, y + l.dy);
    ctx.lineTo(x - l.w / 2, y + l.dy);
    ctx.closePath();
    ctx.fill();
    // Snow on top
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.moveTo(x, y + l.dy - l.h);
    ctx.lineTo(x + l.w / 3, y + l.dy - 2);
    ctx.lineTo(x - l.w / 3, y + l.dy - 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const bounce = Math.sin(t * 0.05) * 3;
  ctx.save();
  ctx.translate(x, y + bounce);
  ctx.font = "20px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("⭐", 0, 0);
  ctx.restore();
}

function drawFlag(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = "#E8804A";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 50);
  ctx.stroke();
  ctx.fillStyle = "#E8804A";
  ctx.beginPath();
  ctx.moveTo(x, y - 50);
  ctx.lineTo(x + 24, y - 40);
  ctx.lineTo(x, y - 30);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Skier character — colored with the selected player's color
function drawSkier(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  vx: number,
  onGround: boolean,
  t: number,
  helmetColor: string,
  bodyColor: string,
  playerEmoji: string,
) {
  ctx.save();
  ctx.translate(x, y);

  const lean = Math.max(-0.5, Math.min(0.5, vx * 0.04));
  ctx.rotate(lean);

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(0, RADIUS + 2, RADIUS + 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Skis (player color)
  const skipBob = onGround ? Math.sin(t * 0.2) * 0.5 : 0;
  ctx.fillStyle = helmetColor;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.roundRect(-18, RADIUS - 2 + skipBob, 36, 5, 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Body (player body color)
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.roundRect(-7, -RADIUS + 4, 14, 18, 4);
  ctx.fill();

  // Scarf (white)
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.roundRect(-7, -RADIUS + 10, 14, 4, 2);
  ctx.fill();

  // Helmet (player helmet color)
  ctx.fillStyle = helmetColor;
  ctx.beginPath();
  ctx.arc(0, -RADIUS + 1, 9, 0, Math.PI * 2);
  ctx.fill();

  // Goggles
  ctx.fillStyle = "#1A2B3C";
  ctx.beginPath();
  ctx.arc(0, -RADIUS + 3, 5, -0.8, Math.PI + 0.8);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.arc(0, -RADIUS + 3, 3.5, -0.8, Math.PI + 0.8);
  ctx.fill();

  // Emoji name badge (tiny)
  ctx.font = "10px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(playerEmoji, 0, -RADIUS - 10);

  // Pole
  ctx.strokeStyle = "#94A3B8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(8, -RADIUS + 8);
  ctx.lineTo(18, RADIUS - 4);
  ctx.stroke();

  ctx.restore();
}

// Raph as guide — standing at the finish, waving
function drawRaphGuide(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  ctx.save();
  ctx.translate(x, y);

  // Wave arm animation
  const wave = Math.sin(t * 0.15) * 0.5;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.beginPath();
  ctx.ellipse(0, RADIUS + 2, RADIUS + 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Skis (Raph blue)
  ctx.fillStyle = "#85C1E9";
  ctx.beginPath();
  ctx.roundRect(-18, RADIUS - 2, 36, 5, 2);
  ctx.fill();

  // Body (Raph green jacket)
  ctx.fillStyle = "#2D6A3F";
  ctx.beginPath();
  ctx.roundRect(-7, -RADIUS + 4, 14, 18, 4);
  ctx.fill();

  // Waving arm
  ctx.save();
  ctx.translate(-7, -RADIUS + 6);
  ctx.rotate(wave - 1.2);
  ctx.fillStyle = "#2D6A3F";
  ctx.fillRect(-2, -12, 4, 12);
  ctx.restore();

  // Helmet (Raph orange)
  ctx.fillStyle = "#E8804A";
  ctx.beginPath();
  ctx.arc(0, -RADIUS + 1, 9, 0, Math.PI * 2);
  ctx.fill();

  // Goggles
  ctx.fillStyle = "#1A2B3C";
  ctx.beginPath();
  ctx.arc(0, -RADIUS + 3, 5, -0.8, Math.PI + 0.8);
  ctx.fill();
  ctx.fillStyle = "#5EADD4";
  ctx.beginPath();
  ctx.arc(0, -RADIUS + 3, 3.5, -0.8, Math.PI + 0.8);
  ctx.fill();

  // "Raph" label
  ctx.fillStyle = "#85C1E9";
  ctx.font = "bold 9px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Raph", 0, -RADIUS - 12);

  // Map emoji
  ctx.font = "12px serif";
  ctx.fillText("🗺️", 0, -RADIUS - 22);

  ctx.restore();
}

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, camX: number) {
  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#87CEEB");
  sky.addColorStop(0.6, "#E0F2FE");
  sky.addColorStop(1, "#DBEAFE");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Mountains (parallax 0.3)
  const px = camX * 0.3;
  ctx.fillStyle = "rgba(180, 210, 235, 0.6)";
  const mountains = [
    [0, 260, 200, 160, 400, 260],
    [250, 270, 450, 140, 650, 270],
    [500, 260, 720, 170, 940, 260],
    [800, 270, 1050, 130, 1300, 270],
  ];
  for (const m of mountains) {
    ctx.beginPath();
    ctx.moveTo(m[0] - px % 1200, m[1]);
    ctx.lineTo(m[2] - px % 1200, m[3]);
    ctx.lineTo(m[4] - px % 1200, m[5]);
    ctx.closePath();
    ctx.fill();
    // Snow cap
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    const mx = m[2] - px % 1200;
    const my = m[3];
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(mx + 35, my + 45);
    ctx.lineTo(mx - 35, my + 45);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(180, 210, 235, 0.6)";
  }
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
interface SkiGameProps {
  onBack?: () => void;
}

export function SkiGame({ onBack }: SkiGameProps) {
  const { player, openSelector } = usePlayer();

  // Resolve player display — Raph defaults to Raph player data
  const raphPlayer = PLAYERS.find((p) => p.id === "raph")!;
  const activePlayer = player ?? raphPlayer;

  // Two-tone: helmet = player color, body = darker variant
  const helmetColor = activePlayer.color;
  const bodyColor   = activePlayer.color + "BB"; // slightly transparent for jacket feel
  const playerEmoji = activePlayer.emoji;
  const playerName  = activePlayer.name;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    phase: "drawing" as Phase,
    px: 0, py: 0, vx: 0, vy: 0,
    camX: 0,
    drawnLines: [] as Vec2[][],
    currentLine: null as Vec2[] | null,
    levelIdx: 0,
    levels: buildLevels(),
    level: null as LevelDef | null,
    stars: [] as (Vec2 & { collected: boolean })[],
    score: 0,
    t: 0,
    deathCountdown: 0,
    winCountdown: 0,
    isDrawing: false,
  });
  const rafRef = useRef<number | null>(null);
  const [uiPhase, setUiPhase]       = useState<Phase>("drawing");
  const [levelIdx, setLevelIdx]      = useState(0);
  const [score, setScore]            = useState(0);
  const [totalStars, setTotalStars]  = useState(0);
  const [lineCount, setLineCount]    = useState(0);
  const [canvasSize, setCanvasSize]  = useState({ w: 360, h: 500 });
  const [displaySize, setDisplaySize] = useState({ w: 360, h: 500 });

  // ── Init level ──────────────────────────────
  const initLevel = useCallback((idx: number) => {
    const s = stateRef.current;
    const levels = buildLevels();
    const level  = levels[idx];
    s.levelIdx   = idx;
    s.levels     = levels;
    s.level      = level;
    s.px         = level.startX;
    s.py         = level.startY;
    s.vx         = 0;
    s.vy         = 0;
    s.camX       = 0;            // show level from the left — compact levels fit the canvas
    s.drawnLines = [];
    s.currentLine = null;
    s.phase       = "drawing";  // draw bridges first, then launch
    s.stars       = level.stars.map(st => ({ ...st, collected: false }));
    s.score       = 0;
    s.t           = 0;
    s.deathCountdown = 0;
    s.winCountdown   = 0;
    s.isDrawing      = false;

    setUiPhase("drawing");
    setLevelIdx(idx);
    setScore(0);
    setTotalStars(level.stars.length);
    setLineCount(0);
  }, [canvasSize.w]);

  // ── Canvas size ─────────────────────────────
  useEffect(() => {
    function measure() {
      const w = Math.min(window.innerWidth, 600);
      // Game coordinate space: terrain y-values go up to ~460px, need 500px height
      const COORD_H = 500;
      setCanvasSize({ w, h: COORD_H });

      // Scale canvas to fit available viewport (PageHeader≈56 + level bar≈44 +
      // controls≈54 + BottomNav padding≈72 = ~226px of UI chrome)
      const availH = Math.max(240, window.innerHeight - 226);
      const scale = Math.min(1, availH / COORD_H);
      setDisplaySize({ w: Math.round(w * scale), h: Math.round(COORD_H * scale) });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // ── Start/switch level ───────────────────────
  useEffect(() => {
    initLevel(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-init when canvas size changes (only if in drawing phase)
  useEffect(() => {
    if (stateRef.current.level) {
      const s = stateRef.current;
      s.camX = Math.max(0, s.px - canvasSize.w * 0.3);
    }
  }, [canvasSize]);

  // ── Input helpers ────────────────────────────
  function getCanvasPos(e: React.TouchEvent | React.MouseEvent | TouchEvent | MouseEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let cx: number, cy: number;
    if ("touches" in e) {
      const t = (e as TouchEvent).touches[0] ?? (e as TouchEvent).changedTouches[0];
      cx = (t.clientX - rect.left) * scaleX;
      cy = (t.clientY - rect.top) * scaleY;
    } else {
      cx = ((e as MouseEvent).clientX - rect.left) * scaleX;
      cy = ((e as MouseEvent).clientY - rect.top) * scaleY;
    }
    return { x: cx + stateRef.current.camX, y: cy }; // world coords
  }

  function startDraw(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    const s = stateRef.current;
    if (s.phase !== "drawing" && s.phase !== "running") return;
    const pt = getCanvasPos(e as unknown as TouchEvent | MouseEvent);
    s.currentLine = [pt];
    s.isDrawing = true;
  }

  function moveDraw(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    const s = stateRef.current;
    if (!s.isDrawing || (s.phase !== "drawing" && s.phase !== "running") || !s.currentLine) return;
    const pt = getCanvasPos(e as unknown as TouchEvent | MouseEvent);
    const last = s.currentLine[s.currentLine.length - 1];
    if (Math.hypot(pt.x - last.x, pt.y - last.y) > 5) {
      s.currentLine.push(pt);
    }
  }

  function endDraw(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    const s = stateRef.current;
    if (!s.isDrawing) return;
    s.isDrawing = false;
    if (s.currentLine && s.currentLine.length >= 2) {
      s.drawnLines.push(s.currentLine);
      setLineCount(s.drawnLines.length);
    }
    s.currentLine = null;
  }

  // ── Launch ───────────────────────────────────
  function launchRaph() {
    const s = stateRef.current;
    if (s.phase !== "drawing") return;
    s.phase = "running";
    s.vx    = 2;
    setUiPhase("running");
  }

  // ── Undo last line ───────────────────────────
  function undoLine() {
    const s = stateRef.current;
    if (s.drawnLines.length > 0) {
      s.drawnLines.pop();
      setLineCount(s.drawnLines.length);
    }
  }

  // ── Reset level ──────────────────────────────
  function resetLevel() {
    initLevel(stateRef.current.levelIdx);
  }

  // ── Next level ───────────────────────────────
  function nextLevel() {
    const next = stateRef.current.levelIdx + 1;
    if (next < stateRef.current.levels.length) {
      initLevel(next);
    }
  }

  // ── Animation loop ───────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const safeCtx = ctx;

    function tick() {
      rafRef.current = requestAnimationFrame(tick);
      const s = stateRef.current;
      if (!s.level) return;
      const ctx = safeCtx;

      const W = canvasSize.w;
      const H = canvasSize.h;
      s.t++;

      // ── PHYSICS ──────────────────────────────
      if (s.phase === "running") {
        // Gravity
        s.vy += GRAVITY;

        // Friction
        s.vx *= FRICTION;
        s.vy *= FRICTION;

        // Clamp horizontal speed
        s.vx = Math.max(-MAX_VX, Math.min(MAX_VX, s.vx));

        // Tentative move
        s.px += s.vx;
        s.py += s.vy;

        // Build all collidable segments
        const allSegs: Seg[] = [
          ...s.level.terrain,
          ...s.drawnLines.flatMap(l => segFromPoints(l)),
        ];

        // Resolve
        const res = resolveCollisions(s.px, s.py, s.vx, s.vy, allSegs);
        s.px = res.px; s.py = res.py;
        s.vx = res.vx; s.vy = res.vy;

        // Snow Line feel: align velocity to surface tangent when on ground
        if (res.onGround && res.groundSeg) {
          const seg = res.groundSeg;
          const sdx = seg.x2 - seg.x1, sdy = seg.y2 - seg.y1;
          const slen = Math.hypot(sdx, sdy);
          if (slen > 0.001) {
            const tx = sdx / slen, ty = sdy / slen;
            const spd = s.vx * tx + s.vy * ty;
            if (spd > 0) { s.vx = tx * spd; s.vy = ty * spd; }
          }
        }

        // Camera follow
        const targetCamX = Math.max(0, Math.min(
          s.level.worldWidth - W,
          s.px - W * 0.35
        ));
        s.camX += (targetCamX - s.camX) * 0.08;

        // Star collection
        for (const star of s.stars) {
          if (!star.collected && Math.hypot(s.px - star.x, s.py - star.y) < STAR_R + RADIUS) {
            star.collected = true;
            s.score += 1;
            setScore(s.score);
          }
        }

        // Death check
        if (s.py > DEATH_Y) {
          s.phase = "dead";
          s.deathCountdown = 90;
          setUiPhase("dead");
        }

        // Win check
        if (Math.hypot(s.px - s.level.endX, s.py - s.level.endY) < WIN_DIST + RADIUS) {
          s.phase = "win";
          s.winCountdown = 120;
          setUiPhase("win");
        }
      }

      // ── RENDER ───────────────────────────────
      ctx.clearRect(0, 0, W, H);

      drawBackground(ctx, W, H, s.camX);

      // Snow terrain
      drawSnowSlope(ctx, s.level?.terrain ?? [], s.camX, H);

      // Trees
      for (const t of s.level?.trees ?? []) {
        drawTree(ctx, t.x - s.camX, t.y);
      }

      // Stars
      for (const star of s.stars) {
        if (!star.collected) {
          drawStar(ctx, star.x - s.camX, star.y, s.t);
        }
      }

      // Flag
      if (s.level) {
        drawFlag(ctx, s.level.endX - s.camX, s.level.endY);
      }

      // Player drawn lines
      ctx.save();
      ctx.strokeStyle = "#FF8B94";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(255,139,148,0.5)";
      ctx.shadowBlur = 6;
      for (const line of s.drawnLines) {
        if (line.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(line[0].x - s.camX, line[0].y);
        for (let i = 1; i < line.length; i++) {
          ctx.lineTo(line[i].x - s.camX, line[i].y);
        }
        ctx.stroke();
      }
      // Current line being drawn
      if (s.currentLine && s.currentLine.length >= 2) {
        ctx.strokeStyle = "#FF8B94";
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(s.currentLine[0].x - s.camX, s.currentLine[0].y);
        for (let i = 1; i < s.currentLine.length; i++) {
          ctx.lineTo(s.currentLine[i].x - s.camX, s.currentLine[i].y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.restore();

      // Raph waiting at finish
      if (s.level) {
        drawRaphGuide(ctx, s.level.endX - s.camX - 32, s.level.endY - RADIUS, s.t);
      }

      // Player skier
      drawSkier(ctx, s.px - s.camX, s.py, s.vx, s.phase === "running", s.t, helmetColor, bodyColor, playerEmoji);

      // Crevasse danger indicators (drawing + running)
      if ((s.phase === "drawing" || s.phase === "running") && s.level) {
        const segs = s.level.terrain;
        ctx.save();
        ctx.fillStyle = "#E8804A";
        ctx.font = "bold 14px system-ui";
        ctx.textAlign = "center";
        for (let i = 0; i < segs.length - 1; i++) {
          const gapX = (segs[i].x2 + segs[i + 1].x1) / 2 - s.camX;
          const gapY = (segs[i].y2 + segs[i + 1].y1) / 2 - 30;
          if (gapX > -20 && gapX < W + 20) {
            const pulse = 0.7 + Math.sin(s.t * 0.12) * 0.3;
            ctx.globalAlpha = pulse;
            ctx.fillText("⚠️", gapX, gapY);
          }
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // Hint overlay during first 300 frames (~5 s)
      if (s.t < 300 && s.t > 30 && s.level) {
        const alpha = Math.min(1, (s.t - 30) / 30) * Math.min(1, (300 - s.t) / 60);
        ctx.save();
        ctx.globalAlpha = alpha * 0.85;
        ctx.fillStyle = "#0F1923";
        ctx.beginPath();
        ctx.roundRect(W / 2 - 155, H - 70, 310, 36, 8);
        ctx.fill();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#5EADD4";
        ctx.font = "bold 11px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`✏️ Dessine un pont sur les crevasses ⚠️`, W / 2, H - 52);
        ctx.restore();
      }

      // HUD: score
      ctx.save();
      ctx.fillStyle = "rgba(15,25,35,0.7)";
      ctx.beginPath();
      ctx.roundRect(8, 8, 90, 32, 8);
      ctx.fill();
      ctx.fillStyle = "#FFE66D";
      ctx.font = "bold 14px system-ui";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`⭐ ${s.score}/${s.level?.stars.length ?? 0}`, 16, 24);
      ctx.restore();

      // Phase overlays
      if (s.phase === "dead") {
        ctx.save();
        ctx.fillStyle = "rgba(15,25,35,0.75)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#FF6B6B";
        ctx.font = `bold ${Math.round(W / 7)}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("CREVASSE !", W / 2, H / 2 - 30);
        ctx.fillStyle = "#F0F4F8";
        ctx.font = `${Math.round(W / 18)}px system-ui`;
        ctx.fillText(`${playerName} est tombé${activePlayer.id === "emili" ? "e" : ""} !`, W / 2, H / 2 + 10);
        ctx.restore();
      }

      if (s.phase === "win") {
        ctx.save();
        ctx.fillStyle = "rgba(15,25,35,0.8)";
        ctx.fillRect(0, 0, W, H);
        const pulse = 1 + Math.sin(s.t * 0.15) * 0.05;
        ctx.save();
        ctx.translate(W / 2, H / 2 - 40);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = "#FFE66D";
        ctx.font = `bold ${Math.round(W / 6.5)}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("T'as suivi Raph ! 🏔️", 0, 0);
        ctx.restore();
        ctx.fillStyle = "#4CAF82";
        ctx.font = `bold ${Math.round(W / 16)}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText(`Étoiles : ${s.score}/${s.level?.stars.length ?? 0}`, W / 2, H / 2 + 10);
        if (s.levelIdx < s.levels.length - 1) {
          ctx.fillStyle = "#85C1E9";
          ctx.font = `${Math.round(W / 20)}px system-ui`;
          ctx.fillText("Appuie sur «\u202fNiveau suivant\u202f»", W / 2, H / 2 + 38);
        }
        ctx.restore();
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [canvasSize]);

  const levelDef = stateRef.current.levels?.[levelIdx];

  return (
    <div className="flex flex-col items-center select-none">
      {/* Level info bar */}
      <div className="w-full flex items-center justify-between px-4 py-2 bg-alpine-mid border-b border-alpine-light">
        <div>
          <p className="text-glacier font-heading text-lg leading-none">
            {levelDef?.name ?? "…"}
          </p>
          <p className="text-mist text-[10px] leading-none mt-0.5">
            Niveau {levelIdx + 1}/{stateRef.current.levels?.length ?? 3}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Player badge */}
          <button
            onClick={openSelector}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border active:scale-95"
            style={{ borderColor: activePlayer.color + "66", backgroundColor: activePlayer.color + "22" }}
          >
            <span className="text-sm">{playerEmoji}</span>
            <span className="text-xs font-semibold" style={{ color: activePlayer.color }}>
              {playerName}
            </span>
          </button>
          <div className="text-right">
            <p className="text-snow text-xs font-semibold">⭐ {score}/{totalStars}</p>
            {uiPhase === "drawing" && lineCount > 0 && (
              <p className="text-mist text-[10px]">
                {lineCount} pont{lineCount > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={canvasSize.w}
        height={canvasSize.h}
        className="block touch-none"
        style={{ width: displaySize.w, height: displaySize.h, maxWidth: "100%" }}
        onMouseDown={startDraw}
        onMouseMove={moveDraw}
        onMouseUp={endDraw}
        onTouchStart={startDraw}
        onTouchMove={moveDraw}
        onTouchEnd={endDraw}
      />

      {/* Controls */}
      <div className="w-full px-4 py-3 flex gap-2 bg-alpine-dark border-t border-alpine-mid">
        {uiPhase === "drawing" && (
          <>
            <button
              onClick={undoLine}
              disabled={lineCount === 0}
              className="flex-none px-3 py-2.5 rounded-xl bg-alpine-mid text-mist text-sm font-semibold disabled:opacity-30 active:scale-95"
            >
              ↩ Effacer
            </button>
            <button
              onClick={launchRaph}
              className="flex-1 py-2.5 rounded-xl bg-glacier text-alpine-dark font-heading text-xl tracking-wide active:scale-95"
            >
              🎿 C&apos;est parti !
            </button>
          </>
        )}

        {uiPhase === "running" && (
          <button
            onClick={resetLevel}
            className="flex-1 py-2.5 rounded-xl bg-alpine-mid text-mist font-semibold text-sm active:scale-95"
          >
            ↩ Redessiner
          </button>
        )}

        {uiPhase === "dead" && (
          <button
            onClick={resetLevel}
            className="flex-1 py-2.5 rounded-xl bg-alpen-glow text-alpine-dark font-heading text-2xl tracking-wide active:scale-95"
          >
            🔄 Réessayer
          </button>
        )}

        {uiPhase === "win" && (
          <>
            <button
              onClick={resetLevel}
              className="px-4 py-2.5 rounded-xl bg-alpine-mid text-mist font-semibold text-sm active:scale-95"
            >
              ↩ Rejouer
            </button>
            {levelIdx < (stateRef.current.levels?.length ?? 1) - 1 ? (
              <button
                onClick={nextLevel}
                className="flex-1 py-2.5 rounded-xl bg-summit text-alpine-dark font-heading text-xl tracking-wide active:scale-95"
              >
                ➡ Niveau suivant
              </button>
            ) : (
              <button
                onClick={() => initLevel(0)}
                className="flex-1 py-2.5 rounded-xl bg-alpen-glow text-alpine-dark font-heading text-xl tracking-wide active:scale-95"
              >
                🏆 Recommencer
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
