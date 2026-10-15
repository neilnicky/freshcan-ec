import * as THREE from "three";

/**
 * Procedural Fresh Can: clear PET body, cloudy coconut water, aluminium lid
 * with pull tab, and the traced logo printed on the front. Proportions follow
 * a standard 330 ml can (66 × 122 mm); other formats scale the body.
 */

const R = 0.5;
const H = 1.84;
const LIQUID_MAX = H - 0.24;

export interface CanOptions {
  logo: HTMLCanvasElement | null;
  droplets: boolean;
  segments?: number;
}

export interface FreshCan {
  group: THREE.Group;
  setLevel(level: number): void;
  setFormat(heightScale: number, widthScale: number): void;
  setSlosh(x: number, z: number): void;
  dispose(): void;
}

function bodyProfile(): THREE.Vector2[] {
  const pts: [number, number][] = [
    [0.0, 0.035],
    [0.2, 0.02],
    [0.36, 0.0],
    [0.44, 0.008],
    [0.485, 0.03],
    [R, 0.08],
    [R, H - 0.2],
    [0.488, H - 0.14],
    [0.452, H - 0.075],
    [0.44, H - 0.035],
    [0.445, H - 0.012],
  ];
  return pts.map(([r, y]) => new THREE.Vector2(r, y));
}

/** Normal map of condensation droplets, generated once per page. */
export function dropletNormalMap(size = 512, count = 340, seed = 7): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = 128;
    d[i + 1] = 128;
    d[i + 2] = 255;
    d[i + 3] = 255;
  }
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let n = 0; n < count; n++) {
    const r = 2 + Math.pow(rand(), 2.4) * 11;
    const cx = rand() * size;
    const cy = rand() * size;
    const sy = 1 + rand() * 0.5; // droplets sag a little
    for (let y = Math.floor(cy - r * sy); y <= cy + r * sy; y++) {
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const dx = (x - cx) / r;
        const dy = (y - cy) / (r * sy);
        const q = dx * dx + dy * dy;
        if (q >= 1) continue;
        const px = ((x % size) + size) % size;
        const py = ((y % size) + size) % size;
        const nz = Math.sqrt(1 - q);
        const o = (py * size + px) * 4;
        d[o] = 128 + dx * 110;
        d[o + 1] = 128 - dy * 110;
        d[o + 2] = 128 + nz * 127;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  return tex;
}

/** Rasterise the logo SVG (black on transparent) for the label decal. */
export async function logoCanvas(url: string, width = 1024): Promise<HTMLCanvasElement | null> {
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    const ratio = img.naturalHeight / img.naturalWidth || 731 / 858;
    const c = document.createElement("canvas");
    c.width = width;
    c.height = Math.round(width * ratio);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c;
  } catch {
    return null;
  }
}

/**
 * Clear-material look for a canvas that sits over the page: the HTML behind
 * shows through, while edges (fresnel) and specular highlights gain opacity,
 * which is how a clear can reads in the brand's packshots.
 */
function glass<T extends THREE.Material>(mat: T, k: { edge: number; highlight: number }): T {
  // The canvas composites premultiplied colour; without this, low-alpha glass reads as white.
  mat.premultipliedAlpha = true;
  mat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      `float fc_f = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 2.2);
      float fc_l = max(max(outgoingLight.r, outgoingLight.g), outgoingLight.b);
      diffuseColor.a = clamp(diffuseColor.a + fc_f * ${k.edge.toFixed(2)} + smoothstep(0.7, 1.0, fc_l) * ${k.highlight.toFixed(2)}, 0.0, 1.0);
      #include <opaque_fragment>`,
    );
  };
  return mat;
}

let sharedShadow: THREE.CanvasTexture | null = null;
function shadowTexture(): THREE.CanvasTexture {
  if (sharedShadow) return sharedShadow;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(17,18,16,0.45)");
  g.addColorStop(0.5, "rgba(17,18,16,0.14)");
  g.addColorStop(1, "rgba(17,18,16,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  sharedShadow = new THREE.CanvasTexture(c);
  return sharedShadow;
}

let sharedDroplets: THREE.CanvasTexture | null = null;

export function createCan(opts: CanOptions): FreshCan {
  const seg = opts.segments ?? 72;
  const group = new THREE.Group();
  const inner = new THREE.Group(); // origin at can bottom; group is centred
  group.add(inner);
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

  if (opts.droplets && !sharedDroplets) sharedDroplets = dropletNormalMap();

  // Clear PET shell
  const bodyGeo = track(new THREE.LatheGeometry(bodyProfile(), seg));
  // Lathe V follows profile point index; remap by height so droplets stay round
  const pos = bodyGeo.attributes.position!;
  const uv = bodyGeo.attributes.uv!;
  for (let i = 0; i < uv.count; i++) uv.setY(i, pos.getY(i) / H);
  uv.needsUpdate = true;
  const bodyMat = track(
    glass(
      new THREE.MeshPhysicalMaterial({
        // Black base: clear PET has no diffuse colour, only reflections
        color: 0x000000,
        metalness: 0,
        roughness: 0.06,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.6,
        normalMap: opts.droplets ? sharedDroplets : null,
        normalScale: new THREE.Vector2(0.6, 0.6),
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      { edge: 0.55, highlight: 0.9 },
    ),
  );
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.renderOrder = 2;
  inner.add(body);

  // Soft contact shadow, so the can sits on the page like a packshot
  const shadow = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: shadowTexture(), color: 0x000000, depthWrite: false, depthTest: false, toneMapped: false })));
  shadow.center.set(0.5, 0.62);
  shadow.renderOrder = 0;
  inner.add(shadow);

  // Coconut water: unit-height cylinder scaled by level, plus a tilting surface
  const liquid = new THREE.Group();
  const liqMat = track(
    glass(
      new THREE.MeshPhysicalMaterial({
        color: 0xb4baac,
        roughness: 0.4,
        envMapIntensity: 0.45,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      }),
      { edge: 0.3, highlight: 0.12 },
    ),
  );
  const liqGeo = track(new THREE.CylinderGeometry(R - 0.02, R - 0.02, 1, seg, 1, true));
  liqGeo.translate(0, 0.5, 0);
  const column = new THREE.Mesh(liqGeo, liqMat);
  column.position.y = 0.03;
  liquid.add(column);
  const surfGeo = track(new THREE.CircleGeometry(R - 0.02, seg));
  surfGeo.rotateX(-Math.PI / 2);
  const surface = new THREE.Mesh(surfGeo, liqMat);
  liquid.add(surface);
  const bottomGeo = track(new THREE.CircleGeometry(R - 0.02, seg));
  bottomGeo.rotateX(Math.PI / 2);
  const bottom = new THREE.Mesh(bottomGeo, liqMat);
  bottom.position.y = 0.03;
  liquid.add(bottom);
  inner.add(liquid);

  // Aluminium lid
  const lid = new THREE.Group();
  const alu = track(new THREE.MeshStandardMaterial({ color: 0xd4d8d9, metalness: 1, roughness: 0.26, envMapIntensity: 1.1 }));
  const rim = new THREE.Mesh(track(new THREE.TorusGeometry(0.438, 0.024, 14, seg)), alu);
  rim.rotation.x = Math.PI / 2;
  lid.add(rim);
  const discGeo = track(new THREE.CylinderGeometry(0.43, 0.43, 0.012, seg));
  const disc = new THREE.Mesh(discGeo, alu);
  disc.position.y = -0.022;
  lid.add(disc);
  const tabShape = new THREE.Shape();
  tabShape.absarc(0, 0.06, 0.07, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0.075, 0.035, 0, Math.PI * 2, true);
  tabShape.holes.push(hole);
  const tabGeo = track(new THREE.ExtrudeGeometry(tabShape, { depth: 0.008, bevelEnabled: false }));
  const tab = new THREE.Mesh(tabGeo, alu);
  tab.rotation.x = -Math.PI / 2;
  tab.scale.set(1, 1.6, 1);
  tab.position.set(0, -0.006, 0.02);
  lid.add(tab);
  const rivet = new THREE.Mesh(track(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 20)), alu);
  rivet.position.set(0, -0.008, 0.02);
  lid.add(rivet);
  inner.add(lid);

  // Printed logo
  let label: THREE.Mesh | null = null;
  if (opts.logo) {
    const tex = track(new THREE.CanvasTexture(opts.logo));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const labelH = 0.62;
    const arc = labelH * (opts.logo.width / opts.logo.height);
    const theta = arc / R;
    const geo = track(new THREE.CylinderGeometry(R + 0.004, R + 0.004, labelH, seg, 1, true, -theta / 2, theta));
    const mat = track(
      new THREE.MeshStandardMaterial({ map: tex, transparent: true, premultipliedAlpha: true, alphaTest: 0.35, roughness: 0.45, color: 0xffffff, depthWrite: false }),
    );
    label = new THREE.Mesh(geo, mat);
    label.renderOrder = 3;
    inner.add(label);
  }

  let hs = 1;
  let ws = 1;
  let level = 1;
  let sx = 0;
  let sz = 0;

  function layout() {
    const h = H * hs;
    inner.position.y = -h / 2;
    body.scale.set(ws, hs, ws);
    shadow.scale.set(1.9 * ws, 0.34, 1);
    lid.position.y = h - 0.012 * hs;
    lid.scale.set(ws, 1, ws);
    if (label) {
      label.position.y = h * 0.53;
      label.scale.set(ws, 1, ws);
    }
    const lv = Math.max(0, Math.min(1, level));
    liquid.visible = lv > 0.004;
    column.scale.set(ws, Math.max(0.0001, lv * LIQUID_MAX * hs), ws);
    surface.scale.set(ws, 1, ws);
    surface.position.y = 0.03 + lv * LIQUID_MAX * hs;
    surface.rotation.set(sx * lv, 0, sz * lv);
    bottom.scale.set(ws, 1, ws);
  }
  layout();

  return {
    group,
    setLevel(v) {
      level = v;
      layout();
    },
    setFormat(h, w) {
      hs = h;
      ws = w;
      layout();
    },
    setSlosh(x, z) {
      sx = x;
      sz = z;
      layout();
    },
    dispose() {
      disposables.forEach((d) => d.dispose());
    },
  };
}

export const CAN_HEIGHT = H;
