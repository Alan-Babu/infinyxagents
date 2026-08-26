import { Injectable } from '@angular/core';
import { AttestationCase, CaseDecision, PipelineStep } from '../models/digital-attestation.models';
import {
    AgentExecutionLog,
    AgentExecutionLogsResponse,
    ReviewDecisionRequest,
    ReviewDecisionResponse,
    VerificationWorkflowEnvelope,
    VerificationWorkflowQueueItem,
    VerificationWorkflowQueueResponse,
    WorkflowDocumentAction,
    WorkflowDocumentSource,
} from '../models/verification-workflow.models';
import { mapAgentExecutionLogs, mapWorkflowToCase } from '../utils/verification-workflow.mapper';
import { DigitalAttestationApiBase } from './digital-attestation-api-base';

@Injectable({ providedIn: 'root' })
export class DigitalAttestationApiService extends DigitalAttestationApiBase {
    private async unwrap<T>(promise: Promise<VerificationWorkflowEnvelope<T>>): Promise<T> {
        const res = await promise;
        return res.data;
    }

    async listCases(status: 'pending' | 'completed', opts?: { limit?: number; offset?: number }): Promise<{ items: AttestationCase[]; total: number }> {
        const data = await this.unwrap(
            this.get<VerificationWorkflowEnvelope<VerificationWorkflowQueueResponse>>('/reviews/queue', {
                limit: opts?.limit ?? 100,
                offset: opts?.offset ?? 0,
                status,
            }),
        );
        return { items: data.items.map(item => mapWorkflowToCase(item)), total: data.total };
    }

    async getCase(id: string): Promise<AttestationCase | undefined> {
        try {
            const item = await this.unwrap(this.get<VerificationWorkflowEnvelope<VerificationWorkflowQueueItem>>(`/${id}`));
            return mapWorkflowToCase(item);
        } catch {
            return undefined;
        }
    }

    /**
     * Matches the reference app's `submitHumanReview`: PATCH the decision and return — no
     * re-fetch of the single workflow afterward. Callers close the drawer and reload the
     * list (the queue endpoint is the source of truth for refreshed state).
     */
    async decide(id: string, decision: CaseDecision, reviewerId: string, notes?: string, reasons: string[] = []): Promise<void> {
        const body: ReviewDecisionRequest = {
            decision,
            reviewer_id: reviewerId || null,
            notes: notes?.trim() || null,
            reasons: [`ReviewHub ${decision.toLowerCase()}`, ...reasons.slice(0, 5)],
        };
        await this.unwrap(this.patch<VerificationWorkflowEnvelope<ReviewDecisionResponse>>(`/${id}/review`, body));
    }

    async getAgentRuns(id: string, opts?: { limit?: number; offset?: number }): Promise<PipelineStep[]> {
        const data = await this.unwrap(
            this.get<VerificationWorkflowEnvelope<AgentExecutionLogsResponse | AgentExecutionLog[]>>(`/${id}/agent-execution-logs`, {
                limit: opts?.limit ?? 50,
                offset: opts?.offset ?? 0,
            }),
        );
        const logs = Array.isArray(data) ? data : (data?.items ?? []);
        return mapAgentExecutionLogs(logs);
    }

    getDocumentBlob(id: string, source: WorkflowDocumentSource, action: WorkflowDocumentAction): Promise<Blob> {
        return this.getBlob(`/${id}/documents/${source}/${action}`);
    }
}
