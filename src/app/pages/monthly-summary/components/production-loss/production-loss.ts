import { Component, Input } from '@angular/core';

import { IProductionLoss } from '@src/app/models/monthly-summary.model';
import { formatHoursMinutes, formatMeters, formatPercent } from '../../monthly-summary.utils';


@Component({
    selector: 'app-production-loss',
    imports: [],
    templateUrl: './production-loss.html',
    styleUrl: './production-loss.scss'
})
export class ProductionLoss {
    @Input({ required: true }) loss!: IProductionLoss;

    protected readonly formatHoursMinutes = formatHoursMinutes;
    protected readonly formatMeters = formatMeters;
    protected readonly formatPercent = formatPercent;
}
