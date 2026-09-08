import { Injectable } from '@angular/core';
import { AssetIntelligenceApiBase } from './asset-intelligence-api-base';
import { Application, ApplicationAssetLink, ApplicationCapabilityLink } from '../models/ea.models';

@Injectable({ providedIn: 'root' })
export class ApplicationApiService extends AssetIntelligenceApiBase {
    list(): Promise<Application[]> {
        return this.get<Application[]>('/applications');
    }

    getById(id: string): Promise<Application> {
        return this.get<Application>(`/applications/${id}`);
    }

    create(payload: Partial<Application>): Promise<Application> {
        return this.post<Application>('/applications', payload);
    }

    getAssets(applicationId: string): Promise<ApplicationAssetLink[]> {
        return this.get<ApplicationAssetLink[]>(`/applications/${applicationId}/assets`);
    }

    getForAsset(assetId: string): Promise<ApplicationAssetLink[]> {
        return this.get<ApplicationAssetLink[]>(`/applications/by-asset/${assetId}`);
    }

    linkAsset(applicationId: string, assetId: string, role = 'HOSTS'): Promise<void> {
        return this.post<void>('/applications/asset-links', { application_id: applicationId, asset_id: assetId, role });
    }

    linkCapability(applicationId: string, eaElementId: string): Promise<void> {
        return this.post<void>('/applications/capability-links', { application_id: applicationId, ea_element_id: eaElementId });
    }

    getCapabilities(applicationId: string): Promise<ApplicationCapabilityLink[]> {
        return this.get<ApplicationCapabilityLink[]>(`/applications/${applicationId}/capabilities`);
    }
}
