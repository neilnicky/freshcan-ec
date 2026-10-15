import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { content, orderMessage, whatsappHref, type MediaKey } from "@/content/freshcan-content";
import { findRetiredCopy } from "../support/retired-copy";

const root = join(__dirname, "../..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
const srcFiles = (dir: string): string[] =>
  readdirSync(join(root, dir), { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? srcFiles(join(dir, d.name)) : /\.(astro|ts|css|svg)$/.test(d.name) ? [join(dir, d.name)] : [],
  );
// Tracked docs only; docs/internal is local working material and git-ignored.
const docFiles = () =>
  existsSync(join(root, "docs")) ? readdirSync(join(root, "docs")).filter((f) => f.endsWith(".md")).map((f) => join("docs", f)) : [];

describe("content: verified facts only", () => {
  it("lists exactly the three verified formats", () => {
    expect(content.formats.items.map((f) => f.ml)).toEqual([250, 330, 500]);
  });

  it("contains no prices or invented nutrition numbers", () => {
    const text = JSON.stringify(content);
    expect(text).not.toMatch(/\$\s?\d|USD|precio:|kcal|mg de|potasio/i);
  });

  it("does not claim the unconfirmed spots are stockists", () => {
    expect(content.ruta.retailer.verified).toBe(true);
    expect(content.ruta.spots.every((s) => s.verified === false)).toBe(true);
  });

  it("has no contact email until the brand provides one", () => {
    expect(content.contact.email).toBeNull();
  });
});

describe("content: links", () => {
  it("builds WhatsApp links to the number in the brand bio", () => {
    expect(whatsappHref()).toBe("https://wa.me/593939941356");
    const href = whatsappHref("Hola 👋 & más");
    expect(href.startsWith("https://wa.me/593939941356?text=")).toBe(true);
    expect(decodeURIComponent(href.split("text=")[1]!)).toBe("Hola 👋 & más");
  });

  it("writes a clear order message and clamps quantity", () => {
    expect(orderMessage({ ml: 330 }, 2)).toContain("2 latas de 330 ml");
    expect(orderMessage({ ml: 250 }, 1)).toContain("1 lata de 250 ml");
    expect(orderMessage({ ml: 500 }, 0)).toContain("1 lata de 500 ml");
  });

  it("points every Instagram reference at a real post or profile URL", () => {
    const urls = [content.contact.instagram, ...content.moments.items.map((m) => m.href), ...content.collage.photos.map((p) => p.source)];
    urls.forEach((u) => expect(u).toMatch(/^https:\/\/www\.instagram\.com\/[\w.]+\/((p|reel)\/[\w-]+\/)?$/));
  });

  it("nav targets exist as section ids", () => {
    const markup = srcFiles("src/components").map(read).join("\n");
    content.nav.items.forEach((i) => expect(markup).toContain(`id="${i.href.slice(1)}"`));
  });
});

describe("content: media", () => {
  const keys = new Set<MediaKey>([
    content.seo.ogImage,
    content.scene.photo.key,
    content.formats.photo.key,
    ...content.collage.photos.map((p) => p.key),
    ...content.moments.items.map((m) => m.media),
  ]);

  it("every referenced image exists locally", () => {
    keys.forEach((k) => expect(existsSync(join(root, "src/assets/media", `${k}.jpg`)), k).toBe(true));
  });

  it("meaningful images carry alt text and a focal point", () => {
    [content.scene.photo, content.formats.photo, ...content.collage.photos].forEach((m) => {
      expect(m.alt.length).toBeGreaterThan(10);
      expect(m.focus).toMatch(/^\d+% \d+%$/);
    });
  });
});

describe("source hygiene", () => {
  it("has no third-party brand names or placeholder copy in public files", () => {
    const files = [...srcFiles("src"), ...srcFiles("public"), "README.md", "package.json", "astro.config.mjs", ...docFiles()];
    files.forEach((f) => expect(findRetiredCopy(read(f)), f).toEqual([]));
  });
});
