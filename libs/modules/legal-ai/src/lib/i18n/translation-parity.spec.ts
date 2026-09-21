import { describe, expect, it } from 'vitest';

import ar from './ar.json';
import en from './en.json';

function leafEntries(value: Record<string, unknown>, prefix = ''): [string, string][] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child !== null && typeof child === 'object' && !Array.isArray(child)
      ? leafEntries(child as Record<string, unknown>, path)
      : ([[path, String(child)]] as [string, string][]);
  });
}

const interpolations = (text: string) => [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort();

describe('legal-ai translations', () => {
  const enEntries = new Map(leafEntries(en));
  const arEntries = new Map(leafEntries(ar));

  it('keeps English and Arabic leaf keys in parity', () => {
    expect([...arEntries.keys()].sort()).toEqual([...enEntries.keys()].sort());
  });

  it('has no empty translations', () => {
    for (const [key, value] of [...enEntries, ...arEntries]) expect(value.trim(), key).not.toBe('');
  });

  it('uses the same {{params}} in both languages', () => {
    for (const [key, value] of enEntries) {
      expect(interpolations(arEntries.get(key) ?? ''), key).toEqual(interpolations(value));
    }
  });

  it('uses ngx-translate {{param}} syntax, never single-brace tokens', () => {
    for (const [key, value] of [...enEntries, ...arEntries]) {
      expect(/(?<!\{)\{\w+\}(?!\})/.test(value), key).toBe(false);
    }
  });
});
