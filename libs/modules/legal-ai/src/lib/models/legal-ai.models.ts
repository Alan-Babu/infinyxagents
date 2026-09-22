/** Wire types mirroring backend/app/schemas/schemas.py and the router payloads. */

export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type FindingStatus =
  | 'COMPLIANT'
  | 'NON_COMPLIANT'
  | 'NEEDS_REVIEW'
  | 'AMBIGUOUS'
  | 'NOT_APPLICABLE'
  | 'INSUFFICIENT_EVIDENCE';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export interface AnalysisProgress {
  stage: string;
  clause_index: number;
  total_clauses: number;
  percent: number;
  updated_at: string;
  note?: string;
}

export interface DocumentItem {
  id: string;
  filename: string;
  original_name: string;
  contract_type: string;
  jurisdiction: string;
  governing_law: string;
  uploaded_at: string;
  status: DocumentStatus | string;
  high_risk: boolean;
  needs_review: boolean;
  findings_count: number;
  total_clauses?: number;
  progress?: AnalysisProgress | null;
}

export interface DocumentDetail extends DocumentItem {
  progress: AnalysisProgress | null;
}

export interface Finding {
  id?: string;
  clause_number: string;
  clause_text: string;
  legal_topic: string;
  status: FindingStatus | string;
  severity: Severity | string;
  law_number?: string | null;
  law_title?: string | null;
  article_number?: string | null;
  article_title?: string | null;
  source_url?: string | null;
  evidence?: string | null;
  reasoning: string;
  recommendation?: string | null;
  confidence: number;
  human_review_required: boolean;
  review_status?: 'PENDING' | 'APPROVED' | 'REJECTED' | string | null;
  reviewer?: string | null;
  review_note?: string | null;
  reviewed_at?: string | null;
}

export interface AnalysisSummary {
  document_id: string;
  filename: string;
  contract_type: string;
  jurisdiction: string;
  governing_law?: string | null;
  overall_status: DocumentStatus | string;
  compliant_count: number;
  non_compliant_count: number;
  needs_review_count: number;
  ambiguous_count: number;
  not_applicable_count: number;
  insufficient_evidence_count: number;
  findings: Finding[];
  applicable_laws: string[];
  disclaimer: string;
}

export interface AuditEntry {
  id: string;
  document_id?: string;
  action: string;
  actor: string;
  model_used?: string | null;
  prompt_version?: string | null;
  timestamp: string;
  details_json?: string | null;
}

export interface EntityDate { type: string; text: string; parsed?: string | null }
export interface EntityMoney { type: string; currency: string; amount: number }
export interface EntityDuration { type: string; value: number | string; unit: string }
export interface EntityText { text: string }

export interface DocumentEntities {
  parties?: EntityText[];
  dates?: EntityDate[];
  monetary_amounts?: EntityMoney[];
  durations?: EntityDuration[];
  jurisdictions?: EntityText[];
  termination?: EntityText[];
  confidentiality?: EntityText[];
  ip_ownership?: EntityText[];
  data_protection?: EntityText[];
}

export interface LawItem {
  id: string;
  law_number: string;
  title: string;
  jurisdiction: string;
  category: string | null;
  status: string;
  effective_date: string | null;
  source_url: string;
  article_count: number;
}

export interface LawArticle {
  id: string;
  law_id: string;
  article_number: string;
  article_title: string | null;
  article_text: string;
  effective_from: string | null;
}

export interface QACitation {
  law_number: string;
  law_title: string;
  article_number: string;
  article_title?: string | null;
  text?: string | null;
  source_url?: string | null;
  relevance_score?: number;
}

export interface QAResponse {
  question: string;
  answer: string;
  source: string;
  model?: string | null;
  document_id?: string | null;
  document_name?: string | null;
  session_id?: string | null;
  intent: string;
  flagged: boolean;
  citations: QACitation[];
}

export interface ChatMessageDto {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: string | null;
  is_toxic: boolean;
  source?: string | null;
  created_at?: string | null;
}

export interface FindingReviewRequest {
  decision: 'approve' | 'reject';
  note?: string;
  reviewer?: string;
  status?: string;
}

export interface UploadResponse {
  id: string;
  filename: string;
  original_name: string;
  status: string;
  message: string;
}
