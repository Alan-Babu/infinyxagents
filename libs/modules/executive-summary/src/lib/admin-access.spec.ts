import { describe, expect, it, vi } from 'vitest';

import { GuardrailsReportPage } from './pages/guardrails-report/guardrails-report';
import { UsageAnalyticsPage } from './pages/usage-analytics/usage-analytics';

/**
 * Every endpoint these pages read sits on the exec-agent admin router, which answers 401
 * for anyone it can't verify as an admin. Probing it anyway surfaced as backend noise and,
 * before the interceptor was scoped, cost the caller their shared login.
 */
function withRole<T>(prototype: object, isAdmin: boolean, extra: Record<string, unknown> = {}): T {
  const page = Object.create(prototype) as T;
  Object.assign(page as object, { auth: { isAdmin: () => isAdmin } }, extra);
  return page;
}

describe('Executive summary admin-only access', () => {
  it('skips the moderation flag fetch for a non-admin', () => {
    const listModerationFlags = vi.fn();
    const page = withRole<GuardrailsReportPage>(GuardrailsReportPage.prototype, false, {
      api: { listModerationFlags },
    });

    page.ngOnInit();

    expect(page.isAdmin).toBe(false);
    expect(listModerationFlags).not.toHaveBeenCalled();
  });

  it('skips the audit log fetch for a non-admin switching to the activity tab', async () => {
    const getAuditLog = vi.fn();
    const page = withRole<GuardrailsReportPage>(GuardrailsReportPage.prototype, false, {
      api: { getAuditLog },
      auditLoaded: false,
    });

    await page.selectTab('activity');

    expect(page.activeTab).toBe('activity');
    expect(getAuditLog).not.toHaveBeenCalled();
  });

  it('loads moderation flags for an admin', async () => {
    const flags = [{ id: 1 }];
    const page = withRole<GuardrailsReportPage>(GuardrailsReportPage.prototype, true, {
      api: { listModerationFlags: vi.fn().mockResolvedValue(flags) },
    });

    await page.refresh();

    expect(page.flags).toEqual(flags);
    expect(page.loading).toBe(false);
  });

  it('skips every analytics request for a non-admin', async () => {
    const api = {
      getUsageSummary: vi.fn(),
      getUsageTimeseries: vi.fn(),
      getModerationSummary: vi.fn(),
    };
    const page = withRole<UsageAnalyticsPage>(UsageAnalyticsPage.prototype, false, {
      api,
      loading: false,
      partialFailure: false,
    });

    await page.ngOnInit();

    expect(api.getUsageSummary).not.toHaveBeenCalled();
    expect(api.getUsageTimeseries).not.toHaveBeenCalled();
    expect(api.getModerationSummary).not.toHaveBeenCalled();
    expect(page.loading).toBe(false);
    expect(page.partialFailure).toBe(false);
  });

  it('loads analytics for an admin', async () => {
    const page = withRole<UsageAnalyticsPage>(UsageAnalyticsPage.prototype, true, {
      api: {
        getUsageSummary: vi.fn().mockResolvedValue({ total_requests: 12 }),
        getUsageTimeseries: vi.fn().mockResolvedValue([]),
        getModerationSummary: vi.fn().mockResolvedValue({ by_category: [] }),
      },
    });

    await page.ngOnInit();

    expect(page.summary).toEqual({ total_requests: 12 });
    expect(page.partialFailure).toBe(false);
    expect(page.loading).toBe(false);
  });
});
