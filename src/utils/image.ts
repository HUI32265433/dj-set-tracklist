import { get as idbGet, set as idbSet } from 'idb-keyval';
import type { Track } from '../types/track';

/** Downscale an uploaded image to ≤512px and store its dataURL in IndexedDB. */
export async function saveUploadedCover(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('decode failed'));
    i.src = dataUrl;
  });
  const MAX = 512;
  const scale = Math.min(1, MAX / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  const key = `cover-${crypto.randomUUID()}`;
  await idbSet(key, canvas.toDataURL('image/jpeg', 0.85));
  return key;
}

/** Resolve the displayable cover for a track (local upload wins over remote). */
export async function resolveCover(track: Track): Promise<string | undefined> {
  if (track.coverKey) {
    try {
      const v = await idbGet<string>(track.coverKey);
      if (v) return v;
    } catch {
      /* fall through to remote */
    }
  }
  return track.coverUrl;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

async function sampleImage(url: string): Promise<RGB[]> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('img load failed'));
    img.src = url;
  });
  const S = 16;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, S, S);
  const data = ctx.getImageData(0, 0, S, S).data;
  const px: RGB[] = [];
  for (let i = 0; i < data.length; i += 4) {
    px.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
  }
  return px;
}

function saturation({ r, g, b }: RGB): number {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  return max === 0 ? 0 : (max - min) / max;
}

function toHex({ r, g, b }: RGB): string {
  const h = (n: number) => n.toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

/**
 * Analyze up to 6 covers and pick an accent color for the whole set:
 * the average of the most saturated quantized bucket, brightened for dark UI.
 * Returns null when nothing could be sampled (offline / CORS-blocked).
 */
export async function extractAccent(coverUrls: string[]): Promise<string | null> {
  const urls = coverUrls.filter(Boolean).slice(0, 6);
  if (!urls.length) return null;
  const buckets = new Map<string, { sum: RGB; count: number; sat: number }>();
  for (const url of urls) {
    try {
      for (const px of await sampleImage(url)) {
        const key = `${px.r >> 5}-${px.g >> 5}-${px.b >> 5}`;
        const b = buckets.get(key) ?? { sum: { r: 0, g: 0, b: 0 }, count: 0, sat: 0 };
        b.sum.r += px.r;
        b.sum.g += px.g;
        b.sum.b += px.b;
        b.count++;
        b.sat = Math.max(b.sat, saturation(px));
        buckets.set(key, b);
      }
    } catch {
      /* skip tainted/unreachable images */
    }
  }
  let best: { sum: RGB; count: number; sat: number } | null = null;
  for (const b of buckets.values()) {
    if (b.sat < 0.18) continue; // skip greys
    if (!best || b.sat * b.count > best.sat * best.count) best = b;
  }
  if (!best) return null;
  const avg: RGB = {
    r: Math.round(best.sum.r / best.count),
    g: Math.round(best.sum.g / best.count),
    b: Math.round(best.sum.b / best.count),
  };
  // brighten so it reads on #0A0A0C
  const boost = (n: number) => Math.min(255, Math.round(n * 1.25 + 40));
  return toHex({ r: boost(avg.r), g: boost(avg.g), b: boost(avg.b) });
}
