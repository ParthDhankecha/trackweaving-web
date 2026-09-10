import { Component, Input } from '@angular/core';

import { IDowntimeReason } from '@src/app/models/monthly-summary.model';
import { formatHoursMinutes, formatPercent } from '../../monthly-summary.utils';


@Component({
    selector: 'app-downtime-analysis',
    imports: [],
    templateUrl: './downtime-analysis.html',
    styleUrl: './downtime-analysis.scss'
})
export class DowntimeAnalysis {
    @Input({ required: true }) reasons: IDowntimeReason[] = [];

    protected readonly formatHoursMinutes = formatHoursMinutes;
    protected readonly formatPercent = formatPercent;
}
