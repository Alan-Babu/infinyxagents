const PRIORITY_BY_CATEGORY: Record<string, 'High' | 'Medium' | 'Low'> = {
    national_security: 'High',
    weapons_violence: 'High',
    hate_speech: 'High',
};

export function categoryLabel(category: string): string {
    return category
        .split('_')
        .map(w => w[0].toUpperCase() + w.slice(1))
        .join(' ');
}

export function guardrailPriority(category: string): 'High' | 'Medium' | 'Low' {
    return PRIORITY_BY_CATEGORY[category] || 'Medium';
}

export function guardrailStatusLabel(status: string, t: (key: string) => string): string {
    if (status === 'corrective_action_taken') return t('executiveSummary.guardrails.actionTaken');
    return status.charAt(0).toUpperCase() + status.slice(1);
}

export function initials(userId: string): string {
    const clean = userId.replace(/@.*/, '');
    const parts = clean.split(/[.\s_-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return clean.slice(0, 2).toUpperCase();
}
