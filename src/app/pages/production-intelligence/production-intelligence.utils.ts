import {
    IPriorityMachine,
    IProductionIntelligenceReport,
    IWatchlistMachine
} from '@src/app/models/production-intelligence.model';
import { formatMeters, formatPercent } from '../monthly-summary/monthly-summary.utils';

export interface IActionCard {
    title: string;
    lines: string[];
}

export function mainStopReason(machine: IPriorityMachine): string {
    return machine.stopReasons?.[0]?.reason || machine.primaryIssue || '—';
}

export function shortActionIssue(machine: IPriorityMachine): string {
    const issue = machine.primaryIssue || '';
    if (/stop/i.test(issue)) return 'repeated stops';
    if (/efficien/i.test(issue)) return 'low efficiency';
    if (/downtime/i.test(issue)) return 'long downtime';
    if (/speed/i.test(issue)) return 'low speed';
    if (/loss/i.test(issue)) return 'production loss';
    return issue.replace(/^Repeated /i, '').toLowerCase() || 'this issue';
}

export function watchCurrent(machine: IWatchlistMachine): string {
    if (machine.comparisonCurrent) return machine.comparisonCurrent;
    if (machine.hasValidCurrent === false || !(machine.currentEfficiency > 0)) return 'No production data';
    return machine.currentValue;
}

export function watchNormal(machine: IWatchlistMachine): string {
    return machine.comparisonNormal || machine.historicalAverage || '—';
}

export function watchChange(machine: IWatchlistMachine): string {
    if (machine.comparisonChange) return machine.comparisonChange;
    if (machine.hasValidCurrent === false || !(machine.currentEfficiency > 0)) return '—';
    const gap = Math.abs(machine.percentageChange || 0);
    if (!gap) return 'in line with normal';
    return `${gap.toFixed(1)} pp ${(machine.percentageChange || 0) < 0 ? 'below' : 'above'} normal`;
}

export function watchChangeIsBad(machine: IWatchlistMachine): boolean {
    if (typeof machine.changeIsBad === 'boolean') return machine.changeIsBad;
    return (machine.percentageChange || 0) < 0;
}

export function shortChartDate(value: string): string {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function trendLinePoints(points: { efficiency: number }[], width = 360, height = 88): string {
    const usable = points.filter(point => point.efficiency > 0);
    if (!usable.length) return '';
    const step = usable.length > 1 ? width / (usable.length - 1) : width;
    return usable.map((point, index) => {
        const x = index * step;
        const y = height - ((Math.min(100, Math.max(0, point.efficiency)) / 100) * height);
        return `${x},${y}`;
    }).join(' ');
}

function machineActionLine(machine: IPriorityMachine): string {
    const parts: string[] = [];
    if (machine.totalStops) {
        const ratio = machine.stopFrequencyRatio || 0;
        parts.push(ratio >= 1.3
            ? `${machine.totalStops} stops, ${ratio.toFixed(1)}× selected average`
            : `${machine.totalStops} stops`);
    }
    if (/efficien/i.test(machine.primaryIssue) && machine.history30Average?.efficiency) {
        parts.push(`${formatPercent(machine.efficiency)} efficiency versus ${formatPercent(machine.history30Average.efficiency)} normal`);
    }
    if (machine.estimatedProductionLoss) {
        parts.push(`~${formatMeters(machine.estimatedProductionLoss)} loss`);
    }
    return `${parts.join(', ')}.`;
}

export function rankedPriorityMachines(report: IProductionIntelligenceReport): IPriorityMachine[] {
    return [...report.priorityMachines].sort((a, b) =>
        b.estimatedProductionLoss - a.estimatedProductionLoss
        || b.priorityScore - a.priorityScore
    );
}

export function buildActionCards(report: IProductionIntelligenceReport): IActionCard[] {
    const cards: IActionCard[] = [];
    const usedIds = new Set<string>();
    const ranked = rankedPriorityMachines(report);
    const first = ranked[0];
    if (first) {
        usedIds.add(first.machineId);
        cards.push({
            title: `Check ${first.machineName} ${shortActionIssue(first)}`,
            lines: [machineActionLine(first)]
        });
    }

    const second = ranked.find(machine => !usedIds.has(machine.machineId));
    if (second) {
        usedIds.add(second.machineId);
        cards.push({
            title: `Check ${second.machineName} ${shortActionIssue(second)}`,
            lines: [machineActionLine(second)]
        });
    } else {
        const watch = report.maintenanceWatchlist.machines.find(machine => !usedIds.has(machine.machineId));
        if (watch) {
            usedIds.add(watch.machineId);
            cards.push({
                title: `Inspect ${watch.machineName}`,
                lines: [watch.explanation]
            });
        }
    }

    const reason = report.stopReasonLosses[0];
    if (reason) {
        cards.push({
            title: `Focus on ${reason.reason}`,
            lines: [
                `${reason.durationMinutes} min downtime, ~${formatMeters(reason.estimatedLossMeters)} estimated loss.`
            ]
        });
    }

    return cards.slice(0, 3);
}
