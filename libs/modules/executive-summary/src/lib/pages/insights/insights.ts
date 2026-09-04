import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService, CommonService } from '@nfinyx/services';
import { marked } from 'marked';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PopoverModule } from 'primeng/popover';
import { RatingModule } from 'primeng/rating';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

import { ExecSummaryApiService } from '../../services/exec-summary-api.service';
import { CountryDashboardComponent } from '../../components/country-dashboard/country-dashboard';
import { HistoryPanelComponent } from '../../components/history-panel/history-panel';
import { ExportPanelComponent, RecentReport } from '../../components/export-panel/export-panel';
import { AdminSettingsDrawerComponent } from '../../components/admin-settings-drawer/admin-settings-drawer';
import { AgentOptionsPanelComponent } from '../../components/agent-options-panel/agent-options-panel';
import { ProfileSettingsComponent } from '../../components/profile-settings/profile-settings';
import { ShareTaskDrawerComponent, ShareTaskFormModel, ShareTaskStage } from '../../components/share-task-drawer/share-task-drawer';
import { ScheduleDrawerComponent, ScheduleFormModel } from '../../components/schedule-drawer/schedule-drawer';
import { SaveProfileDrawerComponent, SaveProfileFormModel } from '../../components/save-profile-drawer/save-profile-drawer';
import {
    ClarifyingQuestion,
    CountryDashboardData,
    ExpertiseLevel,
    Framework,
    HistoryEntry,
    LengthPreset,
    McpServerEntry,
    OutputFormat,
    Provider,
    ResearchType,
    ScheduleJobRequest,
    ScheduledJobEntry,
    SourceHit,
} from '../../models/executive-summary.models';

type Stage = 'idle' | 'clarifying' | 'params' | 'loading' | 'result';
type SaveStage = 'prompt' | 'form' | 'saved' | 'skipped';
type ActionStage = 'prompt' | 'share' | 'task' | 'dismissed';
type ScheduleStage = 'prompt' | 'form' | 'saved' | 'skipped';

interface Opt { label: string; description?: string }

const TEMPLATE_OPTIONS: Opt[] = [
    { label: 'Auto (agent picks)' },
    { label: 'UAE Color Theme' },
    { label: 'Editorial Navy' },
    { label: 'Corporate Minimal' },
    { label: 'Modern Teal' },
];

const FRAMEWORK_OPTIONS: Opt[] = [
    { label: 'PESTLE', description: 'Political, Economic, Social, Technological, Legal, Environmental' },
    { label: "Porter's Five Forces", description: 'Competitive rivalry, suppliers, buyers, entrants, substitutes' },
    { label: 'DEEPLIST', description: 'Demographic, Economic, Environmental, Political, Legal, Info-tech, Social, Trend' },
    { label: 'McKinsey 7-S Model', description: 'Strategy, Structure, Systems, Shared values, Skills, Style, Staff' },
    { label: 'SWOT', description: 'Strengths, Weaknesses, Opportunities, Threats' },
    { label: 'SOAR', description: 'Strengths, Opportunities, Aspirations, Results' },
];

const LENGTH_OPTIONS: Opt[] = [
    { label: 'Short', description: '~150-250 words, one paragraph' },
    { label: 'Executive', description: '~1 page, structured brief' },
    { label: 'Long', description: '3-6 pages, full report' },
    { label: 'Custom', description: 'Set your own word count' },
];

const PROVIDER_OPTIONS: Opt[] = [
    { label: 'Qwen (local)' },
    { label: 'Claude' },
    { label: 'OpenAI' },
];

const RESEARCH_TYPE_OPTIONS: Opt[] = [
    { label: 'Country' }, { label: 'Trade' }, { label: 'Government Official / Minister' },
    { label: 'Business / Company' }, { label: 'Individual / Person' }, { label: 'Social Media Post' }, { label: 'Other' },
];

const SCHEDULE_FREQUENCY_OPTIONS: Opt[] = [
    { label: 'Daily' }, { label: 'Weekly' }, { label: 'Monthly' }, { label: 'Quarterly' },
];

const DAY_OF_WEEK_OPTIONS: Opt[] = [
    { label: 'Monday' }, { label: 'Tuesday' }, { label: 'Wednesday' }, { label: 'Thursday' },
    { label: 'Friday' }, { label: 'Saturday' }, { label: 'Sunday' },
];

const MONTH_OPTIONS: Opt[] = [
    { label: 'January' }, { label: 'February' }, { label: 'March' }, { label: 'April' },
    { label: 'May' }, { label: 'June' }, { label: 'July' }, { label: 'August' },
    { label: 'September' }, { label: 'October' }, { label: 'November' }, { label: 'December' },
];

const DAY_OF_MONTH_OPTIONS: Opt[] = Array.from({ length: 28 }, (_, i) => ({ label: String(i + 1) }));

const TASK_PRIORITY_OPTIONS: Opt[] = [{ label: 'Low' }, { label: 'Medium' }, { label: 'High' }, { label: 'Urgent' }];
const TASK_IMPORTANCE_OPTIONS: Opt[] = [{ label: 'Low' }, { label: 'Medium' }, { label: 'High' }];

const SCHEDULE_NOTIFY_OPTIONS: Opt[] = [
    { label: 'Always send', description: 'Email the refreshed report every run' },
    { label: 'Only if changed', description: "Email only when the content actually differs from last time" },
];

const EXPORT_FORMAT_OPTIONS = [
    { value: 'Word (.docx)', label: 'Word (.docx)' },
    { value: 'PDF', label: 'PDF' },
    { value: 'PowerPoint (.pptx)', label: 'PowerPoint (.pptx)' },
];

/** Reports at or above this length default to section-by-section reading. */
const SECTION_MODE_WORD_THRESHOLD = 350;

interface ResponseTelemetry {
    response_time_ms: number | null;
    total_tokens: number | null;
    confidence_score: number | null;
    quality_score: number | null;
}

interface BriefSection {
    title: string;
    html: string;
    isFrameworkSection: boolean;
}

interface BriefTurn {
    id: string;
    kind: 'brief' | 'chitchat';
    instruction: string;
    title: string;
    markdown: string;
    html: string;
    sessionId: string;
    framework: string;
    provider: string;
    sourceSelection: string;
    topic: string;
    answers: { question: string; answer: string }[];
    sources: SourceHit[];
    createdAt: Date;
}

const TEMPLATE_THEMES: Record<string, { accent: string; dark: string; tint: string }> = {
    'Auto (agent picks)': { accent: '#92722A', dark: '#6C4527', tint: '#F9F7ED' },
    'UAE Color Theme': { accent: '#92722A', dark: '#6C4527', tint: '#F9F7ED' },
    'Editorial Navy': { accent: '#2F4A70', dark: '#1B2A42', tint: '#EEF1F6' },
    'Corporate Minimal': { accent: '#565D68', dark: '#282C33', tint: '#F1F2F3' },
    'Modern Teal': { accent: '#177070', dark: '#0D4141', tint: '#EAF6F6' },
    MoFA: { accent: '#AC833B', dark: '#5F5F5F', tint: '#F7F3EB' },
};

const FRAMEWORK_DIMENSIONS: Record<string, string[]> = {
    PESTLE: ['political', 'economic', 'social', 'technological', 'legal', 'environmental'],
    "Porter's Five Forces": [
        'competitive rivalry', 'rivalry among', 'supplier power', 'bargaining power of suppliers',
        'buyer power', 'bargaining power of buyers', 'threat of new entrants', 'threat of substitutes',
    ],
    DEEPLIST: [
        'demographic', 'economic', 'environmental', 'political', 'legal',
        'info-tech', 'information technology', 'social', 'trend',
    ],
    'McKinsey 7-S Model': ['strategy', 'structure', 'systems', 'shared values', 'skills', 'style', 'staff'],
    SWOT: ['strengths', 'weaknesses', 'opportunities', 'threats'],
    SOAR: ['strengths', 'opportunities', 'aspirations', 'results'],
};

function isFrameworkDimension(title: string, framework: string): boolean {
    const dimensions = FRAMEWORK_DIMENSIONS[framework];
    if (!dimensions) return false;
    const normalized = title.toLowerCase();
    return dimensions.some(d => normalized.includes(d));
}

function splitIntoSections(markdown: string, framework: string): BriefSection[] {
    const lines = markdown.split('\n');
    const sections: { title: string; body: string[] }[] = [];
    const intro: string[] = [];
    let current: { title: string; body: string[] } | null = null;

    for (const line of lines) {
        const h2Match = /^##\s+(.*)/.exec(line);
        const h1Match = /^#\s+(.*)/.exec(line);
        if (h2Match) {
            if (current) sections.push(current);
            current = { title: h2Match[1].trim(), body: [] };
        } else if (h1Match) {
            continue;
        } else if (current) {
            current.body.push(line);
        } else {
            intro.push(line);
        }
    }
    if (current) sections.push(current);

    const introText = intro.join('\n').trim();
    const result: BriefSection[] = [];
    if (introText) {
        result.push({ title: 'Overview', html: marked.parse(introText) as string, isFrameworkSection: false });
    }
    for (const s of sections) {
        result.push({
            title: s.title,
            html: marked.parse(s.body.join('\n')) as string,
            isFrameworkSection: isFrameworkDimension(s.title, framework),
        });
    }
    return result;
}

@Component({
    selector: 'lib-insights',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TranslateModule,
        ButtonModule, CheckboxModule, InputTextModule, PopoverModule, RatingModule, SelectModule, TooltipModule,
        CountryDashboardComponent, HistoryPanelComponent, ExportPanelComponent, AdminSettingsDrawerComponent,
        AgentOptionsPanelComponent, ProfileSettingsComponent,
        ShareTaskDrawerComponent, ScheduleDrawerComponent, SaveProfileDrawerComponent,
    ],
    templateUrl: './insights.html',
})
export class InsightsPage implements OnInit {
    private readonly api = inject(ExecSummaryApiService);
    private readonly common = inject(CommonService);
    private readonly translate = inject(TranslateService);
    private readonly auth = inject(AuthService);

    // The history panel loads its own "My Research"/"Chat History" lists
    // once in its own ngOnInit and never refetches on its own — it's kept
    // permanently in the DOM (just visually collapsed/expanded), so saving
    // a report here left its list stale until a full page reload. Calling
    // its public refresh() right after a successful save (see confirmSave
    // below) keeps it in sync without needing to reload the page.
    @ViewChild('historyPanel') historyPanel?: HistoryPanelComponent;

    readonly templateOptions = [...TEMPLATE_OPTIONS, { label: 'MoFA', description: 'UAE Ministry of Foreign Affairs' }];
    frameworkOptions = [...FRAMEWORK_OPTIONS];
    readonly lengthOptions = LENGTH_OPTIONS;
    readonly providerOptions = PROVIDER_OPTIONS;
    readonly researchTypeOptions = RESEARCH_TYPE_OPTIONS;
    readonly scheduleFrequencyOptions = SCHEDULE_FREQUENCY_OPTIONS;
    readonly scheduleNotifyOptions = SCHEDULE_NOTIFY_OPTIONS;
    readonly dayOfWeekOptions = DAY_OF_WEEK_OPTIONS;
    readonly monthOptions = MONTH_OPTIONS;
    readonly dayOfMonthOptions = DAY_OF_MONTH_OPTIONS;
    readonly taskPriorityOptions = TASK_PRIORITY_OPTIONS;
    readonly taskImportanceOptions = TASK_IMPORTANCE_OPTIONS;
    exportFormatOptions = EXPORT_FORMAT_OPTIONS;

    readonly exportOutputOptions: { value: 'Word (.docx)' | 'PDF' | 'PowerPoint (.pptx)'; label: string; icon: string }[] = [
        { value: 'Word (.docx)', label: 'Word', icon: 'pi-file-word' },
        { value: 'PDF', label: 'PDF', icon: 'pi-file-pdf' },
        { value: 'PowerPoint (.pptx)', label: 'Slides', icon: 'pi-desktop' },
    ];

    get userName(): string {
        return this.auth.user()?.displayName || '';
    }

    get userId(): string {
        return this.auth.user()?.id?.trim() || '';
    }

    /**
     * The exec-agent admin router answers 401/403 for everyone else, so non-admins must not
     * call it at all — an unauthorized probe on page load surfaces as a spurious backend error.
     */
    get isAdmin(): boolean {
        return this.auth.isAdmin();
    }

    get backendUserId(): string {
        return this.userId || 'anonymous';
    }

    get exportCreatedBy(): string {
        return this.preparedBy.trim() || this.userName || this.userId;
    }

    stage: Stage = 'idle';
    errorMessage = '';
    moderationBlocked = false;
    quotaExceeded = false;

    historyCollapsed = false;
    exportPanelOpen = false;
    adminSettingsOpen = false;
    optionsOpen = false;
    profileOpen = false;

    // step 1
    topic = '';
    private _template = TEMPLATE_OPTIONS[0].label;
    get template(): string { return this._template; }
    set template(value: string) {
        this._template = value;
        this.applyTemplateTheme(value);
    }
    framework = FRAMEWORK_OPTIONS[0].label;
    composerMode: 'topic' | 'document' = 'topic';
    source = 'Web search';
    expertiseLevel: ExpertiseLevel = 'expert';

    // step 2
    sessionId = '';
    categoryGuess = '';
    questions: ClarifyingQuestion[] = [];
    answers: Record<string, string> = {};
    otherMode: Record<string, boolean> = {};
    suggestedFramework = '';
    frameworkReason = '';
    frameworkApplied = false;
    showPersonnelCheckbox = false;
    showCountryDashboardCheckbox = false;

    // step 3
    length = 'Executive';
    customWordCount: number | null = null;
    audience = '';
    provider = 'Qwen (local)';
    personnelProfile = false;
    countryDashboard = false;
    mcpServers: McpServerEntry[] = [];
    mcpConnectionId: string | null = null;

    // step 4 — result
    briefTitle = '';
    briefMarkdown = '';
    briefSources: SourceHit[] = [];
    wordCount = 0;
    dashboardData: CountryDashboardData | null = null;
    telemetry: ResponseTelemetry | null = null;

    sections: BriefSection[] = [];
    readMode: 'full' | 'sections' = 'full';
    currentSectionIndex = 0;

    saveStage: SaveStage = 'prompt';
    saveProfileForm: SaveProfileFormModel = this.defaultSaveProfileForm();

    exportFormat: 'Word (.docx)' | 'PDF' | 'PowerPoint (.pptx)' = 'Word (.docx)';
    whatsappLink = '';
    actionStage: ActionStage = 'prompt';
    shareTaskForm: ShareTaskFormModel = this.defaultShareTaskForm();

    feedbackRating = 0;
    feedbackComment = '';
    feedbackSubmitted = false;
    feedbackError = '';

    scheduleStage: ScheduleStage = 'prompt';
    scheduleForm: ScheduleFormModel = this.defaultScheduleForm();
    scheduledEntry: ScheduledJobEntry | null = null;

    translationState: 'idle' | 'loading' | 'done' | 'error' = 'idle';
    translatedTitle = '';
    translatedHtml = '';
    translatedMarkdownFull = '';
    translationError = '';
    translatedExportPrompted = false;
    translatedExportAccepted = false;
    translatedExportFormat: 'Word (.docx)' | 'PDF' | 'PowerPoint (.pptx)' = 'Word (.docx)';
    translatedExportBusy = false;

    exporting = false;
    downloadingRecentId: string | null = null;
    recentDownloadError = '';

    historyEntries: HistoryEntry[] = [];
    viewingHistoryIndex: number | null = null;
    historyLoadError = '';

    refineInstruction = '';
    refining = false;
    refineError = '';
    resultComposerMode: 'refine' | 'new' = 'refine';
    activeTopic = '';
    pendingUserMessage: string | null = null;
    conversationId = this.newId();
    turns: BriefTurn[] = [];
    sourcesOpenTurnId: string | null = null;
    readingAloudTurnId: string | null = null;
    forkingTurnId: string | null = null;
    expandedTurnId: string | null = null;
    generationMode: 'Local' | 'Gamma AI' | 'Presenton' | 'PptGenX' = 'Local';
    readonly generationOptions = ['Local', 'Gamma AI', 'Presenton', 'PptGenX'];
    preparedBy = '';

    async ngOnInit(): Promise<void> {
        this.preparedBy = this.userName;
        this.applyTemplateTheme(this.template);
        if (this.auth.isLoggedIn()) {
            try {
                this.onServersChange(await this.api.listMcpServers());
            } catch {
                // MCP is optional and must not prevent the main research flow.
            }
        }
        if (this.userId) {
            try {
                this.expertiseLevel = (await this.api.getUserProfile(this.userId)).expertise_level;
            } catch {
                // Keep expert defaults when no profile has been saved.
            }
        }
        if (this.isAdmin) await this.applyAdminSettings();
        try {
            this.historyEntries = (await this.api.listHistory()).items;
        } catch (err) {
            this.historyEntries = [];
            this.historyLoadError = this.describeError(err);
        }
    }

    /** Narrows the composer's options to what the admin settings allow. Admin-only endpoint. */
    private async applyAdminSettings(): Promise<void> {
        try {
            const settings = await this.api.getAdminSettings();
            if (settings.enabled_frameworks?.length) {
                const enabled = new Set(settings.enabled_frameworks);
                const filtered = FRAMEWORK_OPTIONS.filter(f => enabled.has(f.label));
                this.frameworkOptions = filtered.length ? filtered : [...FRAMEWORK_OPTIONS];
                if (!this.frameworkOptions.some(f => f.label === this.framework)) {
                    this.framework = this.frameworkOptions[0].label;
                }
            }
            if (settings.allowed_file_types?.length) {
                const allowed = new Set(settings.allowed_file_types);
                const fileTypeToFormat: Record<string, 'Word (.docx)' | 'PDF' | 'PowerPoint (.pptx)'> = {
                    docx: 'Word (.docx)', pdf: 'PDF', pptx: 'PowerPoint (.pptx)',
                };
                const filtered = Object.entries(fileTypeToFormat)
                    .filter(([fileType]) => allowed.has(fileType))
                    .map(([, value]) => ({ value, label: value }));
                if (filtered.length) {
                    this.exportFormatOptions = filtered;
                    if (!filtered.some(f => f.value === this.exportFormat)) {
                        this.exportFormat = filtered[0].value as 'Word (.docx)' | 'PDF' | 'PowerPoint (.pptx)';
                    }
                }
            }
        } catch {
            // Settings fetch failing shouldn't block the rest of the app.
        }
    }

    get currentTurn(): BriefTurn | null {
        return this.turns.length ? this.turns[this.turns.length - 1] : null;
    }

    get historyTurns(): BriefTurn[] {
        return this.stage === 'result' ? this.turns.slice(0, -1) : this.turns;
    }

    get showingRefineComposer(): boolean {
        return this.stage === 'result' && this.resultComposerMode === 'refine';
    }

    get mcpToolOptions(): { label: string; value: string | null }[] {
        return [
            { label: 'None', value: null },
            ...this.mcpServers
                .filter(server => server.connection_status === 'connected' && server.imported_tools.length)
                .map(server => ({ label: server.name, value: server.connection_id ?? null })),
        ];
    }

    async loadFromHistory(sessionId: string): Promise<void> {
        this.historyLoadError = '';
        try {
            const detail = await this.api.getHistoryDetail(sessionId);
            this.sessionId = detail.session_id;
            this.briefTitle = detail.title;
            this.briefMarkdown = detail.content_markdown;
            this.briefSources = [];
            this.wordCount = detail.word_count;
            this.dashboardData = detail.dashboard_data || null;
            this.framework = FRAMEWORK_OPTIONS.find(f => f.label === detail.framework)?.label || this.framework;
            this.sections = splitIntoSections(detail.content_markdown, this.framework);
            this.readMode = this.sections.length >= 2 && this.wordCount >= 350 ? 'sections' : 'full';
            this.currentSectionIndex = 0;
            this.viewingHistoryIndex = this.historyEntries.findIndex(h => h.session_id === sessionId);
            this.stage = 'result';
            this.saveStage = 'skipped';
            this.actionStage = 'prompt';
            this.scheduleStage = 'prompt';
            this.translationState = 'idle';
            this.feedbackSubmitted = false;
            this.feedbackRating = 0;
            this.turns = [this.turnFromHistory(detail)];
            this.activeTopic = detail.name;
            this.resultComposerMode = 'refine';
        } catch (err) {
            this.historyLoadError = this.describeError(err);
        }
    }

    async loadConversation(conversationId: string): Promise<void> {
        this.historyLoadError = '';
        try {
            const detail = await this.api.getConversation(conversationId);
            if (!detail.turns.length) return;
            this.conversationId = conversationId;
            this.turns = detail.turns.map(turn => ({
                id: this.newId(),
                kind: turn.kind,
                instruction: turn.instruction,
                title: turn.title,
                markdown: turn.content_markdown,
                html: marked.parse(turn.content_markdown || '') as string,
                sessionId: turn.session_id,
                framework: turn.framework,
                provider: turn.provider,
                sourceSelection: turn.source_selection ?? '',
                topic: turn.topic,
                answers: turn.answers,
                sources: turn.sources,
                createdAt: new Date(turn.created_at),
            }));
            const last = this.turns[this.turns.length - 1];
            if (!last) return;
            this.resetLoadedConversationState();
            this.sessionId = last.sessionId;
            this.activeTopic = last.topic;
            this.framework = last.framework || this.framework;
            this.provider = this.providerLabel(last.provider);
            this.source = last.sourceSelection || this.source;
            if (last.kind === 'brief') {
                this.applyBrief(last.title, last.markdown, last.sources);
                this.stage = 'result';
                this.resultComposerMode = 'refine';
            } else {
                this.stage = 'idle';
            }
        } catch (err) {
            this.historyLoadError = this.describeError(err);
        }
    }

    get hasPreviousResearch(): boolean {
        return this.viewingHistoryIndex !== null && this.viewingHistoryIndex < this.historyEntries.length - 1;
    }
    get hasNextResearch(): boolean {
        return this.viewingHistoryIndex !== null && this.viewingHistoryIndex > 0;
    }
    goToPreviousResearch(): void {
        if (!this.hasPreviousResearch || this.viewingHistoryIndex === null) return;
        this.loadFromHistory(this.historyEntries[this.viewingHistoryIndex + 1].session_id);
    }
    goToNextResearch(): void {
        if (!this.hasNextResearch || this.viewingHistoryIndex === null) return;
        this.loadFromHistory(this.historyEntries[this.viewingHistoryIndex - 1].session_id);
    }

    useQuickAction(kind: 'summarise' | 'board-ready'): void {
        this.composerMode = kind === 'summarise' ? 'document' : 'topic';
        this.topic = '';
    }

    onComposerEnter(ev: Event): void {
        const keyEv = ev as KeyboardEvent;
        if (keyEv.shiftKey) return;
        ev.preventDefault();
        if (this.showingRefineComposer) {
            if (!this.refineInstruction.trim() || this.refining) return;
            this.refineBrief();
            return;
        }
        if (!this.topic.trim() || this.stage === 'loading') return;
        this.startResearch();
    }

    async refineBrief(): Promise<void> {
        if (!this.refineInstruction.trim()) return;
        const instruction = this.refineInstruction.trim();
        this.refining = true;
        this.errorMessage = '';
        this.refineError = '';
        this.moderationBlocked = false;
        this.quotaExceeded = false;
        this.pendingUserMessage = instruction;
        this.refineInstruction = '';
        try {
            const res = await this.api.refine(this.sessionId, instruction);
            this.refining = false;
            this.pendingUserMessage = null;
            this.applyBrief(res.title, res.content_markdown, this.briefSources);
            this.pushBriefTurn(instruction, res.title, res.content_markdown, this.sessionId, this.briefSources);
            this.translationState = 'idle';
            this.translatedTitle = '';
            this.translatedHtml = '';
            this.translatedMarkdownFull = '';
        } catch (err) {
            this.refining = false;
            this.refineError = this.describeError(err);
            this.errorMessage = this.refineError;
            this.moderationBlocked = this.isModerationBlock(err);
            this.quotaExceeded = this.isQuotaExceeded(err);
            this.refineInstruction = instruction;
            this.pendingUserMessage = null;
        }
    }

    async startResearch(): Promise<void> {
        if (!this.topic.trim()) return;
        const submittedTopic = this.topic.trim();
        this.activeTopic = submittedTopic;
        this.pendingUserMessage = submittedTopic;
        this.topic = '';
        this.errorMessage = '';
        this.moderationBlocked = false;
        this.quotaExceeded = false;
        this.stage = 'loading';
        try {
            const res = await this.api.startSession(submittedTopic, this.providerKey(this.provider), this.backendUserId);
            if (res.intent === 'chit_chat') {
                this.sessionId = res.session_id;
                const turn = this.makeTurn('chitchat', submittedTopic, '', res.reply ?? '', res.session_id, []);
                this.turns.push(turn);
                await this.persistTurn(turn);
                this.pendingUserMessage = null;
                this.stage = 'idle';
                return;
            }
            this.sessionId = res.session_id;
            this.categoryGuess = res.category_guess || '';
            this.questions = res.clarifying_questions;
            this.answers = {};
            this.otherMode = {};
            this.suggestedFramework = res.suggested_framework;
            this.frameworkReason = res.framework_reason;
            this.frameworkApplied = false;
            this.showPersonnelCheckbox = res.involves_specific_person;
            this.showCountryDashboardCheckbox = res.involves_country_relations;
            this.personnelProfile = res.involves_specific_person && this.personnelProfile;
            this.countryDashboard = res.involves_country_relations && this.countryDashboard;
            if (this.expertiseLevel === 'beginner') {
                this.useSuggestedFramework();
                await this.api.submitAnswers(this.sessionId, {});
                await this.generateBrief('idle');
            } else {
                this.stage = 'clarifying';
            }
        } catch (err) {
            this.moderationBlocked = this.isModerationBlock(err);
            this.quotaExceeded = this.isQuotaExceeded(err);
            this.errorMessage = this.describeError(err);
            this.stage = 'idle';
            this.topic = submittedTopic;
            this.pendingUserMessage = null;
        }
    }

    async continueToParams(): Promise<void> {
        try {
            await this.api.submitAnswers(this.sessionId, this.answers);
            if (this.expertiseLevel === 'intermediate') {
                this.useSuggestedFramework();
                await this.generateBrief('idle');
            } else {
                this.stage = 'params';
            }
        } catch (err) {
            this.errorMessage = this.describeError(err);
        }
    }

    chooseSuggestion(questionId: string, value: string): void {
        this.otherMode[questionId] = false;
        this.answers[questionId] = value;
    }
    chooseOthers(questionId: string): void {
        this.otherMode[questionId] = true;
        this.answers[questionId] = '';
    }
    useSuggestedFramework(): void {
        this.framework = this.suggestedFramework;
        this.frameworkApplied = true;
    }

    setReadMode(mode: 'full' | 'sections'): void {
        this.readMode = mode;
        if (mode === 'sections') this.currentSectionIndex = 0;
    }
    nextSection(): void {
        if (this.currentSectionIndex < this.sections.length - 1) this.currentSectionIndex++;
    }
    prevSection(): void {
        if (this.currentSectionIndex > 0) this.currentSectionIndex--;
    }
    goToSection(i: number): void {
        this.currentSectionIndex = i;
    }

    @HostListener('document:keydown', ['$event'])
    onDocumentKeydown(ev: KeyboardEvent): void {
        if (this.stage !== 'result') return;
        if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
        if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.shiftKey) return;

        const activeTag = (document.activeElement?.tagName || '').toLowerCase();
        if (activeTag === 'textarea' || activeTag === 'input' || activeTag === 'select') return;
        if ((document.activeElement as HTMLElement | null)?.isContentEditable) return;

        if (this.readMode === 'sections' && this.sections.length > 1) {
            ev.preventDefault();
            if (ev.key === 'ArrowLeft') this.prevSection(); else this.nextSection();
            return;
        }
        if (this.readMode === 'full' && this.viewingHistoryIndex !== null) {
            ev.preventDefault();
            if (ev.key === 'ArrowLeft') this.goToPreviousResearch(); else this.goToNextResearch();
        }
    }

    async generateBrief(errorStage: Stage = 'params'): Promise<void> {
        this.stage = 'loading';
        this.errorMessage = '';
        this.moderationBlocked = false;
        this.quotaExceeded = false;
        try {
            const res = await this.api.generate(this.sessionId, {
                length: this.lengthKey(this.length),
                custom_word_count: this.length === 'Custom' ? this.customWordCount : null,
                framework: this.framework as Framework,
                audience: this.audience || null,
                output_format: 'html',
                provider: this.providerKey(this.provider),
                personnel_profile: this.personnelProfile,
                country_dashboard: this.countryDashboard,
                source: this.source,
                mcp_connection_id: this.mcpConnectionId,
                user_id: this.backendUserId,
            });
            this.applyBrief(res.title, res.content_markdown, res.sources ?? []);
            this.wordCount = res.word_count;
            this.dashboardData = res.dashboard_data || null;
            this.telemetry = {
                response_time_ms: res.response_time_ms ?? null,
                total_tokens: res.total_tokens ?? null,
                confidence_score: res.confidence_score ?? null,
                quality_score: res.quality_score ?? null,
            };
            this.sections = splitIntoSections(res.content_markdown, this.framework);
            this.currentSectionIndex = 0;
            this.readMode = this.sections.length > 1 && this.wordCount >= SECTION_MODE_WORD_THRESHOLD ? 'sections' : 'full';
            this.saveStage = 'prompt';
            this.saveProfileForm = { ...this.defaultSaveProfileForm(), name: res.title };
            this.actionStage = 'prompt';
            this.whatsappLink = '';
            this.shareTaskForm = this.defaultShareTaskForm();
            this.feedbackRating = 0;
            this.feedbackComment = '';
            this.feedbackSubmitted = false;
            this.feedbackError = '';
            this.scheduleStage = 'prompt';
            this.scheduleForm = this.defaultScheduleForm();
            this.scheduledEntry = null;
            this.translationState = 'idle';
            this.translatedTitle = '';
            this.translatedHtml = '';
            this.translatedMarkdownFull = '';
            this.translationError = '';
            this.translatedExportPrompted = false;
            this.translatedExportAccepted = false;
            this.translatedExportFormat = 'Word (.docx)';
            this.viewingHistoryIndex = null;
            this.historyLoadError = '';
            this.exporting = false;
            this.stage = 'result';
            this.resultComposerMode = 'refine';
            this.pendingUserMessage = null;
            this.pushBriefTurn(this.activeTopic, res.title, res.content_markdown, this.sessionId, res.sources ?? []);
        } catch (err) {
            this.moderationBlocked = this.isModerationBlock(err);
            this.quotaExceeded = this.isQuotaExceeded(err);
            this.errorMessage = this.describeError(err);
            this.stage = errorStage;
            this.pendingUserMessage = null;
        }
    }

    async runExport(format: 'Word (.docx)' | 'PDF' | 'PowerPoint (.pptx)' = this.exportFormat): Promise<void> {
        this.exporting = true;
        const fmt = this.exportFormatKey(format);
        try {
            const res = await this.api.export(
                this.sessionId,
                fmt,
                this.template,
                this.briefMarkdown,
                this.briefTitle,
                this.exportCreatedBy,
                this.briefSources,
                this.exportEngineKey(),
                undefined,
                this.dashboardData,
            );
            this.exporting = false;
            window.open(this.api.downloadUrl(res.file_name), '_blank');
        } catch (err) {
            this.exporting = false;
            this.common.showApiError(err);
        }
    }

    chooseShare(): void { this.actionStage = 'share'; }
    chooseTask(): void { this.actionStage = 'task'; }
    onShareTaskStageChange(stage: ShareTaskStage): void { this.actionStage = stage; }
    backToActionPrompt(): void { this.actionStage = 'prompt'; }

    async sendEmail(): Promise<void> {
        if (!this.shareTaskForm.emailTarget.trim()) return;
        try {
            const res = await this.api.shareEmail(this.sessionId, this.shareTaskForm.emailTarget);
            this.common.showSuccessMessage(res.result);
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async getWhatsappLink(): Promise<void> {
        if (!this.shareTaskForm.whatsappTarget.trim()) return;
        try {
            const res = await this.api.shareWhatsapp(this.sessionId, this.shareTaskForm.whatsappTarget);
            this.whatsappLink = res.link ?? '';
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async createTask(): Promise<void> {
        const assignees = this.shareTaskForm.taskAssigneesInput.split(',').map(a => a.trim()).filter(Boolean);
        if (!assignees.length) return;
        try {
            const task = await this.api.createTask(
                this.sessionId, `Review: ${this.briefTitle}`, assignees, undefined,
                this.shareTaskForm.taskDueDate || undefined, this.shareTaskForm.taskPriority, this.shareTaskForm.taskImportance, this.backendUserId,
            );
            this.common.showSuccessMessage(this.translate.instant('executiveSummary.insights.taskCreated', { id: task.id, assignees: task.assignees.join(', ') }));
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async submitFeedback(): Promise<void> {
        if (!this.feedbackRating) return;
        this.feedbackError = '';
        try {
            await this.api.submitFeedback(this.sessionId, { rating: this.feedbackRating, comment: this.feedbackComment.trim() || null });
            this.feedbackSubmitted = true;
        } catch (err) {
            this.feedbackError = this.describeError(err);
        }
    }

    openScheduleForm(): void { this.scheduleStage = 'form'; }
    cancelScheduleForm(): void { this.scheduleStage = 'prompt'; }

    async confirmSchedule(): Promise<void> {
        const form = this.scheduleForm;
        if (!form.email.trim() || !/^\d{2}:\d{2}$/.test(form.time)) return;
        const freqKey = form.frequency.toLowerCase() as ScheduleJobRequest['frequency'];
        const notifyKey: ScheduleJobRequest['notify_mode'] = form.notifyMode === 'Always send' ? 'always' : 'on_change';

        const payload: ScheduleJobRequest = {
            frequency: freqKey, time_of_day: form.time, recipient_email: form.email.trim(), notify_mode: notifyKey,
        };
        if (freqKey === 'weekly') {
            payload.day_of_week = this.dayOfWeekOptions.findIndex(o => o.label === form.dayOfWeek);
        } else if (freqKey === 'monthly') {
            payload.day_of_month = Number(form.dayOfMonth);
        } else if (freqKey === 'quarterly') {
            payload.day_of_month = Number(form.dayOfMonth);
            payload.quarterly_start_month = this.monthOptions.findIndex(o => o.label === form.quarterlyMonth) + 1;
        }

        try {
            this.scheduledEntry = await this.api.createSchedule(this.sessionId, payload);
            this.scheduleStage = 'saved';
            this.common.showSuccessMessage(this.translate.instant('executiveSummary.insights.scheduledSummary', {
                frequency: form.frequency.toLowerCase(), time: form.time, email: this.scheduledEntry.recipient_email,
            }));
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async translateToArabic(): Promise<void> {
        this.translationState = 'loading';
        this.translationError = '';
        try {
            const res = await this.api.translate(this.sessionId, 'ar');
            const markdown = res.content_markdown.trim();
            const titleMatch = /^#\s*(.+)/.exec(markdown);
            this.translatedTitle = titleMatch ? titleMatch[1].trim() : this.briefTitle;
            const bodyMarkdown = titleMatch ? markdown.slice(titleMatch[0].length).trim() : markdown;
            this.translatedHtml = marked.parse(bodyMarkdown) as string;
            this.translatedMarkdownFull = markdown;
            this.translationState = 'done';
            this.translatedExportPrompted = false;
            this.translatedExportAccepted = false;
            this.translatedExportFormat = 'Word (.docx)';
        } catch (err) {
            this.translationError = this.describeError(err);
            this.translationState = 'error';
        }
    }

    respondToTranslatedExportPrompt(wantsExport: boolean): void {
        this.translatedExportPrompted = true;
        this.translatedExportAccepted = wantsExport;
    }

    async exportTranslatedCopy(): Promise<void> {
        const fmt = this.exportFormatKey(this.translatedExportFormat);
        this.translatedExportBusy = true;
        try {
            const res = await this.api.export(
                this.sessionId,
                fmt,
                this.template,
                this.translatedMarkdownFull,
                this.translatedTitle,
                this.exportCreatedBy,
                this.briefSources,
                this.exportEngineKey(),
                undefined,
                this.dashboardData,
            );
            this.translatedExportBusy = false;
            window.open(this.api.downloadUrl(res.file_name), '_blank');
        } catch (err) {
            this.translatedExportBusy = false;
            this.translationError = this.describeError(err);
        }
    }

    async exportRecentReport(sessionId: string): Promise<void> {
        this.recentDownloadError = '';
        this.downloadingRecentId = sessionId;
        try {
            const detail = await this.api.getHistoryDetail(sessionId);
            const fmt = this.exportFormatKey(this.exportFormat);
            const res = await this.api.export(
                sessionId,
                fmt,
                this.template,
                detail.content_markdown,
                detail.title,
                this.exportCreatedBy,
                [],
                this.exportEngineKey(),
                undefined,
                detail.dashboard_data,
            );
            this.downloadingRecentId = null;
            window.open(this.api.downloadUrl(res.file_name), '_blank');
        } catch (err) {
            this.downloadingRecentId = null;
            this.recentDownloadError = this.describeError(err);
        }
    }

    get recentReports(): RecentReport[] {
        return this.historyEntries.slice(0, 5).map(h => ({
            session_id: h.session_id, name: h.name, framework: h.framework, word_count: h.word_count,
        }));
    }

    openSaveForm(): void { this.saveStage = 'form'; }
    cancelSaveForm(): void { this.saveStage = 'prompt'; }

    async confirmSave(): Promise<void> {
        const form = this.saveProfileForm;
        if (!form.name.trim()) return;
        try {
            await this.api.saveReport(this.sessionId, {
                name: form.name.trim(),
                description: form.description.trim() || null,
                research_type: form.researchType as ResearchType,
                visibility: form.visibility === 'Shared' ? 'shared' : 'private',
            });
            this.saveStage = 'saved';
            this.historyEntries = (await this.api.listHistory()).items;
            void this.historyPanel?.refresh();
            this.common.showSuccessMessage(this.translate.instant('executiveSummary.insights.savedAs', { visibility: form.visibility.toLowerCase() }));
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    switchResultComposerMode(mode: 'refine' | 'new'): void {
        this.resultComposerMode = mode;
        if (mode === 'refine') this.topic = '';
        else this.refineInstruction = '';
        this.errorMessage = '';
        this.refineError = '';
    }

    toggleSources(turnId: string): void {
        this.sourcesOpenTurnId = this.sourcesOpenTurnId === turnId ? null : turnId;
    }

    toggleTurn(turnId: string): void {
        this.expandedTurnId = this.expandedTurnId === turnId ? null : turnId;
    }

    isGroundingSource(source: string): boolean {
        return source === 'Web search' || source === 'Specific URL(s)';
    }

    async forkFromTurn(turn: BriefTurn): Promise<void> {
        if (turn.kind !== 'brief' || this.forkingTurnId) return;
        this.forkingTurnId = turn.id;
        try {
            const response = await this.api.fork(turn.sessionId, turn.markdown, turn.title);
            this.sessionId = response.session_id;
            this.activeTopic = turn.topic;
            this.framework = turn.framework || this.framework;
            this.provider = this.providerLabel(turn.provider);
            this.source = turn.sourceSelection || this.source;
            this.applyBrief(response.title, response.content_markdown, turn.sources);
            this.conversationId = this.newId();
            const forked = this.makeTurn(
                'brief', turn.instruction, response.title, response.content_markdown, response.session_id, turn.sources,
            );
            this.turns = [forked];
            await this.persistTurn(forked);
            this.stage = 'result';
            this.resultComposerMode = 'refine';
        } catch (err) {
            this.errorMessage = this.describeError(err);
        } finally {
            this.forkingTurnId = null;
        }
    }

    toggleReadAloud(turn: BriefTurn): void {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
        if (this.readingAloudTurnId === turn.id) {
            window.speechSynthesis.cancel();
            this.readingAloudTurnId = null;
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(
            turn.markdown.replace(/^#{1,6}\s+/gm, '').replace(/[*_`>]/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1'),
        );
        utterance.onend = () => this.readingAloudTurnId = null;
        utterance.onerror = () => this.readingAloudTurnId = null;
        this.readingAloudTurnId = turn.id;
        window.speechSynthesis.speak(utterance);
    }

    onServersChange(servers: McpServerEntry[]): void {
        this.mcpServers = servers;
        if (this.mcpConnectionId && !servers.some(server => server.connection_id === this.mcpConnectionId)) {
            this.mcpConnectionId = null;
        }
    }

    startOver(): void {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
        this.turns = [];
        this.conversationId = this.newId();
        this.activeTopic = '';
        this.pendingUserMessage = null;
        this.sourcesOpenTurnId = null;
        this.readingAloudTurnId = null;
        this.expandedTurnId = null;
        this.stage = 'idle';
        this.topic = '';
        this.composerMode = 'topic';
        this.errorMessage = '';
        this.moderationBlocked = false;
        this.quotaExceeded = false;
        this.viewingHistoryIndex = null;
        this.historyLoadError = '';
        this.questions = [];
        this.answers = {};
        this.personnelProfile = false;
        this.countryDashboard = false;
        this.showPersonnelCheckbox = false;
        this.showCountryDashboardCheckbox = false;
        this.dashboardData = null;
        this.telemetry = null;
        this.briefMarkdown = '';
        this.shareTaskForm = this.defaultShareTaskForm();
        this.whatsappLink = '';
        this.saveStage = 'prompt';
        this.saveProfileForm = this.defaultSaveProfileForm();
        this.actionStage = 'prompt';
        this.feedbackRating = 0;
        this.feedbackComment = '';
        this.feedbackSubmitted = false;
        this.feedbackError = '';
        this.suggestedFramework = '';
        this.frameworkReason = '';
        this.frameworkApplied = false;
        this.sections = [];
        this.readMode = 'full';
        this.currentSectionIndex = 0;
        this.scheduleStage = 'prompt';
        this.scheduleForm = this.defaultScheduleForm();
        this.scheduledEntry = null;
        this.translationState = 'idle';
        this.translatedTitle = '';
        this.translatedHtml = '';
        this.translatedMarkdownFull = '';
        this.translationError = '';
        this.translatedExportPrompted = false;
        this.translatedExportAccepted = false;
        this.translatedExportFormat = 'Word (.docx)';
        this.resultComposerMode = 'refine';
    }

    private applyBrief(title: string, markdown: string, sources: SourceHit[]): void {
        this.briefTitle = title;
        this.briefMarkdown = markdown;
        this.briefSources = sources;
        this.wordCount = markdown.trim().split(/\s+/).filter(Boolean).length;
        this.sections = splitIntoSections(markdown, this.framework);
        this.currentSectionIndex = 0;
        this.readMode = this.sections.length > 1 && this.wordCount >= SECTION_MODE_WORD_THRESHOLD ? 'sections' : 'full';
    }

    private resetLoadedConversationState(): void {
        this.saveStage = 'prompt';
        this.actionStage = 'prompt';
        this.scheduleStage = 'prompt';
        this.translationState = 'idle';
        this.feedbackSubmitted = false;
        this.feedbackRating = 0;
        this.viewingHistoryIndex = null;
        this.sourcesOpenTurnId = null;
        this.expandedTurnId = null;
        this.forkingTurnId = null;
        this.pendingUserMessage = null;
    }

    private applyTemplateTheme(value: string): void {
        if (typeof document === 'undefined') return;
        const theme = TEMPLATE_THEMES[value] ?? TEMPLATE_THEMES['Auto (agent picks)'];
        document.documentElement.style.setProperty('--exec-accent', theme.accent);
        document.documentElement.style.setProperty('--exec-accent-dark', theme.dark);
        document.documentElement.style.setProperty('--exec-accent-tint', theme.tint);
        document.documentElement.style.setProperty('--p-primary-500', theme.accent);
        document.documentElement.style.setProperty('--p-primary-600', theme.dark);
        document.documentElement.style.setProperty('--p-primary-50', theme.tint);
    }

    private pushBriefTurn(
        instruction: string,
        title: string,
        markdown: string,
        sessionId: string,
        sources: SourceHit[],
    ): void {
        const turn = this.makeTurn('brief', instruction, title, markdown, sessionId, sources);
        this.turns.push(turn);
        void this.persistTurn(turn);
    }

    private makeTurn(
        kind: 'brief' | 'chitchat',
        instruction: string,
        title: string,
        markdown: string,
        sessionId: string,
        sources: SourceHit[],
    ): BriefTurn {
        return {
            id: this.newId(), kind, instruction, title, markdown,
            html: marked.parse(markdown || '') as string,
            sessionId, framework: kind === 'brief' ? this.framework : '', provider: this.provider,
            sourceSelection: this.source, topic: this.activeTopic || instruction,
            answers: this.questions.filter(q => this.answers[q.id]).map(q => ({ question: q.question, answer: this.answers[q.id] })),
            sources, createdAt: new Date(),
        };
    }

    private turnFromHistory(detail: {
        session_id: string; name: string; title: string; content_markdown: string; framework: string;
        provider?: string | null; created_at: string;
    }): BriefTurn {
        return {
            id: this.newId(), kind: 'brief', instruction: detail.name, title: detail.title,
            markdown: detail.content_markdown, html: marked.parse(detail.content_markdown) as string,
            sessionId: detail.session_id, framework: detail.framework, provider: detail.provider ?? '',
            sourceSelection: '', topic: detail.name, answers: [], sources: [], createdAt: new Date(detail.created_at),
        };
    }

    private persistTurn(turn: BriefTurn): Promise<unknown> {
        return this.api.saveChatTurn({
            conversation_id: this.conversationId,
            turn_index: this.turns.indexOf(turn),
            session_id: turn.sessionId,
            kind: turn.kind,
            instruction: turn.instruction,
            topic: turn.topic,
            title: turn.title,
            content_markdown: turn.markdown,
            framework: turn.framework,
            provider: turn.provider,
            source_selection: turn.sourceSelection || null,
            sources: turn.sources,
            answers: turn.answers,
        }).catch(() => undefined);
    }

    private newId(): string {
        return typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    private defaultShareTaskForm(): ShareTaskFormModel {
        return { emailTarget: '', whatsappTarget: '', taskAssigneesInput: '', taskDueDate: '', taskPriority: 'Medium', taskImportance: 'Medium' };
    }

    private defaultScheduleForm(): ScheduleFormModel {
        return {
            frequency: 'Daily', time: '09:00', email: '', notifyMode: 'Always send',
            dayOfWeek: 'Monday', dayOfMonth: '1', quarterlyMonth: 'January',
        };
    }

    private defaultSaveProfileForm(): SaveProfileFormModel {
        return { name: '', description: '', researchType: RESEARCH_TYPE_OPTIONS[0].label, visibility: 'Private' };
    }

    private providerKey(label: string): Provider {
        if (label.startsWith('Claude')) return 'claude';
        if (label.startsWith('OpenAI')) return 'openai';
        return 'qwen';
    }

    private providerLabel(provider: string): string {
        if (provider === 'claude') return 'Claude';
        if (provider === 'openai') return 'OpenAI';
        if (provider === 'qwen') return 'Qwen (local)';
        return provider || this.provider;
    }

    private lengthKey(label: string): LengthPreset {
        return label.toLowerCase() as LengthPreset;
    }
    private exportFormatKey(label: string): OutputFormat {
        if (label.startsWith('Word')) return 'docx';
        if (label.startsWith('PDF')) return 'pdf';
        return 'pptx';
    }

    private exportEngineKey(): 'local' | 'gamma' | 'presenton' | 'pptgenx' {
        if (this.generationMode === 'Gamma AI') return 'gamma';
        if (this.generationMode === 'Presenton') return 'presenton';
        if (this.generationMode === 'PptGenX') return 'pptgenx';
        return 'local';
    }

    formatResponseTime(ms: number): string {
        return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
    }

    private describeError(err: unknown): string {
        const anyErr = err as { message?: string };
        return anyErr?.message ?? this.translate.instant('executiveSummary.insights.genericError');
    }

    private isModerationBlock(err: unknown): boolean {
        const anyErr = err as { status?: number };
        return anyErr?.status === 403;
    }

    private isQuotaExceeded(err: unknown): boolean {
        return (err as { status?: number })?.status === 429;
    }
}
