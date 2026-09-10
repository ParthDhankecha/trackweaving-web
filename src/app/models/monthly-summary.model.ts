export type TPerformanceClass = 'excellent' | 'good' | 'average' | 'needsAttention';
export type TCompareMode = 'previousMonth';
export type TKpiIcon = 'production' | 'efficiency' | 'picks' | 'downtime' | 'rpm' | 'runtime';

export const PERFORMANCE_FILTERS: { id: TPerformanceClass | 'all'; label: string }[] = [
    { id: 'all', label: 'All Machines' },
    { id: 'excellent', label: 'Excellent' },
    { id: 'good', label: 'Good' },
    { id: 'average', label: 'Average' },
    { id: 'needsAttention', label: 'Needs Attention' }
];

export const COMPARE_OPTIONS: { id: TCompareMode; label: string }[] = [
    { id: 'previousMonth', label: 'Previous Month' }
];

export interface IMonthRef {
    year: number;
    month: number;
    label: string;
}

export interface IKpiComparison {
    percentChange: number;
    isPositive: boolean;
    label: string;
}

export interface IKpiCard {
    key: string;
    label: string;
    value: string;
    icon: TKpiIcon;
    comparison?: IKpiComparison;
    subtitle?: string;
}

export interface IMonthlyKpis {
    totalProductionMeters: number;
    overallEfficiency: number;
    totalPicks: number;
    totalDowntimeMinutes: number;
    averageRpm: number;
    runningTimeHours: number;
    utilizationPercent: number;
}

export interface IDailyPerformance {
    date: string;
    day: number;
    productionMeters: number;
    efficiency: number;
    averageRpm: number;
    downtimeMinutes: number;
}

export interface IDailySummary {
    bestDay: IDailyPerformance;
    lowestDay: IDailyPerformance;
    averageDailyProduction: number;
}

export interface IDowntimeReason {
    reason: string;
    occurrences: number;
    durationMinutes: number;
    avgStopSeconds: number;
    downtimePercent: number;
    estimatedLossMeters: number;
}

export interface IProductionLoss {
    totalDowntimeMinutes: number;
    estimatedLossMeters: number;
    potentialAdditionalProductionPercent: number;
    topProblemMachinesDowntimePercent: number;
    explanation: string;
}

export interface IMachineSummary {
    id: string;
    name: string;
    productionMeters: number;
    efficiency: number;
    averageRpm: number;
    runningTimeMinutes: number;
    downtimeMinutes: number;
    topStopReason: string;
    performance: TPerformanceClass;
    majorIssue?: string;
    vsFactoryAveragePercent?: number;
}

export interface IShiftPerformance {
    id: string;
    name: string;
    productionMeters: number;
    efficiency: number;
    downtimeMinutes: number;
    averageRpm: number;
    isBest: boolean;
}

export interface IMonthComparisonRow {
    metric: string;
    previousLabel: string;
    currentLabel: string;
    previousValue: string;
    currentValue: string;
    changePercent: number;
    isPositive: boolean;
}

export interface IInsightSegment {
    text: string;
    emphasize?: boolean;
}

export interface IInsight {
    id: string;
    title: string;
    segments: IInsightSegment[];
}

export interface IPerformanceHighlight {
    headline: string;
    supporting: string;
}

export interface IMonthlySummary {
    month: IMonthRef;
    comparisonMonth: IMonthRef;
    kpis: IMonthlyKpis;
    previousKpis: IMonthlyKpis;
    kpiCards: IKpiCard[];
    highlight: IPerformanceHighlight;
    dailyPerformance: IDailyPerformance[];
    dailySummary: IDailySummary;
    downtimeReasons: IDowntimeReason[];
    productionLoss: IProductionLoss;
    topMachines: IMachineSummary[];
    bottomMachines: IMachineSummary[];
    machines: IMachineSummary[];
    shifts: IShiftPerformance[];
    monthComparison: IMonthComparisonRow[];
    insights: IInsight[];
    recommendations: string[];
    longStopsOver10MinPercent: number;
}

export interface IMonthlySummaryRequest {
    year: number;
    month: number;
    compareWith: TCompareMode;
}

export function classifyPerformance(efficiency: number): TPerformanceClass {
    if (efficiency >= 90) return 'excellent';
    if (efficiency >= 80) return 'good';
    if (efficiency >= 70) return 'average';
    return 'needsAttention';
}

export function performanceLabel(performance: TPerformanceClass): string {
    switch (performance) {
        case 'excellent': return 'Excellent';
        case 'good': return 'Good';
        case 'average': return 'Average';
        case 'needsAttention': return 'Needs Attention';
    }
}
