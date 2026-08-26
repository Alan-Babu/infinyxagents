import { AttestationCase, CaseMode, CaseStatus, CaseSubMode, DocType, PipelineStep } from '../models/digital-attestation.models';
import { AgentExecutionLog, VerificationWorkflowQueueItem } from '../models/verification-workflow.models';

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
