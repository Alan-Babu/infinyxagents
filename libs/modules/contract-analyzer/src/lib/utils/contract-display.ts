import { DataTableSeverity } from '@nfinyx/data-table';

export function riskSeverity(level: string | null): Extract<DataTableSeverity, 'success' | 'warn' | 'danger' | 'secondary'> {
    const l = (level || '').toLowerCase();
    if (l === 'low') return 'success';
    if (l === 'medium') return 'warn';
    if (l === 'high' || l === 'critical') return 'danger';
    return 'secondary';
}

export function riskClass(level: string | null): string {
    const l = (level || '').toLowerCase();
    if (l === 'low') return 'bg-green-50 text-green-700 border-green-200';
    if (l === 'medium') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (l === 'high') return 'bg-red-50 text-red-700 border-red-200';
    if (l === 'critical') return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-gray-50 text-gray-500 border-gray-200';
}

export function reviewStatusSeverity(status: string): Extract<DataTableSeverity, 'success' | 'warn' | 'danger' | 'secondary'> {
    if (status === 'approved') return 'success';
    if (status === 'needs_review') return 'warn';
    if (status === 'rejected') return 'danger';
    return 'secondary';
}

export function reviewStatusClass(status: string): string {
    if (status === 'approved') return 'bg-green-100 text-green-700';
    if (status === 'needs_review') return 'bg-amber-100 text-amber-700';
    if (status === 'rejected') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-600';
}

export function confidenceClass(score: number | null | undefined): string {
    if (score === null || score === undefined) return 'text-gray-500';
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
}

export function fmtConfidence(score: number | null | undefined): string {
    return score === null || score === undefined ? '—' : `${score}%`;
}

export function fmtBytes(n?: number | null): string {
    if (!n && n !== 0) return '';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
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

export function fmtCurrency(value: number | null, currency: string | null): string {
    if (value === null || value === undefined) return '—';
    const formatted = value.toLocaleString('en-US', { maximumFractionDigits: 2 });
    return currency ? `${currency} ${formatted}` : formatted;
}
