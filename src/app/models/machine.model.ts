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


export interface IMachineLog {
    machineCode: string;
    machineName: string;
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
        warp: {
            duration: string; // "HH:mm"
            count: number;
        },
        weft: {
            duration: string; // "HH:mm"
            count: number;
        },
        feeder: {
            duration: string; // "HH:mm"
            count: number;
        },
        manual: {
            duration: string; // "HH:mm"
            count: number;
        },
        other: {
            duration: string; // "HH:mm"
            count: number;
        },
        total: {
            duration: string; // "HH:mm"
            count: number;
        }
    };
    totalDuration: string; // "HH:mm"
    [key: string]: any;
};