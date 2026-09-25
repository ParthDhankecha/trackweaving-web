import { STOP_KEY_ORDER } from '@src/app/models/machine.model';
import { IStopTimelineReport } from '@src/app/models/stop-timeline.model';

/** H1 uses weft color — machine types never expose both on the same timeline. */
export const STOP_CATEGORY_COLORS: Record<string, string> = {
    warp: '#dc3545',
    weft: '#0d6efd',
    feeder: '#6f42c1',
    manual: '#fd7e14',
    other: '#6c757d',
    h1: '#0d6efd',
    h2: '#495057',
};

export const STOP_CATEGORY_LABELS: Record<string, string> = {
    warp: 'Warp',
    weft: 'Weft',
    feeder: 'Feeder',
    manual: 'Manual',
    other: 'Other',
    h1: 'H1',
    h2: 'H2',
};

const DEFAULT_STOP_COLOR = '#6c757d';

/** IST — matches backend factory timezone (server UTC, shift wall clock IST). */
export const WORKSPACE_UTC_OFFSET_MINUTES = 330;

export function stopCategoryColor(category: string): string {
    return STOP_CATEGORY_COLORS[category] ?? DEFAULT_STOP_COLOR;
}

export function stopCategoryLabel(category: string): string {
    return STOP_CATEGORY_LABELS[category] ?? category;
}

/** 24h clock in factory IST (not browser local timezone). */
export function formatTimelineClock(value: string | Date): string {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (!value || Number.isNaN(date.getTime())) return '—';
    const parts = getWorkspaceTimeParts(date);
    return `${parts.hours.toString().padStart(2, '0')}:${parts.minutes.toString().padStart(2, '0')}`;
}

function getWorkspaceTimeParts(date: Date): { hours: number; minutes: number } {
    const shifted = new Date(date.getTime() + WORKSPACE_UTC_OFFSET_MINUTES * 60_000);
    return {
        hours: shifted.getUTCHours(),
        minutes: shifted.getUTCMinutes(),
    };
}

export function collectStopCategoriesFromReport(report: IStopTimelineReport | null): string[] {
    if (!report?.segments?.length) return [];

    const found = new Set<string>();
    for (const segment of report.segments) {
        for (const machine of segment.machines || []) {
            for (const stop of machine.stops || []) {
                if (stop.category) {
                    found.add(stop.category);
                }
            }
        }
    }

    return STOP_KEY_ORDER.filter((key) => found.has(key));
}

/** Start of calendar day in IST, as UTC epoch ms (for comparing report dates). */
export function startOfWorkspaceCalendarDay(date: Date): number {
    const shifted = new Date(date.getTime() + WORKSPACE_UTC_OFFSET_MINUTES * 60_000);
    const dayStartUtc = Date.UTC(
        shifted.getUTCFullYear(),
        shifted.getUTCMonth(),
        shifted.getUTCDate()
    );
    return dayStartUtc - WORKSPACE_UTC_OFFSET_MINUTES * 60_000;
}

/**
 * Green “running” fill within the shift track.
 * Past report dates → full width. Today → fill to current time (or empty if shift not started).
 */
export function computeRunningFillPct(shiftWindow: { start: string; end: string }, reportDate: string): number {
    const shiftStart = new Date(shiftWindow.start).getTime();
    const shiftEnd = new Date(shiftWindow.end).getTime();
    const duration = shiftEnd - shiftStart;
    if (duration <= 0) return 100;

    const isReportDayToday = startOfWorkspaceCalendarDay(new Date(reportDate))
        === startOfWorkspaceCalendarDay(new Date());

    if (!isReportDayToday) {
        return 100;
    }

    const now = Date.now();
    if (now >= shiftEnd) return 100;
    if (now <= shiftStart) return 0;

    return Math.min(100, Math.max(0, ((now - shiftStart) / duration) * 100));
}

export function buildCategoryLegendItems(categories: string[]): { key: string; label: string; color: string }[] {
    return categories.map((key) => ({
        key,
        label: stopCategoryLabel(key),
        color: stopCategoryColor(key),
    }));
}

export function buildTimeAxisLabels(
    shiftStartIso: string,
    shiftEndIso: string,
    tickCount = 5
): { pct: number; text: string }[] {
    const startMs = new Date(shiftStartIso).getTime();
    const endMs = new Date(shiftEndIso).getTime();
    const duration = Math.max(endMs - startMs, 1);
    const labels: { pct: number; text: string }[] = [];

    for (let i = 0; i <= tickCount; i++) {
        const pct = (i / tickCount) * 100;
        const at = new Date(startMs + (duration * (pct / 100)));
        labels.push({ pct, text: formatTimelineClock(at) });
    }
    return labels;
}
