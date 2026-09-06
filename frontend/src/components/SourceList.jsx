import { useState } from 'react';

export default function SourceList({ sources }) {
  const [openId, setOpenId] = useState(null);
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slateink/15 space-y-2">
      {sources.map((s, i) => {
        const isOpen = openId === s.chunkId;
        return (
          <div key={s.chunkId || i}>
            <button
              onClick={() => setOpenId(isOpen ? null : s.chunkId)}
              className="flex items-center gap-2 text-xs text-slateink hover:text-ink w-full text-left"
            >
              <span className="text-amber font-semibold">[{i + 1}]</span>
              <span className="truncate">{s.documentName}</span>
              {s.pageNumber != null && <span className="text-slateink/70">· page {s.pageNumber}</span>}
              <span className="ml-auto text-slateink/60">{isOpen ? 'Hide' : 'View'}</span>
            </button>
            {isOpen && (
              <div className="mt-2 bg-amber-light border border-amber/30 rounded p-3 text-sm text-body/90 leading-relaxed">
                {s.chunkText}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
