import { Component, Input } from '@angular/core';

import { IProductionIntelligenceReport } from '@src/app/models/production-intelligence.model';
import { buildActionCards, IActionCard } from '../../production-intelligence.utils';


@Component({
    selector: 'app-recommended-actions',
    imports: [],
    templateUrl: './recommended-actions.html',
    styleUrl: './recommended-actions.scss'
})
export class RecommendedActions {
    @Input({ required: true }) report!: IProductionIntelligenceReport;

    protected get cards(): IActionCard[] {
        return buildActionCards(this.report);
    }
}
