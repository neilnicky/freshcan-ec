import type { ImageMetadata } from "astro";
import type { MediaKey } from "@/content/freshcan-content";

const files = import.meta.glob<{ default: ImageMetadata }>("../assets/media/*.jpg", { eager: true });

const byKey = new Map<string, ImageMetadata>(
  Object.entries(files).map(([path, mod]) => [path.split("/").pop()!.replace(/\.jpg$/, ""), mod.default]),
);

export function media(key: MediaKey): ImageMetadata {
  const img = byKey.get(key);
  if (!img) throw new Error(`Missing media asset: ${key}.jpg`);
  return img;
}
