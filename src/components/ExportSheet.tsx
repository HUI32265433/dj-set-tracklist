import { Check, FileJson, FileSpreadsheet, FileText, ImageDown, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import BottomSheet from './BottomSheet';
import ExportCanvas from './export/ExportCanvas';
import { exportCSV, exportJSON, exportPNG, exportTXT } from '../utils/export';
import { useSetStore } from '../store/useSetStore';
import type { ExportStyleId } from '../types/track';

const STYLES: { id: ExportStyleId; name: string; desc: string; swatch: string[] }[] = [
  { id: 'compact', name: '紧凑暗色', desc: '高密度列表，最像专业 DJ 软件', swatch: ['#0A0A0C', '#17181D', '#F5F5F5'] },
  { id: 'classic', name: '经典大封面', desc: '56px 封面，信息更舒展', swatch: ['#111216', '#25262B', '#92949A'] },
  { id: 'poster', name: '演出海报', desc: '大标题节目单，适合分享预告', swatch: ['#0A0A0C', '#f472b6', '#F5F5F5'] },
  { id: 'mono', name: '极简黑白', desc: '纯文字排版，适合打印', swatch: ['#ffffff', '#dddddd', '#111111'] },
  { id: 'accent', name: '调色点缀', desc: '用整套封面提取的主题色点缀', swatch: ['#0A0A0C', 'var(--accent)', '#17181D'] },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ExportSheet({ open, onClose }: Props) {
  const { setName, tracks, accent } = useSetStore();
  const [styleId, setStyleId] = useState<ExportStyleId>('compact');
  const [busy, setBusy] = useState<null | 'png' | 'other'>(null);
  const [done, setDone] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  async function doPNG() {
    const node = canvasRef.current;
    if (!node || busy) return;
    setBusy('png');
    try {
      // wait for cover images inside the export node
      await Promise.all(
        [...node.querySelectorAll('img')].map(
          (img) =>
            img.complete ||
            new Promise((r) => {
              img.onload = img.onerror = r;
            }),
        ),
      );
      await document.fonts.ready;
      await exportPNG(node, setName);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } finally {
      setBusy(null);
    }
  }

  function doOther(kind: 'json' | 'txt' | 'csv') {
    if (kind === 'json') exportJSON(setName, tracks);
    if (kind === 'txt') exportTXT(setName, tracks);
    if (kind === 'csv') exportCSV(setName, tracks);
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="导出 Tracklist">
      <div className="space-y-4 p-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-dim">PNG 视觉风格</p>
          <div className="space-y-1.5">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyleId(s.id)}
                className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left ${
                  styleId === s.id ? 'border-[var(--accent)] bg-ink-row' : 'border-ink-border'
                }`}
              >
                <span className="flex gap-0.5">
                  {s.swatch.map((c) => (
                    <span key={c} className="h-4 w-4 rounded-sm border border-ink-border" style={{ background: c }} />
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium">{s.name}</span>
                  <span className="block truncate text-[11px] text-ink-dim">{s.desc}</span>
                </span>
                {styleId === s.id && <Check size={16} className="shrink-0 text-[var(--accent)]" />}
              </button>
            ))}
          </div>
        </div>

        <button onClick={doPNG} disabled={busy !== null || !tracks.length} className="btn-primary w-full disabled:opacity-50">
          {busy === 'png' ? <Loader2 size={16} className="animate-spin" /> : done ? <Check size={16} /> : <ImageDown size={16} />}
          {busy === 'png' ? '正在生成高清图片…' : done ? '已保存 PNG' : '导出 PNG（3x 高清）'}
        </button>

        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => doOther('json')} className="btn-ghost text-xs"><FileJson size={14} /> JSON</button>
          <button onClick={() => doOther('txt')} className="btn-ghost text-xs"><FileText size={14} /> TXT</button>
          <button onClick={() => doOther('csv')} className="btn-ghost text-xs"><FileSpreadsheet size={14} /> CSV</button>
        </div>
        <p className="text-center text-[10px] leading-relaxed text-ink-dim/60">
          JSON 可留存全部数据（含 Energy/Mood/备注）；CSV 可直接导入 Excel / SPSS。
        </p>
      </div>

      {/* offscreen render target */}
      <div style={{ position: 'fixed', left: -10000, top: 0 }} aria-hidden>
        <div ref={canvasRef}>
          <ExportCanvas styleId={styleId} setName={setName} tracks={tracks} accent={accent} />
        </div>
      </div>
    </BottomSheet>
  );
}
