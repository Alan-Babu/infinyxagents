import { AttestationCase, CaseMatching, CaseMatchingRationale, CaseMode, CaseStatus, CaseSubMode, DocType, PipelineStep } from '../models/digital-attestation.models';
import { AgentExecutionLog, OfficialComparisonData, VerificationWorkflowQueueItem } from '../models/verification-workflow.models';

/** API confidence may arrive as a 0-1 fraction or already 0-100 — normalize to a rounded 0-100 int. */
export function normalizeConfidence(raw: number | null | undefined): number {
    if (raw === null || raw === undefined) return 0;
    const pct = raw <= 1 ? raw * 100 : raw;
    return Math.max(0, Math.min(100, Math.round(pct)));
}

/**
 * The queue endpoint's own `status` query param only distinguishes pending|completed —
 * there's no dedicated "failed" bucket. This heuristic treats a workflow as failed when
 * its own pipeline status/OCR status/error_message indicate a failure, independent of
 * human-review outcome. Validate against real sample data once available.
 */
function isPipelineFailure(item: VerificationWorkflowQueueItem): boolean {
    return item.status?.toUpperCase() === 'FAILED' || item.ocr_status?.toUpperCase() === 'FAILED' || !!item.error_message;
}

function deriveStatus(item: VerificationWorkflowQueueItem): CaseStatus {
    const finalDecision = item.final_decision?.toUpperCase();
    if (finalDecision === 'REJECTED') return 'REJECTED';
    if (finalDecision === 'APPROVED' || finalDecision === 'AUTO_APPROVED') return 'APPROVED';
    if (isPipelineFailure(item)) return 'FAILED';
    return 'PENDING';
}

function deriveSubMode(status: CaseStatus): CaseSubMode {
    if (status === 'APPROVED' || status === 'REJECTED') return 'COMPLETED';
    if (status === 'FAILED') return 'PIPELINE_ERROR';
    return 'HUMAN_REVIEW';
}

function parseTimestamp(raw: string | undefined): number {
    const ms = raw ? Date.parse(raw) : NaN;
    return Number.isNaN(ms) ? Date.now() : ms;
}

/** Maps a raw queue/single-workflow item to the UI-facing `AttestationCase`. `pipeline` is
 * left empty here — it's populated separately via `getAgentRuns()` when the drawer's Agents
 * tab is opened, since the queue/get-by-id responses don't include the full step list. */
export function mapWorkflowToCase(item: VerificationWorkflowQueueItem, existingPipeline: PipelineStep[] = []): AttestationCase {
    const status = deriveStatus(item);
    const confidence = normalizeConfidence(item.confidence_score);
    const reviewedAt = item.human_review?.reviewed_at ? parseTimestamp(item.human_review.reviewed_at) : null;

    return {
        id: item.workflow_id,
        simId: null,
        docType: (item.document_type as DocType) ?? ('' as DocType),
        // Matches the reference app's `toRow()`: fall back to the code, then a placeholder.
        country: item.country || item.country_code || '—',
        countryCode: item.country_code ?? '',
        status,
        confidence,
        overallConfidence: confidence,
        risk: item.risk_score ?? 0,
        mode: (item.verification_mode as CaseMode) ?? 'OFFICIAL_SOURCE',
        subMode: deriveSubMode(status),
        file: item.file_name ?? '',
        mismatch: item.decision_reasons ?? [],
        pipeline: existingPipeline,
        createdAt: parseTimestamp(item.created_at),
        updatedAt: parseTimestamp(item.updated_at),
        reviewedAt,
        reviewer: item.human_review?.reviewer_id ?? null,
        notes: item.human_review?.notes ?? '',
    };
}

function pipelineStepStatus(raw: string | undefined): PipelineStep['status'] {
    const upper = raw?.toUpperCase();
    if (upper === 'FAILED' || upper === 'ERROR') return 'FAILED';
    if (upper === 'SKIPPED') return 'SKIPPED';
    return 'COMPLETED';
}

function formatDuration(seconds: number | null | undefined): string | undefined {
    if (seconds === null || seconds === undefined) return undefined;
    return seconds < 1 ? `${Math.round(seconds * 1000)}ms` : `${seconds.toFixed(1)}s`;
}

/** "ATTESTATION_ISSUANCE" -> "Attestation issuance" — the API gives no separate display name. */
function humanizeLabel(raw: string): string {
    const words = raw.replace(/_/g, ' ').trim().toLowerCase();
    return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * The single-workflow response doesn't reliably carry `document_id` at a fixed path —
 * mirrors the reference app's `documentIdFromUnknown`: search up to 4 levels deep for a
 * `document_id`/`documentId` key, recursing into arrays and the specific nested keys a
 * workflow response is known to use (`documents`, `result`, `uploaded_document`, `document`).
 */
export function documentIdFromUnknown(value: unknown, depth = 0): string | null {
    if (value == null || depth > 4) return null;
    if (Array.isArray(value)) {
        for (const item of value) {
            const found = documentIdFromUnknown(item, depth + 1);
            if (found) return found;
        }
        return null;
    }
    if (typeof value !== 'object') return null;
    const rec = value as Record<string, unknown>;
    const direct = rec['document_id'] ?? rec['documentId'];
    if (typeof direct === 'string' && direct.trim()) return direct.trim();
    for (const key of ['documents', 'result', 'uploaded_document', 'document']) {
        if (key in rec) {
            const found = documentIdFromUnknown(rec[key], depth + 1);
            if (found) return found;
        }
    }
    return null;
}

function matchingSeverity(raw: string): CaseMatchingRationale['severity'] {
    const s = raw.toLowerCase();
    if (s === 'ok' || s === 'match' || s === 'pass') return 'ok';
    if (s === 'bad' || s === 'mismatch' || s === 'fail') return 'bad';
    return 'warn';
}

/** Maps the raw `/official-comparison` DTO to the UI-facing `CaseMatching` model. */
export function mapOfficialComparison(raw: OfficialComparisonData): CaseMatching {
    return {
        applicantName: raw.applicant_name ?? '',
        keyIdentifier: raw.key_identifier ?? '',
        fields: (raw.fields ?? []).map(f => ({
            fieldName: f.field_name,
            label: f.label || f.field_name,
            weight: f.weight <= 1 ? f.weight * 100 : f.weight,
            inputValue: f.input_value ?? '',
            officialValue: f.official_value ?? '',
            score: normalizeConfidence(f.score),
        })),
        overallMatchPercent: normalizeConfidence(raw.overall_match_percent),
        decision: raw.decision?.decision ?? '',
        decisionForced: raw.decision?.forced ?? false,
        decisionReason: raw.decision?.reason ?? '',
        rationale: (raw.rationale ?? []).map(r => ({
            fieldName: r.field_name,
            severity: matchingSeverity(r.severity),
            message: r.message,
        })),
        portal: raw.portal
            ? {
                  source: raw.portal.verification_source ?? '',
                  verified: raw.portal.is_verified ?? null,
                  status: raw.portal.portal_status ?? '',
                  checkedAt: raw.portal.checked_at ? parseTimestamp(raw.portal.checked_at) : null,
                  portalUrl: raw.portal.portal_url ?? null,
              }
            : null,
    };
}

export function mapAgentExecutionLogs(logs: AgentExecutionLog[]): PipelineStep[] {
    return logs.map((log, idx) => ({
        key: log.id || `${log.agent_name ?? 'agent'}-${idx}`,
        name: log.agent_stage ? humanizeLabel(log.agent_stage) : (log.agent_name ?? `Step ${idx + 1}`),
        agent: log.agent_name ?? '',
        status: pipelineStepStatus(log.status),
        detail: log.error_message ?? '',
        confidence: log.confidence_score !== undefined && log.confidence_score !== null ? normalizeConfidence(log.confidence_score) : null,
        durationLabel: formatDuration(log.duration_seconds),
    }));
}
