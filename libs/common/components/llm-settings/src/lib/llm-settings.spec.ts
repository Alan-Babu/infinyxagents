import { Injector, runInInjectionContext } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService, CommonService } from '@nfinyx/services';
import { ApiError } from '@nfinyx/types';
import { LlmSettingsPage } from './llm-settings';
import { LlmSettingsApi } from './llm-settings-api';
import { LlmSettingsResponse } from './llm-settings.models';

const saved: LlmSettingsResponse = {
    config: {
        provider: 'openai_compatible',
        base_url: 'http://vllm.internal:8000/v1',
        model: 'Qwen3-VL',
        enabled: true,
        timeout_seconds: 300,
        max_tokens: 2048,
        vllm_extras: true,
        api_key_set: true,
        api_key_hint: '••34',
    },
    editable: true,
    providers: ['openai_compatible', 'anthropic'],
    limits: { timeout_seconds: [1, 3600], max_tokens: [1, 65536] },
    restricted_hosts: [],
};

function build(opts: { admin?: boolean; response?: LlmSettingsResponse; confirm?: boolean } = {}) {
    const api = {
        load: vi.fn().mockResolvedValue(opts.response ?? saved),
        update: vi.fn().mockImplementation(async (body) => ({
            ...saved,
            config: { ...saved.config, ...body, api_key_set: true, api_key_hint: '••99' },
        })),
        reset: vi.fn().mockResolvedValue(saved),
        test: vi.fn().mockResolvedValue({ ok: true, model: 'gpt-4o', latency_ms: 42 }),
    };
    const toastr = { success: vi.fn(), error: vi.fn() };
    const common = { showConfirmationDialog: vi.fn().mockResolvedValue(opts.confirm ?? true) };
    const translate = {
        instant: vi.fn((key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key)),
        setTranslation: vi.fn(),
    };
    const injector = Injector.create({
        providers: [
            { provide: LlmSettingsApi, useValue: api },
            { provide: AuthService, useValue: { isAgentAdmin: () => opts.admin ?? true, isAdmin: () => opts.admin ?? true } },
            { provide: CommonService, useValue: common },
            { provide: ToastrService, useValue: toastr },
            { provide: TranslateService, useValue: translate },
            { provide: ActivatedRoute, useValue: { snapshot: { data: { agentId: 'translator-agent' } } } },
        ],
    });
    const page = runInInjectionContext(injector, () => new LlmSettingsPage());
    return { page, api, toastr, common, translate };
}

describe('LlmSettingsPage', () => {
    beforeEach(() => vi.clearAllMocks());

    it('registers its own translations so any module can host it', () => {
        const { translate } = build();
        expect(translate.setTranslation).toHaveBeenCalledWith('en', expect.objectContaining({ llmSettings: expect.anything() }), true);
        expect(translate.setTranslation).toHaveBeenCalledWith('ar', expect.objectContaining({ llmSettings: expect.anything() }), true);
    });

    it('does not even request the settings for a non-admin', async () => {
        const { page, api } = build({ admin: false });
        await page.ngOnInit();
        expect(api.load).not.toHaveBeenCalled();
        expect(page.isAdmin()).toBe(false);
    });

    it('loads the saved values and starts with nothing to save', async () => {
        const { page } = build();
        await page.ngOnInit();

        expect(page.draft).toMatchObject({ provider: 'openai_compatible', baseUrl: 'http://vllm.internal:8000/v1', model: 'Qwen3-VL', apiKey: '' });
        expect(page.hasChanges).toBe(false);
        expect(page.keyHint).toContain('••34');
    });

    it('saves only what changed, and never sends a blank key', async () => {
        const { page, api } = build();
        await page.ngOnInit();
        page.draft.model = ' gpt-4o ';
        page.draft.baseUrl = 'https://api.openai.com/v1';

        expect(page.hasChanges).toBe(true);
        await page.save();

        expect(api.update).toHaveBeenCalledWith({ model: 'gpt-4o', base_url: 'https://api.openai.com/v1' });
        expect(page.draft.apiKey).toBe('');
        expect(page.hasChanges).toBe(false);
    });

    it('sends a key only when one was typed, and clears the field afterwards', async () => {
        const { page, api } = build();
        await page.ngOnInit();
        page.draft.apiKey = '  sk-new-key-9999 ';

        await page.save();

        expect(api.update).toHaveBeenCalledWith({ api_key: 'sk-new-key-9999' });
        expect(page.draft.apiKey).toBe('');
        expect(page.keyHint).toContain('••99');
    });

    it('sends numeric limits as numbers even when the input yields strings', async () => {
        const { page, api } = build();
        await page.ngOnInit();
        page.draft.timeoutSeconds = '120' as unknown as number;

        await page.save();

        expect(api.update).toHaveBeenCalledWith({ timeout_seconds: 120 });
    });

    it('asks for confirmation and does nothing when it is declined', async () => {
        const { page, api, common } = build({ confirm: false });
        await page.ngOnInit();
        page.draft.model = 'gpt-4o';

        await page.save();

        expect(common.showConfirmationDialog).toHaveBeenCalled();
        expect(api.update).not.toHaveBeenCalled();
        expect(page.draft.model).toBe('gpt-4o');
    });

    it('maps per-field validation errors from a 422', async () => {
        const { page, api, toastr } = build();
        await page.ngOnInit();
        api.update.mockRejectedValueOnce(
            new ApiError('Some settings are invalid.', 422, { errors: [{ field: 'base_url', msg: 'Must be an http(s) URL' }] } as never),
        );
        page.draft.baseUrl = 'ftp://nope';

        await page.save();

        expect(page.fieldErrors['base_url']).toBe('Must be an http(s) URL');
        expect(toastr.error).toHaveBeenCalledWith('llmSettings.toast.invalid');
        page.clearError('base_url');
        expect(page.fieldErrors['base_url']).toBeUndefined();
    });

    it('reports a 403 as not authorised', async () => {
        const { page, api, toastr } = build();
        await page.ngOnInit();
        api.update.mockRejectedValueOnce(new ApiError('Admin role required', 403, null));
        page.draft.model = 'x';

        await page.save();

        expect(toastr.error).toHaveBeenCalledWith('llmSettings.toast.notAuthorised');
    });

    it('tests the form as it stands, leaving a blank key out so the saved one is used', async () => {
        const { page, api } = build();
        await page.ngOnInit();
        page.draft.provider = 'anthropic';
        page.draft.baseUrl = '';
        page.draft.model = 'claude-sonnet-4-6';

        await page.test();

        expect(api.test).toHaveBeenCalledWith({ provider: 'anthropic', base_url: '', model: 'claude-sonnet-4-6' });
        expect(page.testResult?.ok).toBe(true);
        expect(page.testMessage(page.testResult!)).toContain('llmSettings.test.ok');
    });

    it('includes a typed key in the test but does not save it', async () => {
        const { page, api } = build();
        await page.ngOnInit();
        page.draft.apiKey = 'sk-try-me-1234';

        await page.test();

        expect(api.test).toHaveBeenCalledWith(expect.objectContaining({ api_key: 'sk-try-me-1234' }));
        expect(api.update).not.toHaveBeenCalled();
    });

    it('shows a failed test as a message, not an error toast', async () => {
        const { page, api, toastr } = build();
        await page.ngOnInit();
        api.test.mockResolvedValueOnce({ ok: false, error: 'openai request failed with HTTP 401: bad key', status_code: 401 });

        await page.test();

        expect(page.testResult?.ok).toBe(false);
        expect(page.testMessage(page.testResult!)).toContain('HTTP 401');
        expect(toastr.error).not.toHaveBeenCalled();
    });

    it('cannot save when the agent stores these values elsewhere (read-only)', async () => {
        const { page, api } = build({ response: { ...saved, editable: false } });
        await page.ngOnInit();
        page.draft.model = 'x';

        await page.save();
        await page.resetToDefaults();

        expect(page.editable).toBe(false);
        expect(api.update).not.toHaveBeenCalled();
        expect(api.reset).not.toHaveBeenCalled();
    });

    it('discards edits and can reset to the defaults after confirming', async () => {
        const { page, api } = build();
        await page.ngOnInit();
        page.draft.model = 'changed';
        page.discard();
        expect(page.draft.model).toBe('Qwen3-VL');

        await page.resetToDefaults();
        expect(api.reset).toHaveBeenCalled();
    });

    it('switches placeholders and hides the vLLM option for Anthropic', async () => {
        const { page } = build();
        await page.ngOnInit();
        expect(page.isAnthropic).toBe(false);
        expect(page.modelPlaceholderKey).toContain('modelOpenai');

        page.draft.provider = 'anthropic';
        expect(page.isAnthropic).toBe(true);
        expect(page.baseUrlPlaceholderKey).toContain('baseUrlAnthropic');
    });
});
