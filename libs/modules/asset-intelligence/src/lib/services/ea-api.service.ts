import { Injectable } from '@angular/core';
import { AssetIntelligenceApiBase } from './asset-intelligence-api-base';
import {
    CapabilityNode,
    DiagramLayout,
    DiagramLayoutUpdateItem,
    DiagramNodeKind,
    DiagramType,
    EADiagram,
    EAElement,
    EAElementType,
} from '../models/ea.models';

@Injectable({ providedIn: 'root' })
export class EaApiService extends AssetIntelligenceApiBase {
    listElements(): Promise<EAElement[]> {
        return this.get<EAElement[]>('/ea/elements');
    }

    createElement(payload: { name: string; element_type: EAElementType; parent_id?: string | null; description?: string | null }): Promise<EAElement> {
        return this.post<EAElement>('/ea/elements', payload);
    }

    deleteElement(id: string): Promise<void> {
        return this.delete<void>(`/ea/elements/${id}`);
    }

    listDiagrams(): Promise<EADiagram[]> {
        return this.get<EADiagram[]>('/ea/diagrams');
    }

    createDiagram(payload: { name: string; description?: string | null; diagram_type?: DiagramType }): Promise<EADiagram> {
        return this.post<EADiagram>('/ea/diagrams', payload);
    }

    getDiagramLayout(diagramId: string): Promise<DiagramLayout> {
        return this.get<DiagramLayout>(`/ea/diagrams/${diagramId}/layout`);
    }

    addDiagramNode(diagramId: string, kind: DiagramNodeKind, refId: string, x = 60, y = 60): Promise<DiagramLayout> {
        return this.post<DiagramLayout>(`/ea/diagrams/${diagramId}/nodes`, { kind, ref_id: refId, x, y });
    }

    saveDiagramLayout(diagramId: string, items: DiagramLayoutUpdateItem[]): Promise<void> {
        return this.put<void>(`/ea/diagrams/${diagramId}/layout`, { items });
    }

    autoPopulateFromApplication(diagramId: string, applicationId: string): Promise<DiagramLayout> {
        return this.post<DiagramLayout>(`/ea/diagrams/${diagramId}/auto-populate/${applicationId}`, {});
    }

    getCapabilityMap(): Promise<CapabilityNode[]> {
        return this.get<CapabilityNode[]>('/ea/capability-map');
    }
}
