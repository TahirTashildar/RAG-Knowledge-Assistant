import { useState } from 'react';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../utils/ragSettings';

export default function SettingsPage() {
  const [settings, setSettings] = useState(loadSettings());
  const [saved, setSaved] = useState(false);

  function update(partial) {
    const next = { ...settings, ...partial };
    setSettings(next);
    saveSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="font-serif text-2xl text-ink mb-2">RAG settings</h1>
      <p className="text-slateink text-sm mb-8">
        These apply to new conversations. Only controls that are actually wired
        to the retrieval pipeline are shown here.
      </p>

      <div className="space-y-8">
        <div>
          <label className="block text-ink font-medium mb-2">Retrieval mode</label>
          <div className="flex gap-3">
            {['STANDARD', 'MULTI_QUERY'].map((mode) => (
              <button
                key={mode}
                onClick={() => update({ retrievalMode: mode })}
                className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${
                  settings.retrievalMode === mode
                    ? 'bg-teal text-white border-teal'
                    : 'border-slateink/30 text-slateink hover:border-teal'
                }`}
              >
                {mode === 'STANDARD' ? 'Standard' : 'Multi-Query'}
              </button>
            ))}
          </div>
          <p className="text-xs text-slateink mt-2">
            Multi-Query generates a few alternative phrasings of your question and
            merges the results — useful when the first pass misses relevant passages.
          </p>
        </div>

        <div>
          <label className="block text-ink font-medium mb-2">Top K (chunks retrieved per question)</label>
          <div className="flex gap-3">
            {[3, 5, 10].map((k) => (
              <button
                key={k}
                onClick={() => update({ topK: k })}
                className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${
                  settings.topK === k ? 'bg-teal text-white border-teal' : 'border-slateink/30 text-slateink hover:border-teal'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-ink font-medium mb-2">
            Temperature <span className="text-slateink font-normal">({settings.temperature.toFixed(1)})</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.temperature}
            onChange={(e) => update({ temperature: parseFloat(e.target.value) })}
            className="w-full accent-teal"
          />
          <p className="text-xs text-slateink mt-2">Lower is more focused and deterministic; higher is more varied.</p>
        </div>

        {saved && <p className="text-xs text-teal-dark">Saved</p>}

        <button
          onClick={() => update(DEFAULT_SETTINGS)}
          className="text-sm text-slateink hover:text-ink underline"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
