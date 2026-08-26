import { DocumentDetail, DocumentSummary, GrammarIssue } from '../models/grammar.models';

/**
 * Manual-testing fixtures only — never imported from the public `index.ts`.
 * The backend is offline while this module is being built; wire these into a
 * page temporarily (e.g. `this.doc = MOCK_DOCUMENT_DETAIL`) to eyeball the
 * UI, then remove the wiring before committing.
 */

const SAMPLE_TEXT =
    'The comittee have decided to postphone the meeting until next month, ' +
    'their going to send a new agenda soon. This is a very very important desicion ' +
    'that effects everyone in the department.';

const SAMPLE_ISSUES: GrammarIssue[] = [
    {
        id: 'issue-1',
        type: 'Spelling',
        severity: 'critical',
        char_start: 4,
        char_end: 13,
        original_span: 'comittee',
        suggestion: 'committee',
        explanation: '"Comittee" is a misspelling of "committee" — double "m", double "t".',
    },
    {
        id: 'issue-2',
        type: 'Grammar',
        severity: 'major',
        char_start: 18,
        char_end: 22,
        original_span: 'have',
        suggestion: 'has',
        explanation: '"Committee" is a collective noun treated as singular here, so it takes "has", not "have".',
    },
    {
        id: 'issue-3',
        type: 'Spelling',
        severity: 'critical',
        char_start: 32,
        char_end: 41,
        original_span: 'postphone',
        suggestion: 'postpone',
        explanation: '"Postphone" is a misspelling of "postpone".',
    },
    {
        id: 'issue-4',
        type: 'Grammar',
        severity: 'major',
        char_start: 80,
        char_end: 85,
        original_span: 'their',
        suggestion: "they're",
        explanation: '"Their" is possessive; the sentence needs the contraction "they\'re" (they are).',
    },
    {
        id: 'issue-5',
        type: 'Style',
        severity: 'minor',
        char_start: 128,
        char_end: 137,
        original_span: 'very very',
        suggestion: 'extremely',
        explanation: 'Repeating "very" is weak style — a single stronger adverb reads better.',
    },
    {
        id: 'issue-6',
        type: 'Spelling',
        severity: 'critical',
        char_start: 148,
        char_end: 156,
        original_span: 'desicion',
        suggestion: 'decision',
        explanation: '"Desicion" is a misspelling of "decision".',
    },
    {
        id: 'issue-7',
        type: 'Grammar',
        severity: 'minor',
        char_start: 168,
        char_end: 175,
        original_span: 'effects',
        suggestion: 'affects',
        explanation: '"Effects" (noun) is used where the verb "affects" is needed.',
    },
];

export const MOCK_DOCUMENT_SUMMARY: DocumentSummary = {
    id: 'doc-mock-1',
    filename: 'committee-notice.docx',
    file_type: 'docx',
    page_count: 1,
    detected_language: 'English',
    detected_language_confidence: 98,
    word_count: 34,
    grammar_score: 62,
    readability_grade: 9.2,
    readability_label: 'Fairly Difficult',
    issue_counts: { critical: 3, major: 2, minor: 2 },
    document_classification: 'Internal',
    confidence_score: 88,
    review_status: 'needs_review',
    created_at: new Date().toISOString(),
};

export const MOCK_DOCUMENT_DETAIL: DocumentDetail = {
    ...MOCK_DOCUMENT_SUMMARY,
    original_text: SAMPLE_TEXT,
    corrected_text:
        'The committee has decided to postpone the meeting until next month, ' +
        "they're going to send a new agenda soon. This is an extremely important decision " +
        'that affects everyone in the department.',
    issues: SAMPLE_ISSUES,
    prompt_suggestions: [
        'What are the most critical issues in this text?',
        'Summarize the tone of this notice.',
        'Suggest a more formal rewrite of the first sentence.',
    ],
    extraction_error: null,
    file_size_bytes: 15872,
    reviewed_at: null,
    reviewer_name: null,
    reviewer_notes: null,
};
