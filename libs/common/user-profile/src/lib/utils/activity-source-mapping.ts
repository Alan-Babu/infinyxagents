import { ActivityStatus } from '../models/user-profile-activity.models';

/**
 * Maps a Logs DB row's `sourceService` (the stable, always-non-null
 * top-level emitter id every agent's `emit_log_event` client hardcodes --
 * see e.g. HR_AGENT's and exec-summary-agent's `SOURCE_SERVICE` constant)
 * to this frontend's AGENT_TILES id. Deliberately keyed by sourceService,
 * not agentId: agentId on a row can be null or represent an internal
 * sub-agent, while sourceService is always the top-level product identity.
 *
 * CHECKLIST for wiring up a new agent's activity into this tab: add one
 * entry here mapping its `SOURCE_SERVICE` string to the matching
 * AGENT_TILES id. Nothing else needs to change -- the /my-activity
 * endpoint and its schema are already agent-agnostic.
 */
export const SOURCE_SERVICE_TO_TILE_ID: Record<string, string> = {
    hr_agent: 'hr-agent',
    exec_summary_agent: 'executive-summary',
};

export function tileIdForSourceService(sourceService: string): string | undefined {
    return SOURCE_SERVICE_TO_TILE_ID[sourceService];
}

/** Translates the Logs DB's `status`/`complianceFlag` strings into the UI's status enum. */
export function mapActivityStatus(status: string, complianceFlag: string | undefined): ActivityStatus {
    if (status === 'Error') return 'failed';
    if (complianceFlag === 'Flagged') return 'needsReview';
    return 'completed';
}
