export interface DocPage {
    page_num: number;
    text: string;
    word_count: number;
}

export interface DocSide {
    source: 'upload' | 'saved' | 'uploading';
    label: string;
    filename?: string;
    size?: number;
    pageCount: number;
    file?: File;
    uploadRef?: string;
    savedVersionId?: string;
    isMaster?: boolean;
}

export type HunkKind = 'add' | 'delete' | 'replace';
export type HunkChoice = 'base' | 'compare';

export interface Hunk {
    id: string;
    page_num: number;
    kind: HunkKind;
    old_text: string;
    new_text: string;
    global_index?: number;
}

export interface Segment {
    type: 'equal' | 'hunk';
    value?: string;
    hunk?: Hunk;
}

export interface PageCounts {
    additions: number;
    deletions: number;
    overwrites: number;
    total: number;
}

export interface DiffPageResult {
    page_num: number;
    exists_in_a: boolean;
    exists_in_b: boolean;
    segments: Segment[];
    counts: PageCounts;
    has_changes: boolean;
}

export interface ChangeIndexEntry {
    id: string;
    page_num: number;
    kind: HunkKind;
}

export interface DiffResult {
    pages: DiffPageResult[];
    similarity: number;
    total_added: number;
    total_removed: number;
    pages_changed: number;
    total_pages: number;
    total_changes: number;
    change_index: ChangeIndexEntry[];
}

export interface AgentSummary {
    summary: string | null;
    risk_level: string;
    risk_reason: string;
    key_changes: string[];
}

export interface CompareResponse {
    comparison_id: string;
    base_label: string;
    compare_label: string;
    diff: DiffResult;
    agent: AgentSummary;
}

export interface VersionSummary {
    id: string;
    label: string;
    filename?: string;
    tag: string;
    notes?: string;
    page_count: number;
    is_master: boolean;
    created_at: string;
}

export interface VersionDetail extends VersionSummary {
    pages: DocPage[];
}

export interface ComparisonLogEntry {
    id: string;
    base_label: string;
    compare_label: string;
    similarity: number;
    additions: number;
    deletions: number;
    pages_changed: number;
    total_pages: number;
    agent_summary: string | null;
    agent_risk_level: string;
    created_at: string;
}
