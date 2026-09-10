import { Component, Input } from '@angular/core';

import { IMachineSummary } from '@src/app/models/monthly-summary.model';
import { formatHoursMinutes, formatMeters, formatPercent } from '../../monthly-summary.utils';


@Component({
    selector: 'app-machine-ranking',
    imports: [],
    templateUrl: './machine-ranking.html',
    styleUrl: './machine-ranking.scss'
})
export class MachineRanking {
    @Input({ required: true }) machines: IMachineSummary[] = [];
    @Input() variant: 'top' | 'attention' = 'top';

    protected readonly formatHoursMinutes = formatHoursMinutes;
    protected readonly formatMeters = formatMeters;
    protected readonly formatPercent = formatPercent;

    protected get title(): string {
        return this.variant === 'top' ? 'Top Performing Machines' : 'Machines Requiring Attention';
    }

    protected abs(value: number): number {
        return Math.abs(value);
    }

    protected get subtitle(): string {
        return this.variant === 'top'
            ? 'Highest efficiency this month'
            : 'Lowest efficiency and highest downtime';
    }
}
