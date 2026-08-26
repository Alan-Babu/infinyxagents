import { DataTableSeverity } from '@nfinyx/data-table';

export function statusSeverity(status: string): Extract<DataTableSeverity, 'success' | 'danger' | 'secondary' | 'warn'> {
    if (status === 'Valid') return 'success';
    if (status === 'Expired') return 'danger';
    if (status === 'No Expiry') return 'secondary';
    return 'warn';
}

export function statusBadgeClass(status: string): string {
    if (status === 'Valid') return 'bg-green-50 text-green-700 border-green-200';
    if (status === 'Expired') return 'bg-red-50 text-red-700 border-red-200';
    if (status === 'No Expiry') return 'bg-gray-50 text-gray-500 border-gray-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
}

export function riskClass(risk: string): string {
    if (risk === 'low') return 'bg-green-50 text-green-700 border-green-200';
    if (risk === 'medium') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (risk === 'high') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-gray-50 text-gray-500 border-gray-200';
}

export function confidenceClass(score: number | null): string {
    if (score === null || score === undefined) return 'text-gray-500';
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
}

export function complianceClass(verdict: string | undefined): string {
    if (!verdict) return 'bg-gray-50 text-gray-500 border-gray-200';
    const v = verdict.toLowerCase();
    if (v === 'yes') return 'bg-green-50 text-green-700 border-green-200';
    if (v === 'no') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
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
