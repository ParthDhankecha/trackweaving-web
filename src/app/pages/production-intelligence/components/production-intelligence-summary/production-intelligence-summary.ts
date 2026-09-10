import { Component, Input } from '@angular/core';

import { IProductionIntelligenceReport } from '@src/app/models/production-intelligence.model';
import { formatHoursMinutes, formatMeters, formatPercent } from '../../../monthly-summary/monthly-summary.utils';


@Component({
    selector: 'app-production-intelligence-summary',
    imports: [],
    templateUrl: './production-intelligence-summary.html',
    styleUrl: './production-intelligence-summary.scss'
})
export class ProductionIntelligenceSummary {
    @Input({ required: true }) report!: IProductionIntelligenceReport;

    protected readonly formatMeters = formatMeters;
    protected readonly formatPercent = formatPercent;
    protected readonly formatHoursMinutes = formatHoursMinutes;

    protected get attentionTone(): 'ok' | 'warning' | 'critical' {
        if (!this.report.summary.machinesNeedingAction) return 'ok';
        return this.report.priorityMachines.some(machine => machine.severity === 'critical')
            ? 'critical'
            : 'warning';
    }
}
