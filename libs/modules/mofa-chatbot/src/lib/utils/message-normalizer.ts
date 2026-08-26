import { ChatMessageOut } from '../models/chat.models';

/**
 * Maps any backend chat payload into a template-safe `ChatMessageOut`, ported verbatim
 * (defensive field-alias fallback logic preserved) from the legacy `core/models.ts`'s
 * `normalizeChatMessage()`. Tolerates a `{ message: {...} }` wrapper, `content`/`answer`/`text`
 * aliases, `confidence_score`/`confidence` aliases, and `suggested_followups`/`followups` aliases.
 */
export function normalizeChatMessage(raw: unknown): ChatMessageOut {
    const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const nested = (src['message'] && typeof src['message'] === 'object' ? src['message'] : src) as Record<string, unknown>;
    const citationsRaw = nested['citations'];
    const followupsRaw = nested['suggested_followups'] ?? nested['followups'];
    return {
        message_id: String(nested['message_id'] ?? nested['id'] ?? `msg-${Date.now()}`),
        role: nested['role'] === 'user' ? 'user' : 'agent',
        content: String(nested['content'] ?? nested['answer'] ?? nested['text'] ?? ''),
        language: (nested['language'] as string | null) ?? null,
        confidence_score:
            typeof nested['confidence_score'] === 'number'
                ? nested['confidence_score']
                : typeof nested['confidence'] === 'number'
                  ? nested['confidence']
                  : null,
        was_answered: nested['was_answered'] as boolean | undefined,
        citations: Array.isArray(citationsRaw)
            ? citationsRaw.map(c => {
                  const item = (c && typeof c === 'object' ? c : {}) as Record<string, unknown>;
                  return { title: String(item['title'] ?? item['url'] ?? 'Source'), url: (item['url'] as string | null) ?? null };
              })
            : [],
        suggested_followups: Array.isArray(followupsRaw) ? followupsRaw.map(String).filter(Boolean) : [],
        feedback: (nested['feedback'] as 'up' | 'down' | null) ?? null,
        created_at: String(nested['created_at'] ?? new Date().toISOString()),
        happiness_score: (nested['happiness_score'] as number | null) ?? null,
        happiness_trend: (nested['happiness_trend'] as 'up' | 'down' | 'flat' | null) ?? null,
        offer_human_handoff: Boolean(nested['offer_human_handoff']),
        transcribed_text: nested['transcribed_text'] != null ? String(nested['transcribed_text']) : undefined,
        detected_language:
            nested['detected_language'] === 'ar' || nested['detected_language'] === 'en' ? nested['detected_language'] : undefined,
    };
}
