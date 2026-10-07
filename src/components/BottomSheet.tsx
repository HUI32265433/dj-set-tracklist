import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** use for full-screen batch modal */
  full?: boolean;
}

export default function BottomSheet({ open, onClose, title, children, full }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className={
          full
            ? 'fixed inset-0 z-50 mx-auto flex w-full max-w-lg flex-col bg-ink-bg'
            : 'sheet-panel'
        }
        role="dialog"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-ink-border px-4 py-3">
          <h2 className="text-sm font-semibold tracking-wide">{title}</h2>
          <button onClick={onClose} aria-label="关闭" className="rounded p-1 text-ink-dim active:bg-ink-alt">
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
