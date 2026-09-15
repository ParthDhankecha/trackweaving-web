import { Component, Input } from '@angular/core';

import { IInsight } from '@src/app/models/monthly-summary.model';


@Component({
    selector: 'app-monthly-insights',
    imports: [],
    templateUrl: './monthly-insights.html',
    styleUrl: './monthly-insights.scss'
})
export class MonthlyInsights {
    @Input({ required: true }) insights: IInsight[] = [];
}
