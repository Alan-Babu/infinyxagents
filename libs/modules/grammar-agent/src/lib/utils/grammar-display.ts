import { DataTableSeverity } from '@nfinyx/data-table';

export function reviewStatusSeverity(status: string): Extract<DataTableSeverity, 'success' | 'danger' | 'secondary' | 'warn'> {
    if (status === 'approved') return 'success';
    if (status === 'rejected') return 'danger';
    if (status === 'auto_approved') return 'secondary';
    return 'warn';
}

export function reviewStatusBadgeClass(status: string): string {
    if (status === 'approved') return 'bg-green-50 text-green-700 border-green-200';
    if (status === 'rejected') return 'bg-red-50 text-red-700 border-red-200';
    if (status === 'auto_approved') return 'bg-gray-50 text-gray-500 border-gray-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
}

export function classificationClass(classification: string): string {
    const v = (classification || '').toLowerCase();
    if (v === 'confidential') return 'bg-red-50 text-red-700 border-red-200';
    if (v === 'internal') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (v === 'public') return 'bg-green-50 text-green-700 border-green-200';
    return 'bg-gray-50 text-gray-500 border-gray-200';
}

export function scoreClass(score: number | null): string {
    if (score === null || score === undefined) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
}

/** Severity of a `GrammarIssue` — drives underline/background color on inline highlights and issue-card badges. */
export function severityClass(severity: string): string {
    if (severity === 'critical') return 'bg-red-50 text-red-700 border-red-200';
    if (severity === 'major') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
}

/** Underline color applied to an inline highlighted span in the Overview tab's "Original" column. */
export function severityUnderlineClass(severity: string): string {
    if (severity === 'critical') return 'decoration-red-500 bg-red-50/60';
    if (severity === 'major') return 'decoration-amber-500 bg-amber-50/60';
    return 'decoration-blue-500 bg-blue-50/60';
}

export function confidenceClass(score: number | null): string {
    if (score === null || score === undefined) return 'text-gray-500';
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
}

export function fmtBytes(n?: number | null): string {
    if (!n) return '';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

export function fmtDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtDateTime(iso: string): string {
    const d = new Date(iso);
    return (
        d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ' · ' +
        d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    );
}

export function fmtConfidence(score: number | null): string {
    return score === null || score === undefined ? '—' : `${score}%`;
}
