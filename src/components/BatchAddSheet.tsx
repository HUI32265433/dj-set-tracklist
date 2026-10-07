import { AlertTriangle, Check, HelpCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import BottomSheet from './BottomSheet';
import { searchBatch, type BatchLineResult } from '../services/music/search';
import { parseBatchInput } from '../utils/normalize';
import { useSetStore } from '../store/useSetStore';
import type { TrackCandidate } from '../types/track';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Phase = 'input' | 'searching' | 'review';

export default function BatchAddSheet({ open, onClose }: Props) {
  const addCandidates = useSetStore((s) => s.addCandidates);
  const neteaseProxyUrl = useSetStore((s) => s.neteaseProxyUrl);

  const [raw, setRaw] = useState('');
  const [phase, setPhase] = useState<Phase>('input');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [lines, setLines] = useState<BatchLineResult[]>([]);
  const [chosen, setChosen] = useState<Record<number, TrackCandidate>>({});
  const [pickerFor, setPickerFor] = useState<number | null>(null);
  const [added, setAdded] = useState(false);

  const parsedCount = phase === 'input' ? parseBatchInput(raw).length : lines.length;

  async function start() {
    if (!parsedCount) return;
    setPhase('searching');
    setProgress({ done: 0, total: parsedCount });
    const results = await searchBatch(raw, (done, total) => setProgress({ done, total }), {
      neteaseProxyUrl: neteaseProxyUrl || undefined,
    });
    setLines(results);
    // pre-select: auto only for high confidence; never auto-add uncertain ones
    const pre: Record<number, TrackCandidate> = {};
    results.forEach((r, i) => {
      if (r.status === 'matched' && r.candidates[0]) pre[i] = r.candidates[0];
    });
    setChosen(pre);
    setPhase('review');
  }

  function addAll() {
    addCandidates(Object.values(chosen));
    setAdded(true);
  }

  function reset() {
    setPhase('input');
    setLines([]);
    setChosen({});
    setPickerFor(null);
    setAdded(false);
  }

  const iconFor = (s: BatchLineResult['status'], i: number) =>
    chosen[i] ? (
      <Check size={14} className="text-emerald-400" />
    ) : s === 'failed' ? (
      <AlertTriangle size={14} className="text-red-400" />
    ) : (
      <HelpCircle size={14} className="text-amber-400" />
    );

  return (
    <BottomSheet open={open} onClose={onClose} title="批量添加" full>
      {phase === 'input' && (
        <div className="flex h-full flex-col gap-3 p-4">
          <p className="text-xs leading-relaxed text-ink-dim">
            每行一首歌，可写「标题 - 艺人」。自动去重、去空行；不确定的匹配不会自动加入。
          </p>
          <textarea
            className="input-dark min-h-0 flex-1 resize-none font-mono text-[13px] leading-relaxed"
            placeholder={'Endless Story\nLonging for!\nTiny Tiny\n进行形ダイアリー\nmelt (on the border)'}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
          <button onClick={start} disabled={!parsedCount} className="btn-primary w-full disabled:opacity-50">
            搜索 {parsedCount} 首歌曲
          </button>
        </div>
      )}

      {phase === 'searching' && (
        <div className="flex flex-col items-center gap-4 py-24">
          <Loader2 size={28} className="animate-spin text-[var(--accent)]" />
          <p className="font-mono text-sm text-ink-dim">
            Searching {progress.done} / {progress.total}
          </p>
          <div className="h-1 w-48 overflow-hidden rounded-full bg-ink-alt">
            <div
              className="h-full bg-[var(--accent)] transition-all"
              style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {phase === 'review' && !added && (
        <div className="flex h-full flex-col">
          <ul className="min-h-0 flex-1 divide-y divide-ink-border/60 overflow-y-auto">
            {lines.map((l, i) => (
              <li key={i} className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  {iconFor(l.status, i)}
                  <span className="flex-1 truncate text-[13px]">{l.title}</span>
                  {l.candidates.length > 0 && (
                    <label className="flex items-center gap-1.5 text-[11px] text-ink-dim">
                      <input
                        type="checkbox"
                        className="accent-[var(--accent)]"
                        checked={!!chosen[i]}
                        disabled={!l.candidates.length}
                        onChange={(e) => {
                          setChosen((prev) => {
                            const next = { ...prev };
                            if (e.target.checked) next[i] = prev[i] ?? l.candidates[0];
                            else delete next[i];
                            return next;
                          });
                        }}
                      />
                      添加
                    </label>
                  )}
                </div>
                {l.candidates.length > 0 && (
                  <button
                    onClick={() => setPickerFor(pickerFor === i ? null : i)}
                    className="mt-1 flex w-full items-center gap-2 rounded-sm bg-ink-row px-2 py-1.5 text-left"
                  >
                    {chosen[i]?.coverUrl && (
                      <img src={chosen[i]!.coverUrl} alt="" className="h-7 w-7 rounded-sm object-cover" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs">{chosen[i]?.title ?? l.candidates[0].title}</span>
                      <span className="block truncate text-[11px] text-ink-dim">
                        {chosen[i]?.artist ?? l.candidates[0].artist}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-ink-dim">
                      {Math.round((chosen[i]?.confidence ?? l.candidates[0].confidence) * 100)}%
                    </span>
                    <span className="shrink-0 text-[10px] text-[var(--accent)]">
                      {l.status === 'confirm' ? '选择正确版本' : '更换'}
                    </span>
                  </button>
                )}
                {pickerFor === i &&
                  l.candidates.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setChosen((p) => ({ ...p, [i]: c })); setPickerFor(null); }}
                      className={`mt-1 flex w-full items-center gap-2 rounded-sm border px-2 py-1.5 text-left ${
                        chosen[i]?.id === c.id ? 'border-[var(--accent)]' : 'border-ink-border'
                      }`}
                    >
                      {c.coverUrl && <img src={c.coverUrl} alt="" className="h-7 w-7 rounded-sm object-cover" />}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs">{c.title}</span>
                        <span className="block truncate text-[11px] text-ink-dim">{c.artist} · {c.album}</span>
                      </span>
                      <span className="font-mono text-[10px] text-ink-dim">{Math.round(c.confidence * 100)}%</span>
                    </button>
                  ))}
                {l.status === 'failed' && (
                  <p className="mt-1 text-[11px] text-ink-dim/70">未找到可信匹配，可稍后用单曲搜索手动添加。</p>
                )}
              </li>
            ))}
          </ul>
          <div className="flex gap-2 border-t border-ink-border p-4">
            <button onClick={reset} className="btn-ghost flex-1">返回编辑</button>
            <button onClick={addAll} disabled={!Object.keys(chosen).length} className="btn-primary flex-1 disabled:opacity-50">
              全部添加（{Object.keys(chosen).length}）
            </button>
          </div>
        </div>
      )}

      {added && (
        <div className="flex flex-col items-center gap-4 py-24">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <Check size={26} />
          </div>
          <p className="text-sm">✓ 已加入 Tracklist</p>
          <button onClick={onClose} className="btn-primary w-40">完成</button>
        </div>
      )}
    </BottomSheet>
  );
}
