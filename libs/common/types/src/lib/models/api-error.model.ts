export interface ApiErrorBody {
    detail?: string | { msg: string; type?: string; field?: string }[];
    code?: string;
    errors?: { field?: string | null; msg: string; type?: string | null }[];
}

export class ApiError extends Error {
    readonly status: number;
    readonly body: ApiErrorBody | null;

    constructor(message: string, status: number, body: ApiErrorBody | null = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.body = body;
    }
}

export function messageFromApiError(error: ApiError): string {
    const body = error.body;
    if (body?.errors?.length) {
        return body.errors.map(e => e.msg).join(', ');
    }
    const detail = body?.detail;
    if (typeof detail === 'string' && detail.trim()) {
        return detail;
    }
    if (Array.isArray(detail) && detail.length > 0) {
        return detail.map(d => d.msg).join(', ');
    }
    return error.message;
}
