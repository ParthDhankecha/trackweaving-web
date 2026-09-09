export type SectionKey = 'A' | 'B';

export type LinePerformance = 'excellent' | 'very_good' | 'good' | 'average' | 'poor' | string;

export interface EfficiencyLine {
    lineKey: string;
    efficiency: number;
    performance: LinePerformance;
}

export interface StoppedMachine {
    machineCode: string;
    lineKey: string;
    stopTime: string;
    /** Optional pre-computed duration in seconds (backend may provide this; falls back to parsing `stopTime`) */
    stopSeconds?: number;
    efficiency: number;
    stopReason: string;
}

export interface CustomDashboardResponse {
    overallEfficiency: number;
    efficiencyChartList: EfficiencyLine[];
    stoppedMachineList: StoppedMachine[];
    sectionA: number;
    sectionB: number;
}

export interface StopReasonConfig {
    label: string;
    className: string;
}

export const STOP_REASON_CONFIG: Record<string, StopReasonConfig> = {
    warp: { label: 'WARP STOP', className: 'reason-warp' },
    feeler: { label: 'FEELER STOP', className: 'reason-feeler' },
    leno: { label: 'LENO STOP', className: 'reason-leno' },
    packageSensor: { label: 'PACKAGE SENSOR', className: 'reason-package-sensor' },
};

export function getStopReasonConfig(reason: string): StopReasonConfig {
    return STOP_REASON_CONFIG[reason] || { label: (reason || 'STOPPED').toUpperCase(), className: 'reason-default' };
}

/** Parses an "HH:MM:SS" duration string into total seconds. Returns 0 for invalid input. */
export function parseStopTimeToSeconds(stopTime: string): number {
    if (!stopTime) return 0;

    const parts = stopTime.split(':').map(part => parseInt(part, 10));
    if (parts.some(Number.isNaN)) return 0;

    while (parts.length < 3) parts.unshift(0);
    const [hours, minutes, seconds] = parts.slice(-3);
    return (hours * 3600) + (minutes * 60) + seconds;
}

/** Normalizes a raw `lineKey` (e.g. "line 1", "Line 1") into a display label (e.g. "LINE 1"). */
export function formatLineLabel(lineKey: string): string {
    return (lineKey || '').toUpperCase();
}
