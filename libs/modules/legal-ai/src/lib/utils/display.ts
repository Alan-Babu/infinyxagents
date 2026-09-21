/**
 * Class + icon mapping for statuses and severities.
 *
 * Colours are the UAE Design System functional scales (see `--color-ae-*` in shared-assets
 * styles.css): error = red, success = green, warning = camel / desert, information = sea / tech.
 * Every tag also carries an icon, so colour is never the only signal.
 */

const TAG = 'inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold';

const TONES = {
    success: 'border-ae-green-200 bg-ae-green-50 text-ae-green-700',
    danger: 'border-ae-red-200 bg-ae-red-50 text-ae-red-700',
    warning: 'border-ae-camel-200 bg-ae-camel-50 text-ae-camel-800',
    alert: 'border-ae-desert-200 bg-ae-desert-50 text-ae-desert-700',
    info: 'border-ae-sea-200 bg-ae-sea-50 text-ae-sea-800',
    tech: 'border-ae-tech-200 bg-ae-tech-50 text-ae-tech-800',
    neutral: 'border-gray-200 bg-gray-50 text-gray-600',
    solidDanger: 'border-transparent bg-ae-red-700 text-white',
} as const;

type Tone = keyof typeof TONES;

interface Look {
    tone: Tone;
    icon: string;
}

const STATUS_LOOK: Record<string, Look> = {
    COMPLIANT: { tone: 'success', icon: 'pi-check-circle' },
    NON_COMPLIANT: { tone: 'danger', icon: 'pi-times-circle' },
    NEEDS_REVIEW: { tone: 'warning', icon: 'pi-eye' },
    AMBIGUOUS: { tone: 'warning', icon: 'pi-question-circle' },
    INSUFFICIENT_EVIDENCE: { tone: 'neutral', icon: 'pi-exclamation-circle' },
    NOT_APPLICABLE: { tone: 'neutral', icon: 'pi-minus-circle' },
    UPLOADED: { tone: 'info', icon: 'pi-upload' },
    PROCESSING: { tone: 'tech', icon: 'pi-spinner pi-spin' },
    COMPLETED: { tone: 'success', icon: 'pi-check-circle' },
    FAILED: { tone: 'danger', icon: 'pi-times-circle' },
};

const SEVERITY_LOOK: Record<string, Look> = {
    CRITICAL: { tone: 'solidDanger', icon: 'pi-shield' },
    HIGH: { tone: 'alert', icon: 'pi-exclamation-triangle' },
    MEDIUM: { tone: 'warning', icon: 'pi-exclamation-circle' },
    LOW: { tone: 'success', icon: 'pi-check-circle' },
    INFORMATIONAL: { tone: 'neutral', icon: 'pi-info-circle' },
};

const FALLBACK: Look = { tone: 'neutral', icon: 'pi-info-circle' };

export interface TagLook {
    /** Tailwind classes for the pill. */
    cls: string;
    /** PrimeIcons classes (without the base `pi`). */
    icon: string;
}

function toLook(look: Look): TagLook {
    return { cls: `${TAG} ${TONES[look.tone]}`, icon: look.icon };
}

export function statusLook(status: string | null | undefined): TagLook {
    return toLook(STATUS_LOOK[status ?? ''] ?? FALLBACK);
}

export function severityLook(severity: string | null | undefined): TagLook {
    return toLook(SEVERITY_LOOK[severity ?? ''] ?? SEVERITY_LOOK['INFORMATIONAL']);
}

/** A ready-made pill class for ad-hoc tags (jurisdiction, review outcome, …). */
export function toneClass(tone: Exclude<Tone, 'solidDanger'>): string {
    return `${TAG} ${TONES[tone]}`;
}
