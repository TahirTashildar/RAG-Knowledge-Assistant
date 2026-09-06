import { describe, it, expect, beforeEach } from 'vitest';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../utils/ragSettings';

describe('ragSettings', () => {
  beforeEach(() => localStorage.clear());

  it('returns defaults when nothing is stored', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('persists and reloads a partial override, merged with defaults', () => {
    saveSettings({ ...DEFAULT_SETTINGS, retrievalMode: 'MULTI_QUERY' });
    const loaded = loadSettings();
    expect(loaded.retrievalMode).toBe('MULTI_QUERY');
    expect(loaded.topK).toBe(DEFAULT_SETTINGS.topK);
  });

  it('falls back to defaults if localStorage has corrupted JSON', () => {
    localStorage.setItem('ragSettings', '{not valid json');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
