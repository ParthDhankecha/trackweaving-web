const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export function monthLabel(year: number, month: number): string {
    return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function monthNames(): string[] {
    return [...MONTH_NAMES];
}

export function previousMonth(year: number, month: number): { year: number; month: number } {
    if (month === 1) return { year: year - 1, month: 12 };
    return { year, month: month - 1 };
}

export function nextMonth(year: number, month: number): { year: number; month: number } {
    if (month === 12) return { year: year + 1, month: 1 };
    return { year, month: month + 1 };
}

export function daysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

export function formatIndianNumber(value: number, fractionDigits = 0): string {
    const abs = Math.abs(value);
    const [intPart, decPart] = abs.toFixed(fractionDigits).split('.');
    const lastThree = intPart.slice(-3);
    const other = intPart.slice(0, -3);
    const formatted = other
        ? `${other.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${lastThree}`
        : lastThree;
    const sign = value < 0 ? '-' : '';
    return decPart !== undefined && fractionDigits > 0
        ? `${sign}${formatted}.${decPart}`
        : `${sign}${formatted}`;
}

export function formatMeters(value: number): string {
    return `${formatIndianNumber(Math.round(value))} m`;
}

export function formatPicksCompact(picks: number): string {
    if (picks >= 1e7) {
        return `${(picks / 1e7).toFixed(2)} Cr`;
    }
    if (picks >= 1e5) {
        return `${(picks / 1e5).toFixed(2)} L`;
    }
    return formatIndianNumber(picks);
}

export function formatHoursMinutes(totalMinutes: number): string {
    const rounded = Math.round(totalMinutes);
    const hours = Math.floor(rounded / 60);
    const minutes = rounded % 60;
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return hours >= 1000 ? `${formatIndianNumber(hours)}h` : `${hours}h`;
    return `${hours >= 1000 ? formatIndianNumber(hours) : hours}h ${minutes}m`;
}

export function formatMinutesSeconds(totalSeconds: number): string {
    const rounded = Math.round(totalSeconds);
    const minutes = Math.floor(rounded / 60);
    const seconds = rounded % 60;
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

export function formatPercent(value: number, fractionDigits = 1): string {
    return `${value.toFixed(fractionDigits)}%`;
}

export function formatChangeLabel(percentChange: number, suffix = ''): string {
    if (percentChange === 0) return `→ 0.0%${suffix}`;
    const arrow = percentChange > 0 ? '↑' : '↓';
    return `${arrow} ${Math.abs(percentChange).toFixed(1)}%${suffix}`;
}

export function percentChange(current: number, previous: number): number {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
}

export function seededRandom(seed: number): () => number {
    let t = seed + 0x6d2b79f5;
    return () => {
        t += 0x6d2b79f5;
        let r = Math.imul(t ^ (t >>> 15), t | 1);
        r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}
