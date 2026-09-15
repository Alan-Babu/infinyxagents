import { TranslateService } from '@ngx-translate/core';
import { ActivityStatus } from '../models/user-profile-activity.models';

export const STATUS_SEVERITY: Record<ActivityStatus, 'success' | 'warn' | 'danger' | 'info'> = {
    completed: 'success',
    needsReview: 'warn',
    failed: 'danger',
    inProgress: 'info',
};

export const STATUS_LABEL_KEY: Record<ActivityStatus, string> = {
    completed: 'userProfile.activity.status.completed',
    needsReview: 'userProfile.activity.status.needsReview',
    failed: 'userProfile.activity.status.failed',
    inProgress: 'userProfile.activity.status.inProgress',
};

export const CATEGORY_COLOR_CLASS: Record<string, string> = {
    'agentsLanding.category.documents': 'bg-sky-500',
    'agentsLanding.category.compliance': 'bg-amber-500',
    'agentsLanding.category.general': 'bg-violet-500',
};
export const DEFAULT_CATEGORY_COLOR_CLASS = 'bg-gray-400';

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Groups a feed row under 'Today' / 'Yesterday' (translated) or a localized weekday/date string. */
export function dayKey(ts: number, translate: TranslateService): string {
    const date = new Date(ts);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (isSameDay(date, today)) return translate.instant('userProfile.activity.day.today');
    if (isSameDay(date, yesterday)) return translate.instant('userProfile.activity.day.yesterday');

    const lang = translate.currentLang || 'en';
    const daysDiff = Math.floor((today.getTime() - date.getTime()) / 86400000);
    if (daysDiff < 7) return date.toLocaleDateString(lang, { weekday: 'long' });
    return date.toLocaleDateString(lang, { month: 'long', day: 'numeric' });
}

export function formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Mirrors digital-attestation/utils/case-display.ts's timeAgo() shape. */
export function timeAgo(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
}

export function formatDateTime(ts: number): string {
    return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
