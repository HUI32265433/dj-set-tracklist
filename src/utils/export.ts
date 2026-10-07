import { domToPng } from 'modern-screenshot';
import type { Track } from '../types/track';

export const pad = (n: number): string => String(n).padStart(2, '0');

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function slug(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').slice(0, 60) || 'dj-set';
}

export function exportJSON(setName: string, tracks: Track[]) {
  const blob = new Blob([JSON.stringify({ setName, exportedAt: new Date().toISOString(), tracks }, null, 2)], {
    type: 'application/json',
  });
  download(blob, `${slug(setName)}.json`);
}

export function exportTXT(setName: string, tracks: Track[]) {
  const lines = [
    `DJ SET — ${setName}`,
    `Tracks: ${tracks.length}`,
    ''.padEnd(48, '='),
    ...tracks.map((t) => `${pad(t.position)}. ${t.title} — ${t.artist}${t.album ? ` (${t.album})` : ''}`),
  ];
  download(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }), `${slug(setName)}.txt`);
}

export function exportCSV(setName: string, tracks: Track[]) {
  const esc = (v: string | number | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [
    ['No', 'Title', 'Artist', 'Album', 'ReleaseDate', 'Genre', 'Source', 'Energy', 'Mood', 'Note'].map(esc).join(','),
    ...tracks.map((t) =>
      [t.position, t.title, t.artist, t.album, t.releaseDate, t.genre, t.source, t.energy, t.mood, t.note]
        .map(esc)
        .join(','),
    ),
  ];
  download(new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' }), `${slug(setName)}.csv`);
}

/** Capture an offscreen-rendered export node as a high-res PNG. */
export async function exportPNG(node: HTMLElement, setName: string): Promise<void> {
  const dataUrl = await domToPng(node, {
    scale: 3,
    backgroundColor: node.dataset.bg ?? '#0A0A0C',
  });
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  download(blob, `${slug(setName)}.png`);
}
