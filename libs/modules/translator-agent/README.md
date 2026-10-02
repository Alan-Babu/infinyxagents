# translator-agent

Angular feature library for the document translation agent: upload a document, detect its
language, translate it page by page, review the extracted intelligence, ask questions about it
and generate summaries. It talks to the Document Translation backend (`translatorAI/backend`)
through the gateway segment `doc-translate/api` (`TranslatorApiBase`).

## Screens

| Route | Page | What it does |
|---|---|---|
| `/translator-agent` | `upload` | chunked upload → language detection → optional page selection → translate |
| `/translator-agent/documents` | `my-documents` | search, filter and open stored documents |
| `/translator-agent/documents/:id` | `document-detail` | tabs: Overview, Risk, Approval & Attestation, Stamps & Signatures, Translation (split view), **Summary**, Ask Document |

### Summary tab

Pick one or more of the six summary types (concise, numerical analysis, detailed concise,
executive, key points, technical) and generate them. The backend caches each summary per
document: a repeat request is instant (badge "Saved"), "Regenerate" forces a fresh model call and
a "Document changed" badge shows when the source text changed since a summary was written. If
only some types fail, the rest are still shown and each failure is listed.

Pages that were already English are returned as-is by the backend (`skipped: true`) and are
labelled as such in the Translation tab.

## API surface used (`TranslatorApiService`)

`detectDocument`, `translateDocument`, `listDocuments`, `getDocument`, `deleteDocument`,
`getReviewQueue`, `reviewDocument`, `getDocumentPages`, `askDocument`, `listQA`,
`submitFeedback`, `getStats`, `getSearchHistory`, `getPerformanceReport`, `getLogs`, and for
summaries `getSummaryTypes`, `listSummaries`, `generateSummaries`, `deleteSummary`.

Error messages shown to users come from the backend's `detail` field (`ApiError.message`).

## Gateway requirements

- Route `doc-translate/api/*` to the backend's `/api/*`.
- Allow request bodies of at least 512 KB (upload chunks) and use a read timeout of at least
  300 s: `/documents/translate` and `/documents/{id}/summaries` call the model synchronously.
- The shared "Model settings" page (`llmSettingsRoute`) uses the backend's read-only
  `/admin/llm` endpoints.

## Tests

```bash
npx nx test translator-agent
```

Covers the API contracts, the summary logic of the detail page and EN/AR translation parity.
