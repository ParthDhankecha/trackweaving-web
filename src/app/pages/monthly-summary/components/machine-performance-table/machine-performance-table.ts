import { Component, Input, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
    IMachineSummary,
    PERFORMANCE_FILTERS,
    TPerformanceClass,
    performanceLabel
} from '@src/app/models/monthly-summary.model';
import { formatHoursMinutes, formatMeters, formatPercent } from '../../monthly-summary.utils';


type TSortKey = 'name' | 'productionMeters' | 'efficiency' | 'averageRpm' | 'runningTimeMinutes' | 'downtimeMinutes' | 'topStopReason' | 'performance';

@Component({
    selector: 'app-machine-performance-table',
    imports: [FormsModule],
    templateUrl: './machine-performance-table.html',
    styleUrl: './machine-performance-table.scss'
})
export class MachinePerformanceTable implements OnChanges {
    @Input({ required: true }) machines: IMachineSummary[] = [];

    protected readonly filters = PERFORMANCE_FILTERS;
    protected readonly formatHoursMinutes = formatHoursMinutes;
    protected readonly formatMeters = formatMeters;
    protected readonly formatPercent = formatPercent;
    protected readonly performanceLabel = performanceLabel;

    protected searchTerm = '';
    protected activeFilter: TPerformanceClass | 'all' = 'all';
    protected sortKey: TSortKey = 'efficiency';
    protected sortDir: 'asc' | 'desc' = 'desc';
    protected visibleMachines: IMachineSummary[] = [];

    ngOnChanges(): void {
        this.apply();
    }

    protected onSearch(term: string): void {
        this.searchTerm = term;
        this.apply();
    }

    protected onFilter(filter: TPerformanceClass | 'all'): void {
        this.activeFilter = filter;
        this.apply();
    }

    protected onSort(key: TSortKey): void {
        if (this.sortKey === key) {
            this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortKey = key;
            this.sortDir = key === 'name' || key === 'topStopReason' || key === 'performance' ? 'asc' : 'desc';
        }
        this.apply();
    }

    protected sortMark(key: TSortKey): string {
        if (this.sortKey !== key) return '';
        return this.sortDir === 'asc' ? '↑' : '↓';
    }

    private apply(): void {
        const query = this.searchTerm.trim().toLowerCase();
        const filtered = this.machines.filter((machine) => {
            const matchesFilter = this.activeFilter === 'all' || machine.performance === this.activeFilter;
            const matchesSearch = !query || machine.name.toLowerCase().includes(query);
            return matchesFilter && matchesSearch;
        });

        const direction = this.sortDir === 'asc' ? 1 : -1;
        this.visibleMachines = [...filtered].sort((a, b) => {
            const left = a[this.sortKey];
            const right = b[this.sortKey];
            if (typeof left === 'number' && typeof right === 'number') {
                return (left - right) * direction;
            }
            return String(left).localeCompare(String(right)) * direction;
        });
    }
}
