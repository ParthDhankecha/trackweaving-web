import { Component, Input } from '@angular/core';

import { IMonthComparisonRow } from '@src/app/models/monthly-summary.model';
import { formatChangeLabel } from '../../monthly-summary.utils';


@Component({
    selector: 'app-monthly-comparison',
    imports: [],
    templateUrl: './monthly-comparison.html',
    styleUrl: './monthly-comparison.scss'
})
export class MonthlyComparison {
    @Input({ required: true }) rows: IMonthComparisonRow[] = [];

    protected readonly formatChangeLabel = formatChangeLabel;

    protected get previousLabel(): string {
        return this.rows[0]?.previousLabel ?? 'Previous';
    }

    protected get currentLabel(): string {
        return this.rows[0]?.currentLabel ?? 'Current';
    }

    protected get subtitle(): string {
        return this.rows.some((row) => row.metric.includes('avg/day'))
            ? 'Current month uses daily averages so elapsed days are not compared against a full previous month'
            : 'Month-on-month movement across the metrics that matter';
    }
}
