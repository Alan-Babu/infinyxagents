import { Pipe, PipeTransform } from '@angular/core';

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * Renders the tiny Markdown subset LLM answers use — **bold**, `code`, and "- " bullets —
 * without a Markdown dependency. Input is HTML-escaped first, so only the tags produced
 * here can reach the DOM (and Angular's sanitiser still runs on [innerHTML]).
 */
export function renderMarkdownLite(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/[&<>"']/g, (c) => ESCAPES[c])
    .replace(/\*\*([^*\n](?:[^*\n]|\*(?!\*))*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/^[ \t]*[-*•][ \t]+/gm, '• ');
}

@Pipe({ name: 'legalAiMd', standalone: true })
export class MarkdownLitePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return renderMarkdownLite(value);
  }
}
