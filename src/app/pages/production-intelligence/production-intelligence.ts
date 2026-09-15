import { Component, EventEmitter, Input, Output } from '@angular/core';

import {
    IPriorityMachine,
    IProductionIntelligenceReport,
    IWatchlistMachine,
    TTrendDays
} from '@src/app/models/production-intelligence.model';
import { formatHoursMinutes, formatMeters, formatPercent } from '../monthly-summary/monthly-summary.utils';
import { ProductionIntelligenceSummary } from './components/production-intelligence-summary/production-intelligence-summary';
import { PriorityMachines } from './components/priority-machines/priority-machines';
import { MaintenanceWatchlistTable } from './components/maintenance-watchlist-table/maintenance-watchlist-table';
import { ProductionLossAnalysis } from './components/production-loss-analysis/production-loss-analysis';
import { RecommendedActions } from './components/recommended-actions/recommended-actions';


@Component({
    selector: 'app-production-intelligence',
    imports: [
        ProductionIntelligenceSummary,
        PriorityMachines,
        MaintenanceWatchlistTable,
        ProductionLossAnalysis,
        RecommendedActions
    ],
    templateUrl: './production-intelligence.html',
    styleUrl: './production-intelligence.scss'
})
export class ProductionIntelligenceReport {
    @Input() report: IProductionIntelligenceReport | null = null;
    @Input() isLoading = false;
    @Output() trendDaysChange = new EventEmitter<TTrendDays>();

    protected readonly formatMeters = formatMeters;
    protected readonly formatPercent = formatPercent;
    protected readonly formatHoursMinutes = formatHoursMinutes;
    protected detailMachine: IPriorityMachine | IWatchlistMachine | null = null;

    protected openDetails(machine: IPriorityMachine | IWatchlistMachine): void {
        this.detailMachine = machine;
    }

    protected closeDetails(): void {
        this.detailMachine = null;
    }

    protected isPriority(machine: IPriorityMachine | IWatchlistMachine | null): machine is IPriorityMachine {
        return !!machine && 'priorityScore' in machine;
    }

    protected asWatchlist(machine: IPriorityMachine | IWatchlistMachine | null): IWatchlistMachine | null {
        return machine && !this.isPriority(machine) ? machine : null;
    }
}
