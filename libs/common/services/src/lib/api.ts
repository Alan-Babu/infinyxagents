import { inject, Inject, Injectable } from '@angular/core';
import { ApiError, ApiErrorBody, AppConfig } from '@nfinyx/types';
import { APP_CONFIG } from './app-config';
import { HttpClient, HttpErrorResponse, HttpEventType, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/** One line of a newline-delimited JSON stream from a `postStream` endpoint. */
export interface StreamEvent {
    type: 'delta' | 'done' | 'error';
    text?: string;
    message?: string;
    [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
    public baseURL!: string;
    private readonly http = inject(HttpClient);

    constructor(@Inject(APP_CONFIG) protected appConfig: AppConfig,) {
        this.baseURL = this.resolveBaseUrl('api');
    }

    /**
     * Builds `{domain}/{servicePath}` from the shared root `appConfig.baseURL`.
     * Subclasses for a specific agent should call this again from their own
     * constructor (after `super()`) with their own segment, e.g.:
     * `this.baseURL = this.resolveBaseUrl('exec-agent/api');`
     */
    protected resolveBaseUrl(servicePath: string): string {
        const root = this.appConfig.baseURL.replace(/\/+$/, '');
        const segment = servicePath.replace(/^\/+|\/+$/g, '');
        return segment ? `${root}/${segment}` : root;
    }

    get<T>(path: string, query?: Record<string, string | number | boolean | undefined | null>): Promise<T> {
        return firstValueFrom(
            this.http.get<T>(this.url(path), { params: this.toParams(query) }),
        ).catch(err => {
            throw this.toApiError(err);
        });
    }

    getBlob(path: string, query?: Record<string, string | number | boolean | undefined | null>): Promise<Blob> {
        return firstValueFrom(
            this.http.get(this.url(path), {
                params: this.toParams(query),
                responseType: 'blob',
            }),
        ).catch(err => {
            throw this.toApiError(err);
        });
    }

    post<T>(path: string, body: unknown): Promise<T> {
        return firstValueFrom(this.http.post<T>(this.url(path), body)).catch(err => {
            throw this.toApiError(err);
        });
    }

    /**
     * Posts to a newline-delimited-JSON streaming endpoint (each line one
     * `StreamEvent`) and resolves with the `"done"` event's payload once
     * the stream ends, calling `onDelta` for every `"delta"` event along
     * the way so the caller can render partial content as it arrives
     * instead of waiting for the whole response.
     *
     * Built on HttpClient's DownloadProgress events (`responseType: 'text'`,
     * `reportProgress: true`) rather than the native EventSource API —
     * EventSource is GET-only and can't carry the Authorization header
     * AuthInterceptor attaches to every request, while this stays on the
     * same HttpClient/interceptor pipeline as every other call here.
     * `partialText` on each progress event is the FULL response text
     * received so far (not just the new bytes), so only the newly-arrived
     * suffix is parsed each time; a trailing incomplete line is held back
     * until the next event (or the final Response event) completes it.
     */
    postStream<TDone extends Record<string, unknown>>(
        path: string,
        body: unknown,
        onDelta: (text: string) => void,
    ): Promise<TDone> {
        return new Promise<TDone>((resolve, reject) => {
            let seenLength = 0;
            let carry = '';
            let settled = false;

            const consume = (fullTextSoFar: string, isFinal: boolean) => {
                const newText = fullTextSoFar.slice(seenLength);
                seenLength = fullTextSoFar.length;
                carry += newText;
                const lines = carry.split('\n');
                carry = isFinal ? '' : (lines.pop() ?? '');
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || settled) continue;
                    let evt: StreamEvent;
                    try {
                        evt = JSON.parse(trimmed);
                    } catch {
                        continue; // an incomplete/malformed line - ignore rather than fail the whole stream
                    }
                    if (evt.type === 'delta') {
                        if (evt.text) onDelta(evt.text);
                    } else if (evt.type === 'done') {
                        settled = true;
                        resolve(evt as unknown as TDone);
                    } else if (evt.type === 'error') {
                        settled = true;
                        reject(new ApiError(evt.message || 'Stream failed', 0, null));
                    }
                }
            };

            this.http
                .post(this.url(path), body, { observe: 'events', responseType: 'text', reportProgress: true })
                .subscribe({
                    next: event => {
                        if (event.type === HttpEventType.DownloadProgress) {
                            consume(event.partialText ?? '', false);
                        } else if (event.type === HttpEventType.Response) {
                            consume((event.body as string) ?? '', true);
                            if (!settled) {
                                reject(new ApiError('Stream ended without a result', 0, null));
                            }
                        }
                    },
                    error: err => {
                        if (!settled) reject(this.toApiError(err));
                    },
                });
        });
    }

    postFormData<T>(path: string, formData: FormData): Promise<T> {
        return firstValueFrom(this.http.post<T>(this.url(path), formData)).catch(err => {
            throw this.toApiError(err);
        });
    }

    postForm<T>(path: string, body: Record<string, string>): Promise<T> {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(body)) {
            params.set(key, value);
        }
        return firstValueFrom(
            this.http.post<T>(this.url(path), params.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            }),
        ).catch(err => {
            throw this.toApiError(err);
        });
    }

    postBlob(path: string, body: unknown): Promise<Blob> {
        return firstValueFrom(
            this.http.post(this.url(path), body, { responseType: 'blob' }),
        ).catch(err => {
            throw this.toApiError(err);
        });
    }

    patch<T>(path: string, body: unknown): Promise<T> {
        return firstValueFrom(this.http.patch<T>(this.url(path), body)).catch(err => {
            throw this.toApiError(err);
        });
    }

    put<T>(path: string, body: unknown, options?: { headers?: Record<string, string> }): Promise<T> {
        return firstValueFrom(
            this.http.put<T>(this.url(path), body, { headers: options?.headers }),
        ).catch(err => {
            throw this.toApiError(err);
        });
    }

    delete<T = void>(
        path: string,
        query?: Record<string, string | number | boolean | undefined | null>,
    ): Promise<T> {
        return firstValueFrom(
            this.http.delete<T>(this.url(path), { params: this.toParams(query) }),
        ).catch(err => {
            throw this.toApiError(err);
        });
    }

    protected url(path: string): string {
        const base = this.baseURL.replace(/\/$/, '');
        const segment = path.startsWith('/') ? path : `/${path}`;
        return `${base}${segment}`;
    }

    private toParams(
        query?: Record<string, string | number | boolean | undefined | null>,
    ): HttpParams | undefined {
        if (!query) return undefined;
        let params = new HttpParams();
        for (const [key, value] of Object.entries(query)) {
            if (value === undefined || value === null) continue;
            params = params.set(key, String(value));
        }
        return params;
    }

    private toApiError(err: unknown): ApiError {
        if (err instanceof HttpErrorResponse) {
            const body = (err.error ?? null) as ApiErrorBody | null;
            const message =
                typeof body?.detail === 'string'
                    ? body.detail
                    : err.statusText || 'Request failed';
            return new ApiError(message, err.status, body);
        }
        if (err instanceof Error) {
            return new ApiError(err.message, 0, null);
        }
        return new ApiError('Unexpected error', 0, null);
    }

}