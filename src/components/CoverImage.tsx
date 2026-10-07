import { Music2 } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { resolveCover } from '../utils/image';
import type { Track } from '../types/track';

interface Props {
  track: Track;
  size?: number;
  className?: string;
}

/** Cover with IndexedDB-upload support and graceful placeholder. */
export default memo(function CoverImage({ track, size = 40, className = '' }: Props) {
  const [src, setSrc] = useState<string | undefined>(track.coverKey ? undefined : track.coverUrl);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    let alive = true;
    setBroken(false);
    if (track.coverKey) {
      resolveCover(track).then((u) => {
        if (alive) setSrc(u);
      });
    } else {
      setSrc(track.coverUrl);
    }
    return () => {
      alive = false;
    };
  }, [track.coverKey, track.coverUrl, track]);

  if (!src || broken) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-sm bg-ink-alt text-ink-dim ${className}`}
        style={{ width: size, height: size }}
      >
        <Music2 size={size * 0.45} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      crossOrigin="anonymous"
      onError={() => setBroken(true)}
      className={`shrink-0 rounded-sm bg-ink-alt object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
});
