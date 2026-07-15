// Enum for Toaster types
export enum EMachineStatusIds {
    Running = 'running',
    Stopped = 'stopped',
    all = 'all',
};


export interface IMachineStatus {
    key: EMachineStatusIds;
    label: string;
};


export type MachineType = 'rapier' | 'airjet' | 'waterjet' | 'circular';

export const MACHINE_TYPE_KEY_MAPPING: Record<MachineType, string[]> = {
    rapier: ['warp', 'weft', 'feeder', 'manual', 'other'],
    airjet: ['h1', 'h2', 'warp', 'other'],
    waterjet: ['warp', 'weft', 'feeder', 'manual', 'other'],
    circular: ['warp', 'weft', 'feeder', 'manual', 'other'],
};

export const STOP_KEY_LABELS: Record<string, string> = {
    warp: 'Warp',
    weft: 'Weft',
    feeder: 'Feeder',
    manual: 'Manual',
    other: 'Other',
    h1: 'H1',
    h2: 'H2',
};

export const STOP_KEY_ORDER = ['h1', 'h2', 'warp', 'weft', 'feeder', 'manual', 'other'];

export function getStopColumns(machineType: MachineType = 'rapier'): { key: string; label: string }[] {
    const keys = MACHINE_TYPE_KEY_MAPPING[machineType] || MACHINE_TYPE_KEY_MAPPING.rapier;
    return keys.map(key => ({
        key,
        label: STOP_KEY_LABELS[key] || key
    }));
}

export function getStopColumnsForTypes(types: MachineType[]): { key: string; label: string }[] {
    const keys = new Set<string>();
    types.forEach(type => {
        (MACHINE_TYPE_KEY_MAPPING[type] || MACHINE_TYPE_KEY_MAPPING.rapier).forEach(key => keys.add(key));
    });
    return STOP_KEY_ORDER
        .filter(key => keys.has(key))
        .map(key => ({
            key,
            label: STOP_KEY_LABELS[key] || key
        }));
}

export function hasStopKey(machineType: MachineType = 'rapier', key: string): boolean {
    const keys = MACHINE_TYPE_KEY_MAPPING[machineType] || MACHINE_TYPE_KEY_MAPPING.rapier;
    return keys.includes(key);
}

export interface IMachineLog {
    machineCode: string;
    machineName: string;
    quality?: string;
    machineType?: MachineType;
    machineGroupId?: string | null;
    efficiency: number;
    picks: number;
    speed: number;
    currentStop: number;
    stopReason: string;
    pieceLengthM: number;
    stops: number;
    beamLeft: number;
    setPicks: number;
    stopsData: {
        warp?: {
            duration: string; // "HH:mm"
            count: number;
        },
        weft?: {
            duration: string; // "HH:mm"
            count: number;
        },
        feeder?: {
            duration: string; // "HH:mm"
            count: number;
        },
        manual?: {
            duration: string; // "HH:mm"
            count: number;
        },
        other?: {
            duration: string; // "HH:mm"
            count: number;
        },
        h1?: {
            duration: string; // "HH:mm"
            count: number;
        },
        h2?: {
            duration: string; // "HH:mm"
            count: number;
        },
        total?: {
            duration: string; // "HH:mm"
            count: number;
        }
    };
    totalDuration: string; // "HH:mm"
    [key: string]: any;
};


export type LayoutOption = 'default' | '2x2' | '3x2' | '4x2' | '4x3' | '5x3' | 'dense';

export type MetricDisplayMode = 'icon' | 'label';

export type GroupByOption = 'default' | 'group' | 'efficiency';

export interface IMachineLogGroup {
    key: string;
    label: string;
    machines: IMachineLog[];
    metrics: {
        efficiency: number;
        pick: number;
        avgPicks: number;
        avgSpeed: number;
        count: number;
    };
}

export const EFFICIENCY_BANDS: { key: string; label: string; min: number; max: number }[] = [
    { key: '0-50', label: '0-50%', min: 0, max: 50 },
    { key: '51-70', label: '51-70%', min: 51, max: 70 },
    { key: '71-80', label: '71-80%', min: 71, max: 80 },
    { key: '81-90', label: '81-90%', min: 81, max: 90 },
    { key: '91-100', label: '91-100%', min: 91, max: 100 },
];

export interface LayoutConfig {
    rows: number;
    cols: number;
    fs?: string;
    bootstrap?: string; // optional bootstrap class
    autoFill?: boolean; // responsive auto-fill grid (no fixed rows/cols)
};