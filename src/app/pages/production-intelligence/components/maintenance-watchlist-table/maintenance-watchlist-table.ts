import { Component, EventEmitter, Input, Output } from '@angular/core';

import {
    IProductionIntelligenceReport,
    IWatchlistMachine,
    TREND_DAY_OPTIONS,
    TTrendDays
} from '@src/app/models/production-intelligence.model';
import { formatPercent } from '../../../monthly-summary/monthly-summary.utils';
import {
    shortChartDate,
    trendLinePoints,
    watchChange,
    watchChangeIsBad,
    watchCurrent,
    watchNormal
} from '../../production-intelligence.utils';


@Component({
    selector: 'app-maintenance-watchlist-table',
    imports: [],
    templateUrl: './maintenance-watchlist-table.html',
    styleUrl: './maintenance-watchlist-table.scss'
})
export class MaintenanceWatchlistTable {
    @Input({ required: true }) report!: IProductionIntelligenceReport;
    @Input() isLoading = false;
    @Output() trendDaysChange = new EventEmitter<TTrendDays>();
    @Output() viewDetails = new EventEmitter<IWatchlistMachine>();

    protected readonly trendOptions = TREND_DAY_OPTIONS;
    protected readonly formatPercent = formatPercent;
    protected readonly watchCurrent = watchCurrent;
    protected readonly watchNormal = watchNormal;
    protected readonly watchChange = watchChange;
    protected readonly watchChangeIsBad = watchChangeIsBad;
    protected readonly shortChartDate = shortChartDate;
    protected readonly trendLinePoints = trendLinePoints;

    protected showAll = false;
    protected expandedId: string | null = null;

    protected get visibleMachines(): IWatchlistMachine[] {
        return this.showAll
            ? this.report.maintenanceWatchlist.machines
            : this.report.maintenanceWatchlist.machines.slice(0, 5);
    }

    protected get hiddenCount(): number {
        return Math.max(0, this.report.maintenanceWatchlist.machines.length - 5);
    }

    protected onTrendChange(event: Event): void {
        const days = Number((event.target as HTMLSelectElement).value) as TTrendDays;
        if (this.report.trendDays === days || this.isLoading) return;
        this.trendDaysChange.emit(days);
    }

    protected toggleRow(machine: IWatchlistMachine): void {
        this.expandedId = this.expandedId === machine.machineId ? null : machine.machineId;
    }

    protected chartPoints(machine: IWatchlistMachine): { date: string; efficiency: number }[] {
        return machine.trendData || [];
    }
}
