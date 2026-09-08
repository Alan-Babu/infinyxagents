import { DataTableStatusEntry } from '@nfinyx/data-table';
import { AlertSeverity, AssetCriticality, AssetStatus, RiskLevel, UtilizationClassification } from '../models/asset.models';

export function statusEntry(status: AssetStatus, t: (key: string) => string): DataTableStatusEntry {
    const severityMap: Record<AssetStatus, DataTableStatusEntry['severity']> = {
        IN_USE: 'success',
        IDLE: 'secondary',
        IN_REPAIR: 'warn',
        RESERVED: 'info',
        RETIRED: 'danger',
    };
    return { severity: severityMap[status], label: t(`assetIntelligence.status.${status}`) };
}

export function criticalityEntry(criticality: AssetCriticality, t: (key: string) => string): DataTableStatusEntry {
    const severityMap: Record<AssetCriticality, DataTableStatusEntry['severity']> = {
        LOW: 'success',
        MEDIUM: 'warn',
        HIGH: 'danger',
        CRITICAL: 'danger',
    };
    return { severity: severityMap[criticality], label: t(`assetIntelligence.criticality.${criticality}`) };
}

export function alertSeverityEntry(severity: AlertSeverity, t: (key: string) => string): DataTableStatusEntry {
    return criticalityEntry(severity, t);
}

export function riskLevelBadgeClass(risk: RiskLevel): string {
    const map: Record<RiskLevel, string> = {
        LOW: 'bg-green-50 border-green-200 text-green-700',
        MEDIUM: 'bg-amber-50 border-amber-200 text-amber-700',
        HIGH: 'bg-red-50 border-red-200 text-red-700',
        CRITICAL: 'bg-red-100 border-red-300 text-red-800',
    };
    return map[risk];
}

export function utilizationBadgeClass(classification: UtilizationClassification): string {
    const map: Record<UtilizationClassification, string> = {
        OPTIMAL: 'bg-green-50 border-green-200 text-green-700',
        UNDERUTILIZED: 'bg-amber-50 border-amber-200 text-amber-700',
        OVERUTILIZED: 'bg-red-50 border-red-200 text-red-700',
        UNKNOWN: 'bg-gray-50 border-gray-200 text-gray-500',
    };
    return map[classification];
}
