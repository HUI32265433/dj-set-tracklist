import type { CSSProperties } from 'react';
import type { ExportStyleId, Track } from '../../types/track';
import { pad } from '../../utils/export';

/**
 * Offscreen-rendered export artwork. Five visual schemes:
 *  compact — dense DJ-software dark list (reference style)
 *  classic — bigger covers, airier rows
 *  poster  — live-set flyer, big typography, no covers
 *  mono    — minimal black on white, print friendly
 *  accent  — dark list tinted with the set's palette accent
 */
interface Props {
  styleId: ExportStyleId;
  setName: string;
  tracks: Track[];
  accent: string | null;
}

const W = 640;
const FONT = `Inter, "Noto Sans JP", system-ui, sans-serif`;

function Cover({ url, size }: { url?: string; size: number }) {
  if (!url) {
    return (
      <div
        style={{
          width: size,
          height: size,
          background: '#1b1c22',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#4b4d55',
          fontSize: size * 0.5,
          flexShrink: 0,
        }}
      >
        ♪
      </div>
    );
  }
  return (
    <img
      src={url}
      crossOrigin="anonymous"
      style={{ width: size, height: size, objectFit: 'cover', flexShrink: 0 }}
      alt=""
    />
  );
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '.');
}

export default function ExportCanvas({ styleId, setName, tracks, accent }: Props) {
  const a = accent ?? '#f472b6';

  if (styleId === 'mono') {
    return (
      <div data-bg="#ffffff" style={{ width: W, background: '#fff', color: '#111', padding: '48px 44px', fontFamily: FONT }}>
        <div style={{ fontSize: 11, letterSpacing: 6, fontWeight: 700 }}>DJ SET</div>
        <div style={{ fontSize: 34, fontWeight: 800, marginTop: 8, lineHeight: 1.15 }}>{setName}</div>
        <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
          {tracks.length} TRACKS — {dateStamp()}
        </div>
        <div style={{ height: 2, background: '#111', margin: '24px 0 0' }} />
        {tracks.map((t) => (
          <div key={t.id} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: '1px solid #ddd', alignItems: 'baseline' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 13, width: 28, color: '#999' }}>{pad(t.position)}</span>
            <span style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>{t.title}</span>
            <span style={{ fontSize: 12, color: '#555', maxWidth: 220, textAlign: 'right' }}>{t.artist}</span>
          </div>
        ))}
        <div style={{ marginTop: 28, fontSize: 10, letterSpacing: 3, color: '#999' }}>GENERATED WITH DJ SET TRACKLIST</div>
      </div>
    );
  }

  if (styleId === 'poster') {
    return (
      <div data-bg="#0A0A0C" style={{ width: W, background: '#0A0A0C', color: '#F5F5F5', padding: '56px 48px', fontFamily: FONT, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -120, right: -120, width: 320, height: 320, borderRadius: '50%', background: a, opacity: 0.12 }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 240, height: 240, borderRadius: '50%', background: a, opacity: 0.08 }} />
        <div style={{ fontSize: 12, letterSpacing: 8, fontWeight: 700, color: a }}>DJ SET</div>
        <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.1, marginTop: 12, textTransform: 'uppercase' }}>{setName}</div>
        <div style={{ marginTop: 10, fontSize: 13, color: '#92949A' }}>
          {tracks.length} TRACKS — {dateStamp()}
        </div>
        <div style={{ height: 3, width: 72, background: a, margin: '32px 0 24px' }} />
        {tracks.map((t) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'baseline', gap: 14, padding: '7px 0' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 14, color: a, width: 30, flexShrink: 0 }}>{pad(t.position)}</span>
            <span style={{ fontSize: 16, fontWeight: 600 }}>{t.title}</span>
            <span style={{ flex: 1, borderBottom: '1px dotted #33343a', margin: '0 6px 4px' }} />
            <span style={{ fontSize: 13, color: '#92949A' }}>{t.artist}</span>
          </div>
        ))}
        <div style={{ marginTop: 36, fontSize: 10, letterSpacing: 4, color: '#55565c' }}>DJ SET TRACKLIST</div>
      </div>
    );
  }

  if (styleId === 'classic') {
    return (
      <div data-bg="#0A0A0C" style={{ width: W, background: '#0A0A0C', color: '#F5F5F5', padding: '40px 36px', fontFamily: FONT }}>
        <div style={{ fontSize: 11, letterSpacing: 6, fontWeight: 700, color: a }}>DJ SET</div>
        <div style={{ fontSize: 30, fontWeight: 800, marginTop: 6 }}>{setName}</div>
        <div style={{ fontSize: 12, color: '#92949A', marginTop: 6, marginBottom: 20 }}>
          {tracks.length} TRACKS — {dateStamp()}
        </div>
        {tracks.map((t, i) => (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '10px 12px',
              background: i % 2 ? '#111216' : '#17181D',
              borderBottom: '1px solid #25262B',
            }}
          >
            <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#92949A', width: 26, textAlign: 'right' }}>{pad(t.position)}</span>
            <Cover url={t.coverUrl} size={56} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
              <div style={{ fontSize: 12, color: '#92949A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.artist}</div>
              {t.album && (
                <div style={{ fontSize: 11, color: '#55565c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.album}</div>
              )}
            </div>
          </div>
        ))}
        <div style={{ marginTop: 24, fontSize: 10, letterSpacing: 3, color: '#55565c' }}>GENERATED WITH DJ SET TRACKLIST</div>
      </div>
    );
  }

  // compact & accent share the dense layout; accent tints chrome with palette color
  const isAccent = styleId === 'accent';
  const chrome: CSSProperties = isAccent ? { color: a } : { color: '#92949A' };
  return (
    <div data-bg="#0A0A0C" style={{ width: W, background: '#0A0A0C', color: '#F5F5F5', fontFamily: FONT, paddingBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `2px solid ${isAccent ? a : '#25262B'}` }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 5, fontWeight: 700, ...chrome }}>DJ SET</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>{setName}</div>
        </div>
        <div style={{ fontSize: 11, ...chrome, textAlign: 'right' }}>
          {tracks.length} TRACKS
          <br />
          {dateStamp()}
        </div>
      </div>
      {tracks.map((t, i) => (
        <div
          key={t.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '5px 20px',
            background: i % 2 ? '#111216' : '#17181D',
            borderBottom: '1px solid #1d1e24',
          }}
        >
          <span style={{ fontFamily: 'monospace', fontSize: 11, width: 24, textAlign: 'right', ...chrome }}>{pad(t.position)}</span>
          <Cover url={t.coverUrl} size={34} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.title}
            </div>
            <div style={{ fontSize: 11, color: '#92949A', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.artist}
              {t.album ? ` — ${t.album}` : ''}
            </div>
          </div>
          {t.energy ? <span style={{ fontFamily: 'monospace', fontSize: 10, ...chrome }}>E{t.energy}</span> : null}
        </div>
      ))}
    </div>
  );
}
