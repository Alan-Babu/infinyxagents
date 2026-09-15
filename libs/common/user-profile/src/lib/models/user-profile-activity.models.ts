export type ActivityStatus = 'completed' | 'needsReview' | 'failed' | 'inProgress';

export interface ActivityLogEntry {
    id: string;
    agentId: string;
    action: string;
    detail: string;
    status: ActivityStatus;
    ts: number;
}

export interface UsageByAgentEntry {
    agentId: string;
    count: number;
}

export interface CategoryMixSegment {
    categoryKey: string;
    count: number;
    colorClass: string;
}
