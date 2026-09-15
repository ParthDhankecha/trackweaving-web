import { Component, Input } from '@angular/core';

import { ILossRow, IProductionIntelligenceReport, IStopReasonLoss } from '@src/app/models/production-intelligence.model';
import { formatMeters } from '../../../monthly-summary/monthly-summary.utils';


@Component({
    selector: 'app-production-loss-analysis',
    imports: [],
    templateUrl: './production-loss-analysis.html',
    styleUrl: './production-loss-analysis.scss'
})
export class ProductionLossAnalysis {
    @Input({ required: true }) report!: IProductionIntelligenceReport;

    protected showAll = false;
    protected readonly formatMeters = formatMeters;

    protected get machines(): ILossRow[] {
        return this.showAll
            ? this.report.productionLossBreakdown.rows
            : this.report.productionLossBreakdown.rows.slice(0, 5);
    }

    protected get reasons(): IStopReasonLoss[] {
        const rows = [...this.report.stopReasonLosses].sort((a, b) =>
            (b.estimatedLossMeters || b.durationMinutes) - (a.estimatedLossMeters || a.durationMinutes)
        );
        return rows.slice(0, 4);
    }

    protected get hiddenCount(): number {
        return Math.max(0, this.report.productionLossBreakdown.rows.length - 5);
    }

    protected machineBar(value: number): number {
        const max = this.report.productionLossBreakdown.rows[0]?.estimatedLossMeters || 1;
        return Math.max(8, Math.round((value / max) * 100));
    }

    protected reasonBar(reason: IStopReasonLoss): number {
        const first = this.reasons[0];
        const max = first?.estimatedLossMeters || first?.durationMinutes || 1;
        const value = reason.estimatedLossMeters || reason.durationMinutes;
        return Math.max(8, Math.round((value / max) * 100));
    }
}
