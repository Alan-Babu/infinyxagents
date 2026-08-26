/**
 * Reference fixtures for manual dev testing of doc-intel-agent screens
 * (especially the Verify Source bounding-box overlay) while the backend API
 * is offline. NOT exported from the library's public `index.ts` — import
 * directly from this path in a scratch component/test if needed, never from
 * production code.
 */
import { DocumentDetail, DocumentPageImage } from '../src/lib/models/doc-intel.models';

export const MOCK_DOCUMENT_DETAIL: DocumentDetail = {
    id: 'a1b2c3d4-0000-4000-8000-000000000001',
    filename: 'degree-certificate-jane-doe.pdf',
    file_type: 'pdf',
    page_count: 1,
    issued_by_type: 'University',
    issued_by_name: 'University of Westbridge',
    issued_to_type: 'Individual',
    issued_to_name: 'Jane Doe',
    document_type: 'Degree Certificate',
    issued_on: '2019-06-14',
    valid_through: null,
    has_expiry: false,
    status: 'No Expiry',
    risk_level: 'low',
    document_category: 'Individual',
    document_classification: 'Confidential',
    confidence_score: 92,
    review_status: 'auto_approved',
    created_at: '2026-08-10T09:32:00Z',
    insights: 'This is a standard bachelor\'s degree certificate issued by an accredited university. All key fields were extracted with high confidence and the document shows no signs of tampering.',
    risk_factors: [],
    prompt_suggestions: [
        'What degree was awarded?',
        'When was this certificate issued?',
        'Is this document still valid?',
    ],
    extraction_error: null,
    file_size_bytes: 482_311,
    field_locations: {
        issued_by_name: { page_num: 1, x1: 0.12, y1: 0.08, x2: 0.62, y2: 0.14 },
        issued_to_name: { page_num: 1, x1: 0.2, y1: 0.32, x2: 0.55, y2: 0.38 },
        document_type: { page_num: 1, x1: 0.2, y1: 0.4, x2: 0.5, y2: 0.46 },
        issued_on: { page_num: 1, x1: 0.6, y1: 0.82, x2: 0.85, y2: 0.87 },
    },
    stamps_and_signatures: [
        {
            type: 'University Seal',
            accredited_entity_name: 'University of Westbridge',
            ministry_of_foreign_affairs_name: null,
            country: 'United Kingdom',
            date: '2019-06-14',
            signed_by: 'Registrar, University of Westbridge',
            reference_number: 'UW-2019-04471',
            description: 'Embossed university seal with registrar signature confirming the award.',
            location: { page_num: 1, x1: 0.68, y1: 0.72, x2: 0.92, y2: 0.9 },
        },
    ],
    compliance_recommendations: {
        can_be_approved: 'Yes',
        approval_reason: 'All required fields are present and legible with high extraction confidence.',
        can_be_authorized: 'Yes',
        authorization_reason: 'The issuing institution is a recognized accredited university.',
        uae_attestation_eligible: 'Yes',
        uae_attestation_reason: 'Degree certificates from accredited foreign universities are generally eligible for attestation.',
        uae_attestation_next_step: 'Submit to the UK Foreign, Commonwealth & Development Office for authentication prior to UAE embassy attestation.',
    },
    reviewed_at: null,
    reviewer_name: null,
    reviewer_notes: null,
};

export const MOCK_DOCUMENT_NEEDS_REVIEW: DocumentDetail = {
    ...MOCK_DOCUMENT_DETAIL,
    id: 'a1b2c3d4-0000-4000-8000-000000000002',
    filename: 'medical-report-scan-low-quality.jpg',
    file_type: 'jpg',
    document_type: 'Medical Report',
    risk_level: 'high',
    confidence_score: 38,
    review_status: 'needs_review',
    insights: 'The scan quality is poor and several fields could not be extracted with confidence. Manual review is recommended before relying on this analysis.',
    risk_factors: [
        'Low scan resolution obscures parts of the issuer letterhead.',
        'No visible stamp or signature was detected.',
        'Issued-to name could not be cross-checked against a clear field.',
    ],
    field_locations: {
        issued_by_name: { page_num: 1, x1: 0.1, y1: 0.06, x2: 0.5, y2: 0.12 },
    },
    stamps_and_signatures: [],
    compliance_recommendations: {
        can_be_approved: 'Unclear',
        approval_reason: 'Confidence is too low to make a reliable determination — manual verification required.',
        can_be_authorized: 'Unclear',
        authorization_reason: 'No stamp or signature could be located on the scan.',
        uae_attestation_eligible: 'No',
        uae_attestation_reason: 'Document legibility does not meet the bar for attestation submission.',
    },
};

export const MOCK_DOCUMENT_PAGES: DocumentPageImage[] = [
    {
        page_num: 1,
        mime: 'image/png',
        // 1x1 transparent PNG placeholder — swap for a real base64 page render when testing the overlay visually.
        image_base64:
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    },
];
