/**
 * Text normalization for cross-language track matching.
 * Handles: Unicode NFKC (full/half width), case, punctuation,
 * whitespace, and common DJ/release suffix decorations.
 */

const DECORATION_PATTERNS: RegExp[] = [
  /[\(\[【（][^\)\]】）]*\b(feat\.?|featuring|with|prod\.?)\b[^\)\]】）]*[\)\]】）]/gi,
  /\s*[-–—~〜]\s*(feat\.?|featuring)\s.+$/gi,
  /[\(\[【（][^\)\]】）*(tv\s*size|remix|live|instrumental|inst|karaoke|off\s*vocal|acoustic|ver\.?|version|edit|mix|remaster(ed)?|cover|ost)[^\)\]】）]*[\)\]】）]/gi,
  /\s*[-–—]\s*(tv\s*size|remix|live|instrumental|radio\s*edit|extended|club\s*mix).*$/gi,
];

/** Normalize for comparison: NFKC, lowercase, collapse whitespace/punctuation. */
export function normalize(input: string): string {
  let s = input.normalize('NFKC').toLowerCase();
  s = s.replace(/['’`´]/g, "'");
  s = s.replace(/[“”„″]/g, '"');
  s = s.replace(/[・･]/g, ' ');
  s = s.replace(/[!！?？。，,、:：;；~〜_]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/** Strip decorative suffixes (feat. / TV Size / Remix / Live ...) for base-title compare. */
export function stripDecorations(input: string): string {
  let s = input;
  for (const re of DECORATION_PATTERNS) {
    s = s.replace(re, ' ');
  }
  return normalize(s);
}

/** Parse a pasted line that may contain "Title - Artist" or "Title / Artist". */
export function parseQueryLine(line: string): { title: string; artist?: string } {
  const cleaned = line.trim().replace(/^\d+[\.\、\)]\s*/, ''); // drop leading numbering
  const sep = cleaned.match(/^(.+?)\s+[-–—]\s+(.+)$/);
  if (sep && sep[1].length >= 2 && sep[2].length >= 2) {
    return { title: sep[1].trim(), artist: sep[2].trim() };
  }
  return { title: cleaned };
}

/** Split a batch paste into clean, de-duplicated query lines. */
export function parseBatchInput(raw: string): { title: string; artist?: string }[] {
  const seen = new Set<string>();
  const out: { title: string; artist?: string }[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const q = parseQueryLine(line);
    if (!q.title) continue;
    const key = normalize(q.title + '|' + (q.artist ?? ''));
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q);
  }
  return out;
}
