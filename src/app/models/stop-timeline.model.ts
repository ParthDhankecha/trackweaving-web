export interface IStopTimelineStop {
    category: string;
    stopReason: string;
    from: string;
    to: string;
    duration: number;
    stopTime: string;
    startOffsetPct: number;
    widthPct: number;
}

export interface IStopTimelineMachineRow {
    machineId: string;
    machineCode: string;
    stops: IStopTimelineStop[];
    totalStopSeconds: number;
    totalStopTime: string;
}

export interface IStopTimelineShiftWindow {
    start: string;
    end: string;
    startTimeLabel: string;
    endTimeLabel: string;
    durationMinutes: number;
    usedFallback?: boolean;
}

export interface IStopTimelineSegment {
    reportDate: string;
    shift: number;
    shiftLabel: string;
    shiftWindow: IStopTimelineShiftWindow;
    machines: IStopTimelineMachineRow[];
}

export interface IStopTimelineEntry {
    reportDate: string;
    machineCode: string;
    machineId: string;
    shift: number;
    shiftLabel: string;
    category: string;
    stopReason: string;
    from: string;
    to: string;
    stopTime: string;
}

export interface IStopTimelineReport {
    segments: IStopTimelineSegment[];
    entries: IStopTimelineEntry[];
    totalStops: number;
    shiftTimingConfigured?: boolean;
}
