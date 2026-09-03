import { describe, expect, it, vi } from 'vitest';

import { GuardrailsReportPage } from './guardrails-report';

describe('GuardrailsReportPage audit loading', () => {
  it('allows a retry after an audit request fails', async () => {
    const getAuditLog = vi.fn()
      .mockRejectedValueOnce(new Error('unavailable'))
      .mockResolvedValueOnce([{ id: 1 }]);
    const page = Object.create(GuardrailsReportPage.prototype) as GuardrailsReportPage;
    Object.assign(page, {
      api: { getAuditLog },
      auth: { isAdmin: () => true },
      toastr: { warning: vi.fn() },
      translate: { instant: (key: string) => key },
      activeTab: 'blocked',
      auditEntries: [],
      auditLoading: false,
      auditLoaded: false,
    });

    await page.selectTab('activity');
    expect(page.auditLoaded).toBe(false);

    await page.selectTab('activity');
    expect(getAuditLog).toHaveBeenCalledTimes(2);
    expect(page.auditLoaded).toBe(true);
    expect(page.auditEntries).toEqual([{ id: 1 }]);
  });
});
