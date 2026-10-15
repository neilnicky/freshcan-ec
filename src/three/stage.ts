import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { CAN_HEIGHT, type FreshCan } from "./can";

/**
 * One WebGL context per canvas. A canvas can draw several cans, each into the
 * rectangle of a DOM element ("slot"), so the formats grid needs one context
 * instead of three.
 */

export interface Slot {
  can: FreshCan;
  /** Element whose box the can is drawn into; null = the whole canvas. */
  el: HTMLElement | null;
  /** Fraction of the slot height the 330 ml can occupies at scale 1. */
  fill: number;
  /** World-space placement inside the slot, in slot fractions. */
  x: number;
  y: number;
  scale: number;
  rotY: number;
  rotZ: number;
  rotX: number;
  visible: boolean;
}

export class CanStage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  readonly slots: Slot[] = [];
  private pmrem: THREE.PMREMGenerator;
  private envTex: THREE.Texture;
  private w = 0;
  private h = 0;

  constructor(
    readonly canvas: HTMLCanvasElement,
    private maxDpr: number,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setScissorTest(true);
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTex = this.pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
    this.scene.environment = this.envTex;

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(2.5, 3, 4);
    const rim = new THREE.DirectionalLight(0xe9f5c8, 1.1);
    rim.position.set(-3, 1.5, -2.5);
    this.scene.add(key, rim, new THREE.AmbientLight(0xffffff, 0.35));
    this.camera.position.set(0, 0, 8);
    this.resize();
  }

  add(can: FreshCan, el: HTMLElement | null, fill: number): Slot {
    const slot: Slot = { can, el, fill, x: 0, y: 0, scale: 1, rotY: 0, rotZ: 0, rotX: 0.06, visible: true };
    this.scene.add(can.group);
    this.slots.push(slot);
    return slot;
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    this.w = Math.max(1, Math.round(r.width));
    this.h = Math.max(1, Math.round(r.height));
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.w, this.h, false);
  }

  render() {
    const canvasRect = this.canvas.getBoundingClientRect();
    // Layout can settle after creation (fonts, lazy images); follow the element's size
    if (Math.round(canvasRect.width) !== this.w || Math.round(canvasRect.height) !== this.h) this.resize();
    this.renderer.setScissor(0, 0, this.w, this.h);
    this.renderer.setViewport(0, 0, this.w, this.h);
    this.renderer.clear();
    const fov = THREE.MathUtils.degToRad(this.camera.fov);
    const dist = this.camera.position.z;
    for (const s of this.slots) {
      if (!s.visible) continue;
      let left = 0;
      let top = 0;
      let w = this.w;
      let h = this.h;
      if (s.el) {
        const r = s.el.getBoundingClientRect();
        left = r.left - canvasRect.left;
        top = r.top - canvasRect.top;
        w = r.width;
        h = r.height;
        if (top > this.h || top + h < 0 || left > this.w || left + w < 0 || w < 2 || h < 2) continue;
      }
      // Hide every other can for this pass
      for (const o of this.slots) o.can.group.visible = o === s;
      const viewH = CAN_HEIGHT / s.fill;
      const viewW = viewH * (w / h);
      // Camera distance so that viewH world units fill the slot height
      this.camera.position.z = viewH / (2 * Math.tan(fov / 2));
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      const g = s.can.group;
      g.position.set(s.x * viewW, -s.y * viewH, 0);
      g.scale.setScalar(s.scale);
      g.rotation.set(s.rotX, s.rotY, s.rotZ);
      const y = this.h - top - h;
      this.renderer.setViewport(left, y, w, h);
      this.renderer.setScissor(left, y, w, h);
      this.renderer.render(this.scene, this.camera);
    }
    this.camera.position.z = dist;
  }

  dispose() {
    this.slots.forEach((s) => s.can.dispose());
    this.envTex.dispose();
    this.pmrem.dispose();
    this.renderer.dispose();
  }
}
