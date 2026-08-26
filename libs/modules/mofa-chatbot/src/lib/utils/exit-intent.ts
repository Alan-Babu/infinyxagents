/** Ported verbatim from the legacy `chat.component.ts`'s `EXIT_RE` — matches short EN/AR closing pleasantries. */
const EXIT_RE =
    /^(thanks?( you)?(\s+(so much|a lot|very much))?|thx|ty|cheers|bye|goodbye|good bye|that's all|thats all|no more questions|شكرا|شكرًا|شكراً|شكرا جزيلا|مع السلامة|وداعا)[\s!.،]*$/i;

/** Detects a short "closing" user message (thanks/bye) so the chat can offer to end the session. */
export function isExitIntent(userText: string): boolean {
    const cleaned = (userText || '').trim();
    if (!cleaned || cleaned.length > 60) return false;
    return EXIT_RE.test(cleaned);
}
