import { useState } from 'react';

export default function SourceList({ sources }) {
  const [openId, setOpenId] = useState(null);
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-5 space-y-2 border-t border-slateink/10 pt-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slateink">Sources</p>
      {sources.map((s, i) => {
        const isOpen = openId === s.chunkId;
        return (
          <div key={s.chunkId || i}>
            <button
              onClick={() => setOpenId(isOpen ? null : s.chunkId)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-slateink transition hover:bg-paper hover:text-ink"
            >
              <span className="font-semibold text-amber">[{i + 1}]</span>
              <span className="truncate">{s.documentName}</span>
              {s.pageNumber != null && <span className="text-slateink/70">· page {s.pageNumber}</span>}
              <span className="ml-auto text-slateink/60">{isOpen ? 'Hide' : 'View excerpt'}</span>
            </button>
            {isOpen && (
              <div className="mt-1 rounded-xl border border-amber/20 bg-amber-light/60 p-3 text-sm leading-relaxed text-body/90">
                {s.chunkText}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
