import logoUrl from "@/assets/brand/freshcan-logo.svg?url";
import { content } from "@/content/freshcan-content";
import { motion } from "./config";
import { env, onFrame, onResize, scrollY } from "./runtime";
import { keysFor, measureMarks, isCompact } from "./marks";
import { poseAt, mixPose, type Key, type Pose } from "./track";
import { webglAvailable } from "@/three/support";

/**
 * The hero can: one fixed canvas, posed every frame from scroll position
 * (choreography in track.ts). Resolves once the first frame is drawn so
 * the loader can wait for it.
 */
export async function initProtagonist(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>("[data-protagonist]");
  if (!canvas) return;
  if (!webglAvailable()) {
    document.documentElement.classList.add("no-webgl");
    canvas.remove();
    return;
  }
  const [{ createCan, logoCanvas }, { CanStage }] = await Promise.all([import("@/three/can"), import("@/three/stage")]);
  const logo = await logoCanvas(logoUrl);
  const stage = new CanStage(canvas, motion.can.maxDpr);
  const can = createCan({ logo, droplets: true });
  const slot = stage.add(can, null, 0.6);
  canvas.setAttribute("aria-label", content.hero.canAlt);

  let keys: Key[] = [];
  const measure = () => {
    const m = measureMarks();
    if (m) keys = keysFor(m);
    slot.fill = isCompact() ? 0.46 : 0.62;
    stage.resize();
  };
  measure();
  onResize(measure);

  const cfg = motion.can;
  let pose: Pose | null = null;
  let idle = 0;
  let lastY = scrollY();
  let slosh = 0;
  let sloshV = 0;
  let px = 0;
  let py = 0;
  let tx = 0;
  let ty = 0;
  if (env.finePointer && !env.reduced) {
    window.addEventListener(
      "pointermove",
      (e) => {
        tx = (e.clientX / window.innerWidth) * 2 - 1;
        ty = (e.clientY / window.innerHeight) * 2 - 1;
      },
      { passive: true },
    );
  }

  let visible = true;
  document.addEventListener("visibilitychange", () => (visible = !document.hidden));

  const draw = (dt: number) => {
    if (!keys.length) return;
    const y = scrollY();
    const target = poseAt(keys, y);
    pose = !pose || env.reduced ? target : mixPose(pose, target, Math.min(1, cfg.smoothing * (dt / 16.7) * 2));
    // Idle spin fades out as the hero scrolls away
    const heroWeight = Math.max(0, 1 - y / (window.innerHeight * 0.9));
    // Hero: a gentle sway that keeps the logo facing out, not a full spin
    if (!env.reduced) idle += dt / 1000;
    const sway = env.reduced ? 0 : Math.sin(idle * cfg.idleSpin * 2.4) * 0.55 * heroWeight;
    // Liquid slosh: spring driven by scroll velocity
    const v = y - lastY;
    lastY = y;
    if (!env.reduced) {
      sloshV += (Math.max(-cfg.slosh.max, Math.min(cfg.slosh.max, v * cfg.slosh.gain * 10)) - slosh) * cfg.slosh.stiffness;
      sloshV *= cfg.slosh.damping;
      slosh += sloshV;
    }
    px += (tx - px) * 0.06;
    py += (ty - py) * 0.06;

    const op = pose.opacity;
    canvas.style.opacity = String(op);
    if (op < 0.01) {
      canvas.style.visibility = "hidden";
      return;
    }
    canvas.style.visibility = "visible";
    slot.x = pose.x + px * 0.015;
    slot.y = pose.y;
    slot.scale = pose.scale;
    slot.rotY = pose.spin + sway;
    slot.rotZ = pose.tilt - px * cfg.pointerTilt * heroWeight;
    slot.rotX = 0.08 + py * cfg.pointerTilt * 0.5 * heroWeight;
    can.setLevel(pose.level);
    can.setSlosh(slosh, -slosh * 0.4);
    stage.render();
  };

  draw(16);
  if (env.reduced) {
    // Static render on scroll only
    let lastDrawn = -1;
    onFrame(() => {
      const y = Math.round(scrollY());
      if (y !== lastDrawn && visible) {
        lastDrawn = y;
        draw(16);
      }
    });
  } else {
    onFrame((_t, dt) => visible && draw(dt));
  }
}
