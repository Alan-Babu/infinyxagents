import { CaseStatus } from '../models/digital-attestation.models';

export function statusSeverity(status: CaseStatus): 'warn' | 'success' | 'danger' {
    if (status === 'PENDING') return 'warn';
    if (status === 'APPROVED') return 'success';
    return 'danger';
}

export function statusIcon(status: CaseStatus): string {
    if (status === 'PENDING') return 'pi pi-clock';
    if (status === 'APPROVED') return 'pi pi-check-circle';
    if (status === 'REJECTED') return 'pi pi-times-circle';
    return 'pi pi-exclamation-triangle';
}

export type ConfidenceTone = 'high' | 'mid' | 'low' | 'none';

export function confidenceTone(value: number | null | undefined): ConfidenceTone {
    if (value === null || value === undefined) return 'none';
    if (value >= 90) return 'high';
    if (value >= 70) return 'mid';
    return 'low';
}

export function confidenceColorClass(value: number): string {
    if (value >= 85) return 'text-green-600';
    if (value >= 65) return 'text-amber-600';
    return 'text-red-600';
}

export function confidenceBadgeClasses(value: number): string {
    if (value >= 85) return 'bg-green-50 border-green-200 text-green-700';
    if (value >= 65) return 'bg-amber-50 border-amber-200 text-amber-700';
    return 'bg-red-50 border-red-200 text-red-700';
}

const TONE_TEXT_CLASS: Record<ConfidenceTone, string> = {
    high: 'text-green-600',
    mid: 'text-amber-600',
    low: 'text-red-600',
    none: 'text-gray-500',
};

const TONE_BADGE_CLASS: Record<ConfidenceTone, string> = {
    high: 'bg-green-50 border-green-200 text-green-700',
    mid: 'bg-amber-50 border-amber-200 text-amber-700',
    low: 'bg-red-50 border-red-200 text-red-700',
    none: 'bg-gray-50 border-gray-200 text-gray-500',
};

const TONE_BAR_CLASS: Record<ConfidenceTone, string> = {
    high: 'bg-green-500',
    mid: 'bg-amber-500',
    low: 'bg-red-500',
    none: 'bg-gray-300',
};

export function toneTextClass(tone: ConfidenceTone): string {
    return TONE_TEXT_CLASS[tone];
}

export function toneBadgeClass(tone: ConfidenceTone): string {
    return TONE_BADGE_CLASS[tone];
}

export function toneBarClass(tone: ConfidenceTone): string {
    return TONE_BAR_CLASS[tone];
}

export function timeAgo(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
}

export function formatDateTime(ts: number): string {
    return new Date(ts).toLocaleString([], { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function docTypeLabel(docType: string): string {
    return docType.replace(/_/g, ' ');
}
