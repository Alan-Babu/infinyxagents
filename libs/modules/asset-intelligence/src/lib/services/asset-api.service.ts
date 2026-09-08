import { Injectable } from '@angular/core';
import { AssetIntelligenceApiBase } from './asset-intelligence-api-base';
import {
    Asset,
    AssetAlert,
    AssetIntelligence,
    AssetListFilters,
    ImpactAnalysisResult,
    PortfolioIntelligence,
} from '../models/asset.models';
import { CostByDepartmentRow, DepreciationSchedule, DepreciationSummary, UtilizationHeatmapGroup } from '../models/reports.models';

@Injectable({ providedIn: 'root' })
export class AssetApiService extends AssetIntelligenceApiBase {
    listAssets(filters?: AssetListFilters): Promise<Asset[]> {
        return this.get<Asset[]>('/assets', { q: filters?.q, status: filters?.status || undefined });
    }

    getAsset(id: string): Promise<Asset> {
        return this.get<Asset>(`/assets/${id}`);
    }

    createAsset(payload: Partial<Asset>): Promise<Asset> {
        return this.post<Asset>('/assets', payload);
    }

    updateAsset(id: string, payload: Partial<Asset>): Promise<Asset> {
        return this.patch<Asset>(`/assets/${id}`, payload);
    }

    retireAsset(id: string): Promise<Asset> {
        return this.post<Asset>(`/assets/${id}/retire`, {});
    }

    getByTag(tag: string): Promise<Asset> {
        return this.get<Asset>(`/assets/by-tag/${encodeURIComponent(tag)}`);
    }

    getBarcodeBlob(assetId: string): Promise<Blob> {
        return this.getBlob(`/assets/${assetId}/barcode`);
    }

    listAlerts(status: 'OPEN' | 'RESOLVED' = 'OPEN'): Promise<AssetAlert[]> {
        return this.get<AssetAlert[]>('/alerts', { status });
    }

    updateAlert(id: string, status: 'OPEN' | 'RESOLVED'): Promise<AssetAlert> {
        return this.patch<AssetAlert>(`/alerts/${id}`, { status });
    }

    runAlertScan(): Promise<{ alerts_processed: number }> {
        return this.post<{ alerts_processed: number }>('/alerts/scan', {});
    }

    getUnderutilized(): Promise<UtilizationHeatmapGroup['assets']> {
        return this.get('/utilization/underutilized');
    }

    getOverutilized(): Promise<UtilizationHeatmapGroup['assets']> {
        return this.get('/utilization/overutilized');
    }

    getUtilizationHeatmap(): Promise<UtilizationHeatmapGroup[]> {
        return this.get<UtilizationHeatmapGroup[]>('/utilization/heatmap');
    }

    getImpactAnalysis(assetId: string): Promise<ImpactAnalysisResult> {
        return this.get<ImpactAnalysisResult>(`/graph/impact/${assetId}`);
    }

    getCostByDepartment(): Promise<CostByDepartmentRow[]> {
        return this.get<CostByDepartmentRow[]>('/cost/by-department');
    }

    getDepreciationSchedule(assetId: string): Promise<DepreciationSchedule> {
        return this.get<DepreciationSchedule>(`/cost/depreciation/${assetId}`);
    }

    getDepreciationSummary(): Promise<DepreciationSummary> {
        return this.get<DepreciationSummary>('/cost/depreciation-summary');
    }

    getAssetIntelligence(assetId: string): Promise<AssetIntelligence> {
        return this.get<AssetIntelligence>(`/intelligence/asset/${assetId}`);
    }

    getPortfolioIntelligence(): Promise<PortfolioIntelligence> {
        return this.get<PortfolioIntelligence>('/intelligence/portfolio');
    }

    downloadDepreciationCsv(): Promise<Blob> {
        return this.getBlob('/cost/export/depreciation');
    }

    downloadCostByDepartmentCsv(): Promise<Blob> {
        return this.getBlob('/cost/export/by-department');
    }
}
