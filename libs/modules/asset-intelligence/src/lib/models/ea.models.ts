export type EALayer = 'BUSINESS' | 'APPLICATION' | 'TECHNOLOGY';
export type EAElementType = 'CAPABILITY' | 'BUSINESS_PROCESS' | 'BUSINESS_ACTOR' | 'BUSINESS_SERVICE';
export type DiagramType = 'LAYERED_VIEW' | 'CAPABILITY_MAP' | 'CUSTOM';
export type DiagramNodeKind = 'ELEMENT' | 'APPLICATION' | 'ASSET';
export type ApplicationLifecycleStatus = 'PLANNED' | 'ACTIVE' | 'DEPRECATED' | 'RETIRED';
export type ProjectStatus = 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type HealthBand = 'HEALTHY' | 'WATCH' | 'AT_RISK';

export interface EAElement {
    id: string;
    name: string;
    description?: string | null;
    element_type: EAElementType;
    parent_id?: string | null;
}

export interface EADiagram {
    id: string;
    name: string;
    description?: string | null;
    diagram_type: DiagramType;
    created_at: string;
}

export interface DiagramNode {
    node_key: string;
    kind: DiagramNodeKind;
    ref_id: string;
    name: string;
    layer: EALayer;
    subtype: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface DiagramEdge {
    source_key: string;
    target_key: string;
    kind: string;
}

export interface DiagramLayout {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
}

export interface DiagramLayoutUpdateItem {
    node_key: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface CapabilityNode {
    id: string;
    name: string;
    health_score: number;
    health_band: HealthBand;
    linked_asset_count: number;
    linked_application_count: number;
    children: CapabilityNode[];
}

export interface Application {
    id: string;
    name: string;
    description?: string | null;
    business_owner_id?: string | null;
    technical_owner_id?: string | null;
    department_id?: string | null;
    criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    lifecycle_status: ApplicationLifecycleStatus;
    created_at: string;
}

export interface ApplicationAssetLink {
    application_id: string;
    name: string;
    role: string;
    criticality: string;
}

export interface ApplicationCapabilityLink {
    capability_id: string;
    name: string;
}

export interface Project {
    id: string;
    name: string;
    description?: string | null;
    status: ProjectStatus;
    start_date?: string | null;
    end_date?: string | null;
    budget?: number | null;
    project_manager_id?: string | null;
    department_id?: string | null;
    created_at: string;
}

export interface ProjectAssetLink {
    project_id: string;
    name: string;
    role: string;
    status: string;
}
