import { content } from "@/content/freshcan-content";
import { motion } from "./config";
import { env, onFrame, onResize } from "./runtime";
import { segmentDistance, trailRibbon, type TrailPoint } from "./geometry";

/**
 * "Abre el coco": the footer slicing game. Coconuts are
 * tossed up; a pointer swipe through one splits it and adds millilitres to the
 * can. Pure 2D canvas, active only while the footer is on screen.
 */

interface Coco {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  rot: number;
  vr: number;
  cut: boolean;
  /** Half separation after a cut. */
  split: number;
  angle: number;
}
interface Drop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export function initGame(): void {
  const canvas = document.querySelector<HTMLCanvasElement>("[data-game]");
  const footer = document.querySelector<HTMLElement>("[data-footer]");
  const main = document.querySelector<HTMLElement>("main");
  if (!canvas || !footer || !main) return;
  const intro = footer.querySelector<HTMLElement>("[data-game-intro]");
  if (env.reduced) {
    intro?.remove();
    canvas.remove();
    return;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const scoreEl = footer.querySelector<HTMLElement>("[data-game-score]");
  const fillEl = footer.querySelector<HTMLElement>("[data-game-fill]");
  const winEl = footer.querySelector<HTMLElement>("[data-game-win]");
  const restart = footer.querySelector<HTMLButtonElement>("[data-game-restart]");
  const cfg = motion.game;
  const goal = content.game.goal;

  let w = 0;
  let h = 0;
  let dpr = 1;
  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  };
  resize();
  onResize(resize);

  const cocos: Coco[] = [];
  const drops: Drop[] = [];
  const trail: TrailPoint[] = [];
  let ml = 0;
  let won = false;
  let spawnIn = 400;
  let started = false;

  const setScore = (v: number) => {
    ml = v;
    if (scoreEl) scoreEl.textContent = String(ml).padStart(3, "0");
    fillEl?.style.setProperty("--fill", String(Math.min(1, ml / goal)));
  };

  const spawn = () => {
    const r = Math.max(26, Math.min(48, w * 0.032));
    const x = w * (0.15 + Math.random() * 0.7);
    cocos.push({
      x,
      y: h + r,
      vx: (w / 2 - x) * (0.25 + Math.random() * 0.35),
      // launch speed for an apex at 55–85% of the footer height
      vy: -Math.sqrt(2 * cfg.gravity * h * (0.55 + Math.random() * 0.3)),
      r,
      rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 4,
      cut: false,
      split: 0,
      angle: 0,
    });
  };

  const slice = (ax: number, ay: number, bx: number, by: number) => {
    for (const c of cocos) {
      if (c.cut) continue;
      if (segmentDistance(ax, ay, bx, by, c.x, c.y) > c.r) continue;
      c.cut = true;
      c.angle = Math.atan2(by - ay, bx - ax);
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 120 + Math.random() * 320;
        drops.push({ x: c.x, y: c.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 180, life: 1 });
      }
      if (!started) {
        started = true;
        intro?.classList.add("is-gone");
      }
      if (!won) {
        setScore(Math.min(goal, ml + cfg.mlPerCoconut));
        if (ml >= goal) {
          won = true;
          winEl?.classList.add("is-on");
          if (restart) restart.hidden = false;
          window.setTimeout(() => winEl?.classList.remove("is-on"), 2200);
        }
      }
    }
  };

  let last: { x: number; y: number } | null = null;
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    const p = { x: e.clientX - r.left, y: e.clientY - r.top };
    // Touch slices only while the finger is down; mouse slices on movement
    if (e.pointerType !== "mouse" && e.buttons === 0) {
      last = null;
      return;
    }
    if (last) slice(last.x, last.y, p.x, p.y);
    trail.push({ ...p, t: performance.now() });
    last = p;
  });
  canvas.addEventListener("pointerleave", () => (last = null));
  canvas.addEventListener("pointerup", () => (last = null));

  restart?.addEventListener("click", () => {
    won = false;
    restart.hidden = true;
    setScore(0);
  });

  const drawCoco = (c: Coco) => {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    const halves = c.cut ? [-1, 1] : [0];
    for (const side of halves) {
      ctx.save();
      if (c.cut) {
        ctx.rotate(c.angle - c.rot);
        ctx.translate(0, side * c.split);
        ctx.beginPath();
        ctx.arc(0, 0, c.r, side < 0 ? Math.PI : 0, side < 0 ? Math.PI * 2 : Math.PI);
        ctx.closePath();
        ctx.clip();
      }
      const g = ctx.createRadialGradient(-c.r * 0.35, -c.r * 0.4, c.r * 0.1, 0, 0, c.r);
      g.addColorStop(0, "#9fbd4a");
      g.addColorStop(0.55, "#6d8a2b");
      g.addColorStop(1, "#3c4618");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, c.r, 0, Math.PI * 2);
      ctx.fill();
      if (c.cut) {
        // white flesh and coconut water at the cut face
        ctx.fillStyle = "#f4f6f5";
        ctx.beginPath();
        ctx.ellipse(0, 0, c.r * 0.86, c.r * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e7ebe0";
        ctx.beginPath();
        ctx.ellipse(0, 0, c.r * 0.66, c.r * 0.13, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.beginPath();
        ctx.ellipse(-c.r * 0.35, -c.r * 0.45, c.r * 0.28, c.r * 0.14, -0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2c3410";
        ctx.beginPath();
        ctx.arc(c.r * 0.15, -c.r * 0.92, c.r * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  };

  const visible = () => main.getBoundingClientRect().bottom < window.innerHeight * 0.6;

  onFrame((now, dtMs) => {
    if (document.hidden) return;
    const on = visible();
    if (!on && !cocos.length) return;
    const dt = Math.min(0.05, dtMs / 1000);
    if (on && !won) {
      spawnIn -= dtMs;
      if (spawnIn <= 0) {
        spawn();
        if (Math.random() < 0.3) spawn();
        spawnIn = cfg.spawnEveryMs * (0.7 + Math.random() * 0.6);
      }
    }
    for (let i = cocos.length - 1; i >= 0; i--) {
      const c = cocos[i]!;
      c.vy += cfg.gravity * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.rot += c.vr * dt;
      if (c.cut) c.split += (c.r * 0.9 - c.split) * 0.12;
      if (c.y - c.r > h + 60 && c.vy > 0) cocos.splice(i, 1);
    }
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i]!;
      d.vy += cfg.gravity * 0.8 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.life -= dt * 1.4;
      if (d.life <= 0) drops.splice(i, 1);
    }
    while (trail.length && now - trail[0]!.t > cfg.trailMs) trail.shift();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    cocos.forEach(drawCoco);
    ctx.fillStyle = "#eef1ea";
    for (const d of drops) {
      ctx.globalAlpha = Math.max(0, d.life);
      ctx.beginPath();
      ctx.arc(d.x, d.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const { left, right } = trailRibbon(trail, now, cfg.trailMs, cfg.trailWidth / 2);
    if (left.length) {
      ctx.beginPath();
      for (let i = 1; i < left.length; i++) {
        ctx.moveTo(...left[i - 1]!);
        ctx.lineTo(...left[i]!);
        ctx.lineTo(...right[i]!);
        ctx.lineTo(...right[i - 1]!);
        ctx.closePath();
      }
      // Soft wide halo, a tight bright halo, then the crisp white blade.
      // shadowBlur ignores the transform, so it is scaled by dpr here.
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "rgba(255, 238, 190, 1)";
      ctx.shadowBlur = 26 * dpr;
      ctx.fill();
      ctx.shadowBlur = 10 * dpr;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fill();
    }
  });
}
