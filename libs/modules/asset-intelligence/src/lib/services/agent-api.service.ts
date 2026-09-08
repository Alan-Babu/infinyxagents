import { Injectable } from '@angular/core';
import { AssetIntelligenceApiBase } from './asset-intelligence-api-base';
import { AgentChatResponse, AgentStatus } from '../models/asset.models';

@Injectable({ providedIn: 'root' })
export class AgentApiService extends AssetIntelligenceApiBase {
    chat(query: string, contextAssetId?: string): Promise<AgentChatResponse> {
        return this.post<AgentChatResponse>('/agent/chat', { query, context_asset_id: contextAssetId ?? null });
    }

    status(): Promise<AgentStatus> {
        return this.get<AgentStatus>('/agent/status');
    }
}
