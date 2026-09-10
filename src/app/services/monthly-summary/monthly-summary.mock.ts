import {
    classifyPerformance,
    IDailyPerformance,
    IDowntimeReason,
    IInsight,
    IKpiCard,
    IMachineSummary,
    IMonthComparisonRow,
    IMonthlyKpis,
    IMonthlySummary,
    IShiftPerformance
} from '@src/app/models/monthly-summary.model';
import {
    daysInMonth,
    formatChangeLabel,
    formatHoursMinutes,
    formatMeters,
    formatPercent,
    formatPicksCompact,
    monthLabel,
    percentChange,
    previousMonth,
    seededRandom
} from '@src/app/pages/monthly-summary/monthly-summary.utils';

const CANONICAL = { year: 2026, month: 8 };

const STOP_REASONS = ['Weft Stop', 'Warp Stop', 'Feeder Stop', 'Other / Manual', 'Machine Error'] as const;

interface IMachineSeed {
    name: string;
    efficiency: number;
    rpm: number;
    downtimeMinutes: number;
    topStopReason: string;
}

const MACHINE_SEEDS: IMachineSeed[] = [
    { name: 'Loom 08', efficiency: 95.4, rpm: 618, downtimeMinutes: 250, topStopReason: 'Warp Stop' },
    { name: 'Loom 03', efficiency: 94.2, rpm: 612, downtimeMinutes: 320, topStopReason: 'Feeder Stop' },
    { name: 'Loom 12', efficiency: 93.8, rpm: 610, downtimeMinutes: 365, topStopReason: 'Warp Stop' },
    { name: 'Loom 21', efficiency: 92.6, rpm: 608, downtimeMinutes: 460, topStopReason: 'Weft Stop' },
    { name: 'Loom 05', efficiency: 91.8, rpm: 605, downtimeMinutes: 495, topStopReason: 'Feeder Stop' },
    { name: 'Loom 14', efficiency: 91.2, rpm: 604, downtimeMinutes: 520, topStopReason: 'Warp Stop' },
    { name: 'Loom 02', efficiency: 90.6, rpm: 601, downtimeMinutes: 545, topStopReason: 'Weft Stop' },
    { name: 'Loom 19', efficiency: 90.1, rpm: 599, downtimeMinutes: 570, topStopReason: 'Other / Manual' },
    { name: 'Loom 11', efficiency: 89.4, rpm: 598, downtimeMinutes: 610, topStopReason: 'Weft Stop' },
    { name: 'Loom 07', efficiency: 88.9, rpm: 596, downtimeMinutes: 640, topStopReason: 'Feeder Stop' },
    { name: 'Loom 26', efficiency: 88.5, rpm: 595, downtimeMinutes: 665, topStopReason: 'Warp Stop' },
    { name: 'Loom 01', efficiency: 88.1, rpm: 594, downtimeMinutes: 690, topStopReason: 'Weft Stop' },
    { name: 'Loom 16', efficiency: 87.7, rpm: 593, downtimeMinutes: 720, topStopReason: 'Feeder Stop' },
    { name: 'Loom 22', efficiency: 87.4, rpm: 592, downtimeMinutes: 745, topStopReason: 'Warp Stop' },
    { name: 'Loom 09', efficiency: 86.8, rpm: 591, downtimeMinutes: 780, topStopReason: 'Weft Stop' },
    { name: 'Loom 28', efficiency: 86.2, rpm: 589, downtimeMinutes: 810, topStopReason: 'Other / Manual' },
    { name: 'Loom 04', efficiency: 85.6, rpm: 588, downtimeMinutes: 850, topStopReason: 'Weft Stop' },
    { name: 'Loom 13', efficiency: 84.9, rpm: 586, downtimeMinutes: 890, topStopReason: 'Feeder Stop' },
    { name: 'Loom 20', efficiency: 84.1, rpm: 584, downtimeMinutes: 940, topStopReason: 'Warp Stop' },
    { name: 'Loom 06', efficiency: 83.4, rpm: 582, downtimeMinutes: 990, topStopReason: 'Weft Stop' },
    { name: 'Loom 25', efficiency: 82.6, rpm: 580, downtimeMinutes: 1040, topStopReason: 'Feeder Stop' },
    { name: 'Loom 15', efficiency: 81.2, rpm: 576, downtimeMinutes: 1120, topStopReason: 'Weft Stop' },
    { name: 'Loom 10', efficiency: 79.8, rpm: 572, downtimeMinutes: 1210, topStopReason: 'Warp Stop' },
    { name: 'Loom 23', efficiency: 78.4, rpm: 568, downtimeMinutes: 1320, topStopReason: 'Weft Stop' },
    { name: 'Loom 18', efficiency: 76.9, rpm: 564, downtimeMinutes: 1440, topStopReason: 'Feeder Stop' },
    { name: 'Loom 27', efficiency: 75.2, rpm: 558, downtimeMinutes: 1580, topStopReason: 'Other / Manual' },
    { name: 'Loom 30', efficiency: 73.6, rpm: 552, downtimeMinutes: 1710, topStopReason: 'Warp Stop' },
    { name: 'Loom 29', efficiency: 71.4, rpm: 546, downtimeMinutes: 1880, topStopReason: 'Weft Stop' },
    { name: 'Loom 24', efficiency: 69.1, rpm: 538, downtimeMinutes: 2200, topStopReason: 'Weft Stop' },
    { name: 'Loom 31', efficiency: 68.8, rpm: 536, downtimeMinutes: 2260, topStopReason: 'Weft Stop' },
    { name: 'Loom 17', efficiency: 68.4, rpm: 534, downtimeMinutes: 2355, topStopReason: 'Weft Stop' }
];

function scaleKpis(base: IMonthlyKpis, factor: number): IMonthlyKpis {
    return {
        totalProductionMeters: Math.round(base.totalProductionMeters * factor),
        overallEfficiency: Number((base.overallEfficiency * (0.96 + factor * 0.04)).toFixed(1)),
        totalPicks: Math.round(base.totalPicks * factor),
        totalDowntimeMinutes: Math.round(base.totalDowntimeMinutes / factor),
        averageRpm: Math.round(base.averageRpm * (0.985 + factor * 0.015)),
        runningTimeHours: Math.round(base.runningTimeHours * factor),
        utilizationPercent: Number((base.utilizationPercent * (0.97 + factor * 0.03)).toFixed(1))
    };
}

function buildKpis(year: number, month: number): { current: IMonthlyKpis; previous: IMonthlyKpis } {
    const current: IMonthlyKpis = {
        totalProductionMeters: 517420,
        overallEfficiency: 87.8,
        totalPicks: 48200000,
        totalDowntimeMinutes: 428 * 60 + 35,
        averageRpm: 592,
        runningTimeHours: 6284,
        utilizationPercent: 85.7
    };
    const previous: IMonthlyKpis = {
        totalProductionMeters: 485000,
        overallEfficiency: 84.2,
        totalPicks: 45820000,
        totalDowntimeMinutes: 510 * 60,
        averageRpm: 584,
        runningTimeHours: 5980,
        utilizationPercent: 81.4
    };

    if (year === CANONICAL.year && month === CANONICAL.month) {
        return { current, previous };
    }

    const seed = year * 12 + month;
    const rand = seededRandom(seed);
    const factor = 0.92 + rand() * 0.12;
    return {
        current: scaleKpis(current, factor),
        previous: scaleKpis(previous, factor * (0.94 + rand() * 0.04))
    };
}

function buildDailyPerformance(
    year: number,
    month: number,
    totalProduction: number,
    avgEfficiency: number,
    avgRpm: number,
    totalDowntimeMinutes: number
): IDailyPerformance[] {
    const days = daysInMonth(year, month);
    const rand = seededRandom(year * 100 + month * 7);
    const weights: number[] = [];

    for (let day = 1; day <= days; day++) {
        const weekday = new Date(year, month - 1, day).getDay();
        const weekendDip = weekday === 0 ? 0.82 : weekday === 6 ? 0.9 : 1;
        let weight = (0.86 + rand() * 0.28) * weekendDip;
        if (year === CANONICAL.year && month === CANONICAL.month) {
            if (day === 18) weight = 1.35;
            if (day === 11) weight = 0.72;
        }
        weights.push(weight);
    }

    const weightSum = weights.reduce((sum, value) => sum + value, 0);
    const daysData = weights.map((weight, index) => {
        const day = index + 1;
        const productionMeters = Math.round(totalProduction * (weight / weightSum));
        const efficiency = Number((avgEfficiency + (weight - 1) * 10 + (rand() - 0.5) * 2).toFixed(1));
        const averageRpm = Math.round(avgRpm + (weight - 1) * 18 + (rand() - 0.5) * 6);
        const downtimeMinutes = Math.round(totalDowntimeMinutes * ((2 - weight) / days) * (0.85 + rand() * 0.3));
        return {
            date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            day,
            productionMeters,
            efficiency: Math.min(98, Math.max(68, efficiency)),
            averageRpm: Math.min(640, Math.max(500, averageRpm)),
            downtimeMinutes: Math.max(180, downtimeMinutes)
        };
    });

    if (year === CANONICAL.year && month === CANONICAL.month) {
        const best = daysData.find((item) => item.day === 18);
        const lowest = daysData.find((item) => item.day === 11);
        if (best) best.productionMeters = 19850;
        if (lowest) lowest.productionMeters = 12420;
        const locked = (best?.productionMeters ?? 0) + (lowest?.productionMeters ?? 0);
        const others = daysData.filter((item) => item.day !== 18 && item.day !== 11);
        const remaining = totalProduction - locked;
        const otherSum = others.reduce((sum, item) => sum + item.productionMeters, 0);
        others.forEach((item) => {
            item.productionMeters = Math.round(item.productionMeters * (remaining / otherSum));
        });
        const drift = totalProduction - daysData.reduce((sum, item) => sum + item.productionMeters, 0);
        daysData[daysData.length - 1].productionMeters += drift;
    }

    return daysData;
}

function buildDowntimeReasons(totalDowntimeMinutes: number, totalLossMeters: number): IDowntimeReason[] {
    const shares = [
        { reason: 'Weft Stop', percent: 42, occurrences: 4215, avgStopSeconds: 155, lossShare: 0.416 },
        { reason: 'Warp Stop', percent: 24, occurrences: 2870, avgStopSeconds: 129, lossShare: 0.232 },
        { reason: 'Feeder Stop', percent: 18, occurrences: 1950, avgStopSeconds: 140, lossShare: 0.171 },
        { reason: 'Other / Manual', percent: 11, occurrences: 820, avgStopSeconds: 211, lossShare: 0.109 },
        { reason: 'Machine Error', percent: 5, occurrences: 215, avgStopSeconds: 318, lossShare: 0.072 }
    ];

    return shares.map((item) => ({
        reason: item.reason,
        occurrences: item.occurrences,
        durationMinutes: Math.round(totalDowntimeMinutes * (item.percent / 100)),
        avgStopSeconds: item.avgStopSeconds,
        downtimePercent: item.percent,
        estimatedLossMeters: Math.round(totalLossMeters * item.lossShare)
    }));
}

function buildMachines(
    totalProduction: number,
    factoryEfficiency: number,
    year: number,
    month: number
): IMachineSummary[] {
    const rand = seededRandom(year * 31 + month);
    const factor = year === CANONICAL.year && month === CANONICAL.month
        ? 1
        : 0.93 + rand() * 0.1;

    const weighted = MACHINE_SEEDS.map((seed) => ({
        ...seed,
        efficiency: Number((seed.efficiency * (0.99 + (factor - 1) * 0.4)).toFixed(1)),
        downtimeMinutes: Math.round(seed.downtimeMinutes / factor),
        rpm: Math.round(seed.rpm * (0.99 + (factor - 1) * 0.3))
    }));

    const weightSum = weighted.reduce((sum, item) => sum + item.efficiency, 0);
    const machines: IMachineSummary[] = weighted.map((seed, index) => {
        const efficiency = Math.min(97.5, Math.max(62, seed.efficiency));
        const vsAverage = Number((((efficiency - factoryEfficiency) / factoryEfficiency) * 100).toFixed(1));
        return {
            id: `loom-${index + 1}`,
            name: seed.name,
            productionMeters: Math.round(totalProduction * (seed.efficiency / weightSum)),
            efficiency,
            averageRpm: seed.rpm,
            runningTimeMinutes: Math.round((28 * 24 * 60) * (efficiency / 100)),
            downtimeMinutes: seed.downtimeMinutes,
            topStopReason: seed.topStopReason,
            performance: classifyPerformance(efficiency),
            majorIssue: efficiency < 75 ? seed.topStopReason : undefined,
            vsFactoryAveragePercent: vsAverage
        };
    });

    const drift = totalProduction - machines.reduce((sum, item) => sum + item.productionMeters, 0);
    machines[0].productionMeters += drift;
    return machines;
}

function buildShifts(totalProduction: number, year: number, month: number): IShiftPerformance[] {
    const isCanonical = year === CANONICAL.year && month === CANONICAL.month;
    const rows: IShiftPerformance[] = [
        {
            id: 'A',
            name: 'Shift A',
            productionMeters: isCanonical ? 182450 : Math.round(totalProduction * 0.353),
            efficiency: 91.4,
            downtimeMinutes: 118 * 60,
            averageRpm: 598,
            isBest: true
        },
        {
            id: 'B',
            name: 'Shift B',
            productionMeters: isCanonical ? 174120 : Math.round(totalProduction * 0.336),
            efficiency: 87.9,
            downtimeMinutes: 139 * 60,
            averageRpm: 593,
            isBest: false
        },
        {
            id: 'C',
            name: 'Shift C',
            productionMeters: isCanonical ? 160850 : Math.round(totalProduction * 0.311),
            efficiency: 83.6,
            downtimeMinutes: 171 * 60,
            averageRpm: 585,
            isBest: false
        }
    ];

    if (!isCanonical) {
        const drift = totalProduction - rows.reduce((sum, item) => sum + item.productionMeters, 0);
        rows[0].productionMeters += drift;
    }

    return rows;
}

function buildKpiCards(current: IMonthlyKpis, previous: IMonthlyKpis): IKpiCard[] {
    const productionChange = percentChange(current.totalProductionMeters, previous.totalProductionMeters);
    const efficiencyChange = current.overallEfficiency - previous.overallEfficiency;
    const picksChange = percentChange(current.totalPicks, previous.totalPicks);
    const downtimeChange = percentChange(current.totalDowntimeMinutes, previous.totalDowntimeMinutes);
    const rpmChange = percentChange(current.averageRpm, previous.averageRpm);

    return [
        {
            key: 'production',
            label: 'Total Production',
            value: formatMeters(current.totalProductionMeters),
            icon: 'production',
            comparison: {
                percentChange: productionChange,
                isPositive: productionChange >= 0,
                label: `${formatChangeLabel(productionChange)} vs last month`
            }
        },
        {
            key: 'efficiency',
            label: 'Overall Efficiency',
            value: formatPercent(current.overallEfficiency),
            icon: 'efficiency',
            comparison: {
                percentChange: efficiencyChange,
                isPositive: efficiencyChange >= 0,
                label: formatChangeLabel(efficiencyChange)
            }
        },
        {
            key: 'picks',
            label: 'Total Picks',
            value: formatPicksCompact(current.totalPicks),
            icon: 'picks',
            comparison: {
                percentChange: picksChange,
                isPositive: picksChange >= 0,
                label: formatChangeLabel(picksChange)
            }
        },
        {
            key: 'downtime',
            label: 'Total Downtime',
            value: formatHoursMinutes(current.totalDowntimeMinutes),
            icon: 'downtime',
            comparison: {
                percentChange: downtimeChange,
                isPositive: downtimeChange <= 0,
                label: formatChangeLabel(downtimeChange)
            }
        },
        {
            key: 'rpm',
            label: 'Average RPM',
            value: `${current.averageRpm} RPM`,
            icon: 'rpm',
            comparison: {
                percentChange: rpmChange,
                isPositive: rpmChange >= 0,
                label: formatChangeLabel(rpmChange)
            }
        },
        {
            key: 'runtime',
            label: 'Running Time',
            value: formatHoursMinutes(current.runningTimeHours * 60),
            icon: 'runtime',
            subtitle: `${formatPercent(current.utilizationPercent)} utilization`
        }
    ];
}

function buildComparisonRows(
    current: IMonthlyKpis,
    previous: IMonthlyKpis,
    currentLoss: number,
    previousLoss: number,
    currentMonth: { year: number; month: number },
    compareMonth: { year: number; month: number }
): IMonthComparisonRow[] {
    const productionChange = percentChange(current.totalProductionMeters, previous.totalProductionMeters);
    const efficiencyChange = current.overallEfficiency - previous.overallEfficiency;
    const downtimeChange = percentChange(current.totalDowntimeMinutes, previous.totalDowntimeMinutes);
    const rpmChange = percentChange(current.averageRpm, previous.averageRpm);
    const lossChange = percentChange(currentLoss, previousLoss);

    return [
        {
            metric: 'Production',
            previousLabel: monthLabel(compareMonth.year, compareMonth.month),
            currentLabel: monthLabel(currentMonth.year, currentMonth.month),
            previousValue: formatMeters(previous.totalProductionMeters),
            currentValue: formatMeters(current.totalProductionMeters),
            changePercent: productionChange,
            isPositive: productionChange >= 0
        },
        {
            metric: 'Efficiency',
            previousLabel: monthLabel(compareMonth.year, compareMonth.month),
            currentLabel: monthLabel(currentMonth.year, currentMonth.month),
            previousValue: formatPercent(previous.overallEfficiency),
            currentValue: formatPercent(current.overallEfficiency),
            changePercent: efficiencyChange,
            isPositive: efficiencyChange >= 0
        },
        {
            metric: 'Downtime',
            previousLabel: monthLabel(compareMonth.year, compareMonth.month),
            currentLabel: monthLabel(currentMonth.year, currentMonth.month),
            previousValue: formatHoursMinutes(previous.totalDowntimeMinutes),
            currentValue: formatHoursMinutes(current.totalDowntimeMinutes),
            changePercent: downtimeChange,
            isPositive: downtimeChange <= 0
        },
        {
            metric: 'Average RPM',
            previousLabel: monthLabel(compareMonth.year, compareMonth.month),
            currentLabel: monthLabel(currentMonth.year, currentMonth.month),
            previousValue: String(previous.averageRpm),
            currentValue: String(current.averageRpm),
            changePercent: rpmChange,
            isPositive: rpmChange >= 0
        },
        {
            metric: 'Production Loss',
            previousLabel: monthLabel(compareMonth.year, compareMonth.month),
            currentLabel: monthLabel(currentMonth.year, currentMonth.month),
            previousValue: formatMeters(previousLoss),
            currentValue: formatMeters(currentLoss),
            changePercent: lossChange,
            isPositive: lossChange <= 0
        }
    ];
}

function buildHighlightSupport(current: IMonthlyKpis, previous: IMonthlyKpis): string {
    const productionChange = percentChange(current.totalProductionMeters, previous.totalProductionMeters);
    const downtimeChange = percentChange(current.totalDowntimeMinutes, previous.totalDowntimeMinutes);
    const productionText = productionChange >= 0
        ? `Production increased by ${formatPercent(productionChange)}`
        : `Production decreased by ${formatPercent(Math.abs(productionChange))}`;
    const downtimeText = downtimeChange <= 0
        ? `downtime reduced by ${formatPercent(Math.abs(downtimeChange))}`
        : `downtime increased by ${formatPercent(downtimeChange)}`;
    return `${productionText} while ${downtimeText} compared to last month.`;
}

function buildInsights(
    current: IMonthlyKpis,
    previous: IMonthlyKpis,
    reasons: IDowntimeReason[],
    bottomMachines: IMachineSummary[],
    shifts: IShiftPerformance[],
    longStopsPercent: number,
    totalDowntimeMinutes: number
): IInsight[] {
    const productionChange = percentChange(current.totalProductionMeters, previous.totalProductionMeters);
    const efficiencyChange = current.overallEfficiency - previous.overallEfficiency;
    const topReason = reasons[0];
    const problemMachines = bottomMachines.slice(0, 3);
    const problemShare = Math.round(
        (problemMachines.reduce((sum, item) => sum + item.downtimeMinutes, 0) / totalDowntimeMinutes) * 100
    );
    const bestShift = shifts.find((item) => item.isBest) ?? shifts[0];
    const worstShift = [...shifts].sort((a, b) => a.efficiency - b.efficiency)[0];
    const shiftGap = Number((bestShift.efficiency - worstShift.efficiency).toFixed(1));

    return [
        {
            id: 'production-improved',
            title: productionChange >= 0 ? 'Production Improved' : 'Production Declined',
            segments: [
                { text: productionChange >= 0 ? 'Production increased by ' : 'Production decreased by ' },
                { text: formatPercent(Math.abs(productionChange)), emphasize: true },
                { text: ' compared to last month while overall efficiency ' },
                { text: efficiencyChange >= 0 ? 'improved by ' : 'declined by ' },
                { text: formatPercent(Math.abs(efficiencyChange)), emphasize: true },
                { text: '.' }
            ]
        },
        {
            id: 'biggest-loss',
            title: 'Biggest Loss Reason',
            segments: [
                { text: topReason.reason, emphasize: true },
                { text: ' contributed ' },
                { text: `${topReason.downtimePercent}% of total downtime`, emphasize: true },
                { text: ', making them the biggest area for improvement.' }
            ]
        },
        {
            id: 'attention-machines',
            title: 'Machines Requiring Attention',
            segments: [
                { text: `Loom ${problemMachines.map((item) => item.name.replace('Loom ', '')).join(', ').replace(/, ([^,]*)$/, ' and $1')}` },
                { text: ' contributed ' },
                { text: `${problemShare}% of total factory downtime`, emphasize: true },
                { text: '.' }
            ]
        },
        {
            id: 'shift-gap',
            title: 'Shift Performance Gap',
            segments: [
                { text: `${worstShift.name} efficiency was ` },
                { text: `${shiftGap}% lower than ${bestShift.name}`, emphasize: true },
                { text: '.' }
            ]
        },
        {
            id: 'long-stops',
            title: 'Long Stops',
            segments: [
                { text: 'Stops longer than ' },
                { text: '10 minutes', emphasize: true },
                { text: ' contributed ' },
                { text: `${longStopsPercent}% of total downtime`, emphasize: true },
                { text: '.' }
            ]
        }
    ];
}

function buildRecommendations(
    reasons: IDowntimeReason[],
    bottomMachines: IMachineSummary[],
    shifts: IShiftPerformance[],
    currentEfficiency: number
): string[] {
    const problemNames = bottomMachines.slice(0, 3).map((item) => item.name).join(', ');
    const bestShift = shifts.find((item) => item.isBest) ?? shifts[0];
    const worstShift = [...shifts].sort((a, b) => a.efficiency - b.efficiency)[0];
    const target = Math.min(95, Math.ceil(currentEfficiency) + 2);

    return [
        `Investigate repeated ${reasons[0].reason}s on ${problemNames}.`,
        'Reduce stops longer than 10 minutes.',
        `Review ${worstShift.name} performance compared with ${bestShift.name}.`,
        `Target factory efficiency improvement from ${formatPercent(currentEfficiency)} to ${target}%.`,
        'Focus preventive maintenance on machines contributing the highest downtime.'
    ];
}

export function buildMonthlySummary(year: number, month: number): IMonthlySummary {
    const compare = previousMonth(year, month);
    const { current, previous } = buildKpis(year, month);
    const estimatedLoss = year === CANONICAL.year && month === CANONICAL.month
        ? 18450
        : Math.round(current.totalProductionMeters * 0.0356);
    const previousLoss = year === CANONICAL.year && month === CANONICAL.month
        ? 23600
        : Math.round(previous.totalProductionMeters * 0.0487);

    const dailyPerformance = buildDailyPerformance(
        year,
        month,
        current.totalProductionMeters,
        current.overallEfficiency,
        current.averageRpm,
        current.totalDowntimeMinutes
    );
    const bestDay = dailyPerformance.reduce((best, item) =>
        item.productionMeters > best.productionMeters ? item : best
    );
    const lowestDay = dailyPerformance.reduce((lowest, item) =>
        item.productionMeters < lowest.productionMeters ? item : lowest
    );
    const machines = buildMachines(current.totalProductionMeters, current.overallEfficiency, year, month);
    const ranked = [...machines].sort((a, b) => b.efficiency - a.efficiency);
    const topMachines = ranked.slice(0, 5);
    const bottomMachines = [...ranked].reverse().slice(0, 5);
    const downtimeReasons = buildDowntimeReasons(current.totalDowntimeMinutes, estimatedLoss);
    const shifts = buildShifts(current.totalProductionMeters, year, month);
    const longStopsOver10MinPercent = 34;
    const topProblemShare = Math.round(
        (bottomMachines.slice(0, 5).reduce((sum, item) => sum + item.downtimeMinutes, 0) / current.totalDowntimeMinutes) * 100
    );

    return {
        month: { year, month, label: monthLabel(year, month) },
        comparisonMonth: { year: compare.year, month: compare.month, label: monthLabel(compare.year, compare.month) },
        kpis: current,
        previousKpis: previous,
        kpiCards: buildKpiCards(current, previous),
        highlight: {
            headline: `This month TrackWeaving identified ${formatHoursMinutes(current.totalDowntimeMinutes)} of downtime and approximately ${formatMeters(estimatedLoss)} of potential production loss.`,
            supporting: buildHighlightSupport(current, previous)
        },
        dailyPerformance,
        dailySummary: {
            bestDay,
            lowestDay,
            averageDailyProduction: Math.round(current.totalProductionMeters / dailyPerformance.length)
        },
        downtimeReasons,
        productionLoss: {
            totalDowntimeMinutes: current.totalDowntimeMinutes,
            estimatedLossMeters: estimatedLoss,
            potentialAdditionalProductionPercent: 3.6,
            topProblemMachinesDowntimePercent: Math.min(49, Math.max(28, topProblemShare)),
            explanation: 'Estimated production loss is calculated using machine RPM, set picks and downtime duration.'
        },
        topMachines,
        bottomMachines,
        machines,
        shifts,
        monthComparison: buildComparisonRows(current, previous, estimatedLoss, previousLoss, { year, month }, compare),
        insights: buildInsights(current, previous, downtimeReasons, bottomMachines, shifts, longStopsOver10MinPercent, current.totalDowntimeMinutes),
        recommendations: buildRecommendations(downtimeReasons, bottomMachines, shifts, current.overallEfficiency),
        longStopsOver10MinPercent
    };
}

export { STOP_REASONS };
