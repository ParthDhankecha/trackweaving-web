import { Component, EventEmitter, Input, Output } from '@angular/core';

import { IPriorityMachine, IProductionIntelligenceReport } from '@src/app/models/production-intelligence.model';
import { formatMeters, formatPercent } from '../../../monthly-summary/monthly-summary.utils';
import { mainStopReason, rankedPriorityMachines } from '../../production-intelligence.utils';


@Component({
    selector: 'app-priority-machines',
    imports: [],
    templateUrl: './priority-machines.html',
    styleUrl: './priority-machines.scss'
})
export class PriorityMachines {
    @Input({ required: true }) report!: IProductionIntelligenceReport;
    @Output() viewDetails = new EventEmitter<IPriorityMachine>();

    protected showAll = false;
    protected readonly formatMeters = formatMeters;
    protected readonly formatPercent = formatPercent;
    protected readonly mainStopReason = mainStopReason;

    protected get insight(): string {
        const top = this.rankedMachines.filter(machine => machine.estimatedProductionLoss > 0).slice(0, 2);
        const total = this.report.summary.estimatedProductionLoss;
        if (!top.length || !total) return this.report.productionOpportunity?.headline || '';
        const share = Math.round((top.reduce((sum, machine) => sum + machine.estimatedProductionLoss, 0) / total) * 100);
        if (top.length === 2) {
            return `${top[0].machineName} and ${top[1].machineName} contributed ${share}% of estimated production loss. Start with these two machines.`;
        }
        return `${top[0].machineName} contributed ${share}% of estimated production loss. Start with this machine.`;
    }

    protected get rankedMachines(): IPriorityMachine[] {
        return rankedPriorityMachines(this.report);
    }

    protected get visibleMachines(): IPriorityMachine[] {
        return this.showAll ? this.rankedMachines : this.rankedMachines.slice(0, 3);
    }

    protected get hiddenCount(): number {
        return Math.max(0, this.rankedMachines.length - 3);
    }
}
