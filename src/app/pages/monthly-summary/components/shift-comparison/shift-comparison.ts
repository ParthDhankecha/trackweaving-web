import { Component, Input } from '@angular/core';

import { IShiftPerformance } from '@src/app/models/monthly-summary.model';
import { formatHoursMinutes, formatMeters, formatPercent } from '../../monthly-summary.utils';


@Component({
    selector: 'app-shift-comparison',
    imports: [],
    templateUrl: './shift-comparison.html',
    styleUrl: './shift-comparison.scss'
})
export class ShiftComparison {
    @Input({ required: true }) shifts: IShiftPerformance[] = [];

    protected readonly formatHoursMinutes = formatHoursMinutes;
    protected readonly formatMeters = formatMeters;
    protected readonly formatPercent = formatPercent;

    protected barWidth(value: number, key: 'productionMeters' | 'efficiency' | 'downtimeMinutes'): number {
        const max = Math.max(...this.shifts.map((shift) => shift[key]), 1);
        return (value / max) * 100;
    }
}
