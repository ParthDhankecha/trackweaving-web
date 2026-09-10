import { Component, Input } from '@angular/core';

import { IDowntimeReason } from '@src/app/models/monthly-summary.model';
import { formatHoursMinutes, formatMeters, formatMinutesSeconds, formatPercent } from '../../monthly-summary.utils';


@Component({
    selector: 'app-stop-reason-table',
    imports: [],
    templateUrl: './stop-reason-table.html',
    styleUrl: './stop-reason-table.scss'
})
export class StopReasonTable {
    @Input({ required: true }) reasons: IDowntimeReason[] = [];

    protected readonly formatHoursMinutes = formatHoursMinutes;
    protected readonly formatMeters = formatMeters;
    protected readonly formatMinutesSeconds = formatMinutesSeconds;
    protected readonly formatPercent = formatPercent;
}
