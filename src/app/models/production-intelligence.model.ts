export type TPrioritySeverity = 'critical' | 'attention' | 'normal';
export type TWatchStatus = 'critical' | 'watch';
export type TTrendDays = 3 | 7 | 30;

export const TREND_DAY_OPTIONS: { id: TTrendDays; label: string }[] = [
    { id: 3, label: '3 Days' },
    { id: 7, label: '7 Days' },
    { id: 30, label: '30 Days' }
];

export const PRIORITY_WEIGHTS = {
    downtime: 0.30,
    productionLoss: 0.30,
    stopFrequency: 0.15,
    repeatedStop: 0.15,
    efficiency: 0.10
};

export interface IStopReasonLoss {
    key?: string;
    reason: string;
    count: number;
    durationMinutes: number;
    estimatedLossMeters: number;
}

export interface IIntelligenceSummary {
    totalProductionMeters: number;
    overallEfficiency: number;
    totalPicks: number;
    totalDowntimeMinutes: number;
    estimatedProductionLoss: number;
    machinesNeedingAction: number;
    watchlistCount: number;
}

export interface IFactoryAverage {
    averageStops: number;
    averageDowntimeMinutes: number;
    averageEfficiency: number;
    averageRpm: number;
}

export interface IProductionOpportunity {
    headline: string;
    supporting: string;
}

export interface ITrendPoint {
    date: string;
    efficiency: number;
    downtimeMinutes: number;
    productionMeters: number;
}

export interface IHistoryAverage {
    efficiency: number;
    downtimeMinutes: number;
    productionMeters: number;
}

export interface IPriorityMachine {
    machineId: string;
    machineName: string;
    priorityScore: number;
    severity: TPrioritySeverity;
    primaryIssue: string;
    explanation: string;
    productionMeters: number;
    picks: number;
    efficiency: number;
    averageRpm: number;
    totalStops: number;
    downtimeMinutes: number;
    estimatedProductionLoss: number;
    stopReasons: IStopReasonLoss[];
    tags: string[];
    alsoOnWatchlist: boolean;
    stopFrequencyRatio?: number;
    history7: ITrendPoint[];
    history30Average: IHistoryAverage | null;
}

export interface IWatchlistMachine {
    machineId: string;
    machineName: string;
    status: TWatchStatus;
    primaryTrend: string;
    explanation: string;
    currentValue: string;
    currentEfficiency: number;
    historicalAverage: string;
    historicalEfficiency: number;
    percentageChange: number;
    hasValidCurrent?: boolean;
    comparisonCurrent?: string;
    comparisonNormal?: string;
    comparisonChange?: string;
    changeIsBad?: boolean;
    trendData: ITrendPoint[];
    tags: string[];
    productionMeters?: number;
    picks?: number;
    efficiency?: number;
    averageRpm?: number;
    totalStops?: number;
    downtimeMinutes?: number;
    estimatedProductionLoss?: number;
    stopReasons?: IStopReasonLoss[];
    history7?: ITrendPoint[];
    history30Average?: IHistoryAverage | null;
}

export interface IWatchlist {
    criticalCount: number;
    watchCount: number;
    machines: IWatchlistMachine[];
}

export interface ILossRow {
    machineId: string;
    machineName: string;
    estimatedLossMeters: number;
    downtimeMinutes: number;
    mainReason: string;
}

export interface ILossBreakdown {
    topSharePercent: number;
    summary: string;
    rows: ILossRow[];
}

export interface IIntelligenceRecommendation {
    title: string;
    detail: string;
}

export interface IProductionIntelligenceReport {
    periodLabel: string;
    trendDays: TTrendDays;
    weights: typeof PRIORITY_WEIGHTS;
    summary: IIntelligenceSummary;
    factoryAverage: IFactoryAverage;
    productionOpportunity: IProductionOpportunity;
    priorityMachines: IPriorityMachine[];
    maintenanceWatchlist: IWatchlist;
    productionLossBreakdown: ILossBreakdown;
    stopReasonLosses: IStopReasonLoss[];
    recommendations: IIntelligenceRecommendation[];
}

export interface IProductionIntelligenceRequest {
    startDate: string;
    endDate: string;
    shift: number[];
    machineIds: string[];
    trendDays: TTrendDays;
}
