import { createHash } from "node:crypto";

/**
 * SHA-256 of names and phrases that must never ship (third-party brand names,
 * placeholder copy). Stored hashed so the guard doesn't publish them itself.
 */
const RETIRED = new Set([
  "d336e339185c179718ec0de6ef707a14d1ce48606ab652ee29183fa9c91d55b5",
  "a511b6977030cd3b0170722def98a865e8124621c71a285cd9dcde7d1265008e",
  "0d60e564f2d463a65215e61f3da9dcac4a38a8ecc4da7eff3ca2b587acae365f",
]);
const MAX_WORDS = 4;

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

/** Returns every 1–4 word run in `text` whose hash is retired. */
export function findRetiredCopy(text: string): string[] {
  const words = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const hits = new Set<string>();
  for (let i = 0; i < words.length; i++) {
    for (let n = 1; n <= MAX_WORDS && i + n <= words.length; n++) {
      const run = words.slice(i, i + n).join(" ");
      if (RETIRED.has(sha(run))) hits.add(run);
    }
  }
  return [...hits];
}
