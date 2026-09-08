import { Injectable } from '@angular/core';
import { AssetIntelligenceApiBase } from './asset-intelligence-api-base';
import { Project, ProjectAssetLink, ProjectStatus } from '../models/ea.models';

@Injectable({ providedIn: 'root' })
export class ProjectApiService extends AssetIntelligenceApiBase {
    list(status?: ProjectStatus): Promise<Project[]> {
        return this.get<Project[]>('/projects', { status });
    }

    getById(id: string): Promise<Project> {
        return this.get<Project>(`/projects/${id}`);
    }

    create(payload: Partial<Project>): Promise<Project> {
        return this.post<Project>('/projects', payload);
    }

    getAssets(projectId: string): Promise<ProjectAssetLink[]> {
        return this.get<ProjectAssetLink[]>(`/projects/${projectId}/assets`);
    }

    getForAsset(assetId: string): Promise<ProjectAssetLink[]> {
        return this.get<ProjectAssetLink[]>(`/projects/by-asset/${assetId}`);
    }

    linkAsset(projectId: string, assetId: string, role = 'PROCURED_FOR'): Promise<void> {
        return this.post<void>('/projects/asset-links', { project_id: projectId, asset_id: assetId, role });
    }
}
