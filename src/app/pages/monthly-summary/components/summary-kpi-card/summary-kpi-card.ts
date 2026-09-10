import { Component, Input } from '@angular/core';

import { IKpiCard } from '@src/app/models/monthly-summary.model';


@Component({
    selector: 'app-summary-kpi-card',
    imports: [],
    templateUrl: './summary-kpi-card.html',
    styleUrl: './summary-kpi-card.scss'
})
export class SummaryKpiCard {
    @Input({ required: true }) card!: IKpiCard;
}
