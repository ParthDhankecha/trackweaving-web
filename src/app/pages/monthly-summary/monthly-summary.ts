import { Component, Input } from '@angular/core';

import { IMonthlySummary } from '@src/app/models/monthly-summary.model';

import { SummaryKpiCard } from './components/summary-kpi-card/summary-kpi-card';
import { PerformanceTrendChart } from './components/performance-trend-chart/performance-trend-chart';
import { DowntimeAnalysis } from './components/downtime-analysis/downtime-analysis';
import { ProductionLoss } from './components/production-loss/production-loss';
import { StopReasonTable } from './components/stop-reason-table/stop-reason-table';
import { MachineRanking } from './components/machine-ranking/machine-ranking';
import { MachinePerformanceTable } from './components/machine-performance-table/machine-performance-table';
import { ShiftComparison } from './components/shift-comparison/shift-comparison';
import { MonthlyComparison } from './components/monthly-comparison/monthly-comparison';
import { MonthlyInsights } from './components/monthly-insights/monthly-insights';
import { PriorityActions } from './components/priority-actions/priority-actions';


@Component({
    selector: 'app-monthly-summary',
    imports: [
        SummaryKpiCard,
        PerformanceTrendChart,
        DowntimeAnalysis,
        ProductionLoss,
        StopReasonTable,
        MachineRanking,
        MachinePerformanceTable,
        ShiftComparison,
        MonthlyComparison,
        MonthlyInsights,
        PriorityActions
    ],
    templateUrl: './monthly-summary.html',
    styleUrl: './monthly-summary.scss'
})
export class MonthlySummary {
    @Input() summary: IMonthlySummary | null = null;
    @Input() isLoading = false;
}
