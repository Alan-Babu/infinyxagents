import { AgentTile } from '@nfinyx/agents-landing';
import { ActivityLogEntry, ActivityStatus } from '../models/user-profile-activity.models';

/** Tuple of [action, detail] copy variants per real agent id — synthetic content, not UI chrome, so not translated (same idiom as any other dynamic backend-sourced string in this repo). */
const ACTIVITY_TEMPLATES: Record<string, [string, string][]> = {
    'executive-summary': [
        ['Condensed "Q3 Board Report.pdf" into a leadership brief', 'Reduced a 42-page report into a 1-page executive summary highlighting revenue, risk, and open decisions.'],
        ['Summarized "Regional Market Scan.docx"', 'Produced a board-ready brief covering market entry findings for three regions.'],
    ],
    'doc-compare': [
        ['Compared "Contract_v1.docx" vs "Contract_v2.docx"', '14 changes detected: 3 clause additions, 2 removals, 9 wording edits. Redlined version generated.'],
        ['Compared two versions of the "Vendor SLA"', '5 changes detected, mostly around penalty clauses and renewal terms.'],
    ],
    'digital-attestation': [
        ['Reviewed attestation case WF-51290F5C', 'Police clearance certificate reviewed and approved after stamp verification.'],
        ['Reviewed attestation case WF-6BCAF8DE', 'Marriage certificate flagged for mismatch, sent back for manual review.'],
    ],
    'hr-agent': [
        ['Checked leave balance', '12 annual leave days remaining, 3 sick days used this year.'],
        ['Applied for annual leave', 'Requested 5 days from Oct 12-16, pending manager approval.'],
    ],
    'doc-intel-agent': [
        ['Analyzed "Certificate_of_Origin.pdf"', 'Extracted key facts, verified against source registry, flagged 1 risk: expired accreditation stamp.'],
        ['Analyzed "Trade_Invoice_2201.pdf"', 'Extracted line items and totals, no risks flagged, verified against source.'],
    ],
    'translator-agent': [
        ['Translated "Employment_Contract.pdf" (EN to AR)', '12 pages translated page by page, terminology consistency checked.'],
        ['Translated "Press_Statement.docx" (AR to EN)', '3 pages translated, tone review flagged for one paragraph.'],
    ],
    'grammar-agent': [
        ['Reviewed "Press_Release_Draft.docx"', '8 corrections applied: grammar, punctuation, and one clarity rewrite suggested.'],
        ['Reviewed "Internal_Memo.docx"', '3 corrections applied, style consistent with house guide.'],
    ],
    'contract-analyzer': [
        ['Analyzed "Vendor_Agreement.pdf"', 'Detected 2 parties, overall risk: Medium, 2 open questions on liability caps.'],
        ['Analyzed "Consulting_Agreement.pdf"', 'Overall risk: Low, all standard clauses present, no open questions.'],
    ],
    'mofa-chatbot': [
        ['Asked about Golden Visa renewal', 'Provided renewal steps, required documents, and estimated processing time.'],
        ['Asked about attestation service fees', 'Provided current fee schedule for individual and corporate attestation.'],
    ],
    'email-compose-agent': [
        ['Drafted a reply to a supplier inquiry', 'Generated a formal reply with two tone variants, pre-send checklist passed.'],
        ['Composed a follow-up email from a brief', 'Drafted email with translation option, awaiting your review before sending.'],
    ],
    'asset-intelligence': [
        ['Queried IT asset inventory', '340 devices returned, 12 flagged as due for refresh within 90 days.'],
        ['Ran an asset utilization report', 'Identified 8 underutilized licenses across the design team.'],
    ],
};

const STATUS_OPTIONS: ActivityStatus[] = ['completed', 'completed', 'completed', 'completed', 'needsReview', 'failed'];
const DAYS_OF_HISTORY = 14;

/** Deterministic linear-congruential PRNG so the mock feed is stable across renders. */
function seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
        state = (state * 9301 + 49297) % 233280;
        return state / 233280;
    };
}

export function buildMockActivities(realAgentTiles: AgentTile[]): ActivityLogEntry[] {
    const random = seededRandom(58);
    const now = Date.now();
    const entries: ActivityLogEntry[] = [];

    // A handful of agents (attestation, doc-intel, hr, chatbot) dominate usage, matching the reference's realism.
    const weightedAgentIds: string[] = [];
    const heavilyUsed = new Set(['digital-attestation', 'doc-intel-agent', 'hr-agent', 'mofa-chatbot']);
    for (const tile of realAgentTiles) {
        const weight = heavilyUsed.has(tile.id) ? 6 : 3;
        for (let i = 0; i < weight; i++) weightedAgentIds.push(tile.id);
    }

    let id = 0;
    for (let day = 0; day < DAYS_OF_HISTORY; day++) {
        const perDay = day < 3 ? 3 + Math.floor(random() * 4) : Math.floor(random() * 3);
        for (let i = 0; i < perDay; i++) {
            const agentId = weightedAgentIds[Math.floor(random() * weightedAgentIds.length)];
            const templates = ACTIVITY_TEMPLATES[agentId];
            const [action, detail] = templates[Math.floor(random() * templates.length)];
            const status = STATUS_OPTIONS[Math.floor(random() * STATUS_OPTIONS.length)];
            const ts = now - day * 86400000 - Math.floor(random() * 10 * 3600000) - Math.floor(random() * 3600000);
            entries.push({ id: `activity-${id++}`, agentId, action, detail, status, ts });
        }
    }

    return entries.sort((a, b) => b.ts - a.ts);
}
