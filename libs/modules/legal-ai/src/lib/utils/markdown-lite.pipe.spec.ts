import { describe, expect, it } from 'vitest';
import { renderMarkdownLite } from './markdown-lite.pipe';

describe('renderMarkdownLite', () => {
  it('renders bold and code', () => {
    expect(renderMarkdownLite('**Enforceable** under `Art. 10`')).toBe('<strong>Enforceable</strong> under <code>Art. 10</code>');
  });
  it('escapes HTML before adding its own tags', () => {
    const out = renderMarkdownLite('<img src=x onerror=alert(1)> **ok**');
    expect(out).not.toContain('<img');
    expect(out).toContain('&lt;img');
    expect(out).toContain('<strong>ok</strong>');
  });
  it('turns dash bullets into bullets and keeps newlines', () => {
    expect(renderMarkdownLite('- one\n- two')).toBe('• one\n• two');
  });
  it('leaves an unmatched marker alone', () => {
    expect(renderMarkdownLite('2 ** 3')).toBe('2 ** 3');
  });
  it('handles empty input', () => {
    expect(renderMarkdownLite(null)).toBe('');
    expect(renderMarkdownLite('')).toBe('');
  });
});
