export type AssetStatus = 'IN_USE' | 'IDLE' | 'IN_REPAIR' | 'RESERVED' | 'RETIRED';
export type AssetCriticality = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'RESOLVED';
export type UtilizationClassification = 'OPTIMAL' | 'UNDERUTILIZED' | 'OVERUTILIZED' | 'UNKNOWN';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Asset {
    id: string;
    asset_tag: string;
    name: string;
    status: AssetStatus;
    lifecycle_stage: string;
    category_id?: string | null;
    division_id?: string | null;
    department_id?: string | null;
    custodian_id?: string | null;
    purchase_date?: string | null;
    purchase_amount?: number | null;
    commissioned_date?: string | null;
    warranty_expiry?: string | null;
    planned_retirement_date?: string | null;
    is_rented: boolean;
    criticality: AssetCriticality;
    asset_metadata?: Record<string, unknown> | null;
}

export interface AssetListFilters {
    q?: string;
    status?: AssetStatus | '';
}

export interface AssetAlert {
    id: string;
    asset_id: string;
    alert_type: string;
    severity: AlertSeverity;
    message: string;
    due_date?: string | null;
    status: AlertStatus;
    generated_by: string;
    created_at: string;
}

export interface AgentChatResponse {
    answer: string;
    model_used: string;
    grounded_asset_ids: string[];
}

export interface AgentStatus {
    llm_enabled: boolean;
    llm_model: string;
    llm_base_url: string;
}

export interface ImpactAnalysisResult {
    affected_assets: Array<{
        asset_id: string;
        name: string;
        depth: number;
        impact_weight: number;
    }>;
}

export interface AssetIntelligence {
    risk_level: RiskLevel;
    recommendation: string;
    recommendation_reason: string;
    utilization_status: UtilizationClassification;
    lifecycle_status: string;
    confidence: 'LOW' | 'MEDIUM' | 'HIGH';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    human_approval_required: boolean;
    issues: string[];
    optimization_opportunities: string[];
    missing_information: string[];
}

export interface PortfolioIntelligence {
    executive_summary: string;
    critical_risk_assets: number;
    high_risk_assets: number;
    eol_eos_assets: number;
    decommission_candidates: number;
    consolidation_candidates: number;
}
