import { describe, expect, it } from 'vitest';

import ar from './ar.json';
import en from './en.json';

function leafKeys(
  value: Record<string, unknown>,
  prefix = '',
): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child !== null && typeof child === 'object' && !Array.isArray(child)
      ? leafKeys(child as Record<string, unknown>, path)
      : [path];
  });
}

describe('executive-summary translations', () => {
  it('keeps English and Arabic leaf keys in parity', () => {
    expect(leafKeys(ar).sort()).toEqual(leafKeys(en).sort());
  });
});
