import {
    IProductionIntelligenceReport,
    PRIORITY_WEIGHTS,
    TTrendDays
} from '@src/app/models/production-intelligence.model';

/**
 * Standalone mock for Production Intelligence.
 * Not used by the live HTTP service. Swap this in only when the API is unavailable.
 */
export function getMockProductionIntelligence(
    startDate: string,
    endDate: string,
    trendDays: TTrendDays = 7
): IProductionIntelligenceReport {
    const sameDay = startDate === endDate;
    const periodLabel = sameDay
        ? `${formatDateLabel(endDate)} | All Shift`
        : `${shortDate(startDate)} - ${formatDateLabel(endDate)} | All Shift`;

    return {
        periodLabel,
        trendDays,
        weights: PRIORITY_WEIGHTS,
        summary: {
            totalProductionMeters: 192580,
            overallEfficiency: 87.4,
            totalPicks: 8642000,
            totalDowntimeMinutes: 755,
            estimatedProductionLoss: 8420,
            machinesNeedingAction: 4,
            watchlistCount: 6
        },
        factoryAverage: {
            averageStops: 18,
            averageDowntimeMinutes: 38,
            averageEfficiency: 87.4,
            averageRpm: 598
        },
        productionOpportunity: {
            headline: '4 machines contributed 61% of total production loss during the selected period.',
            supporting: 'Reducing the major identified issues by 50% could potentially recover approximately 1,340 m of production.'
        },
        priorityMachines: [
            {
                machineId: 'm17',
                machineName: 'M17',
                priorityScore: 86,
                severity: 'critical',
                primaryIssue: 'Repeated Weft Stops',
                explanation: 'Weft Stop frequency is 2.4x higher than the selected factory average.',
                productionMeters: 6420,
                picks: 288000,
                efficiency: 71,
                averageRpm: 542,
                totalStops: 96,
                downtimeMinutes: 128,
                estimatedProductionLoss: 640,
                alsoOnWatchlist: true,
                tags: ['Weft x34', '2.4x Stop Avg', '128m Downtime'],
                stopReasons: [
                    { reason: 'Weft Stop', count: 34, durationMinutes: 72, estimatedLossMeters: 360 },
                    { reason: 'Warp Stop', count: 18, durationMinutes: 31, estimatedLossMeters: 155 },
                    { reason: 'Feeder Stop', count: 12, durationMinutes: 16, estimatedLossMeters: 80 }
                ],
                history7: trend(82, -2),
                history30Average: { efficiency: 86.2, downtimeMinutes: 54, productionMeters: 7800 }
            },
            {
                machineId: 'm24',
                machineName: 'M24',
                priorityScore: 78,
                severity: 'critical',
                primaryIssue: 'High Downtime',
                explanation: 'Downtime is 2.3x higher than factory average.',
                productionMeters: 7010,
                picks: 301000,
                efficiency: 74.2,
                averageRpm: 556,
                totalStops: 61,
                downtimeMinutes: 114,
                estimatedProductionLoss: 520,
                alsoOnWatchlist: false,
                tags: ['Warp x22', '114m Downtime', 'Low Eff 74.2%'],
                stopReasons: [
                    { reason: 'Warp Stop', count: 22, durationMinutes: 68, estimatedLossMeters: 310 },
                    { reason: 'Weft Stop', count: 16, durationMinutes: 28, estimatedLossMeters: 128 }
                ],
                history7: trend(79, -1),
                history30Average: { efficiency: 84.5, downtimeMinutes: 62, productionMeters: 8100 }
            },
            {
                machineId: 'm08',
                machineName: 'M08',
                priorityScore: 68,
                severity: 'attention',
                primaryIssue: 'Low Efficiency',
                explanation: 'Efficiency is 8.4% below factory average.',
                productionMeters: 8120,
                picks: 344000,
                efficiency: 79,
                averageRpm: 571,
                totalStops: 44,
                downtimeMinutes: 82,
                estimatedProductionLoss: 340,
                alsoOnWatchlist: true,
                tags: ['Low Eff 79%', '82m Downtime', 'Feeder x14'],
                stopReasons: [
                    { reason: 'Feeder Stop', count: 14, durationMinutes: 36, estimatedLossMeters: 150 },
                    { reason: 'Weft Stop', count: 11, durationMinutes: 24, estimatedLossMeters: 100 }
                ],
                history7: [92, 91, 89, 87, 86, 84, 82].map((efficiency, index) => ({
                    date: `2026-09-0${index + 3}`,
                    efficiency,
                    downtimeMinutes: 20 + index * 6,
                    productionMeters: 8600 - index * 80
                })),
                history30Average: { efficiency: 90, downtimeMinutes: 41, productionMeters: 8600 }
            },
            {
                machineId: 'm31',
                machineName: 'M31',
                priorityScore: 61,
                severity: 'attention',
                primaryIssue: 'Production Loss',
                explanation: 'Estimated 285 m production lost due to downtime.',
                productionMeters: 8340,
                picks: 351000,
                efficiency: 81.6,
                averageRpm: 580,
                totalStops: 39,
                downtimeMinutes: 67,
                estimatedProductionLoss: 285,
                alsoOnWatchlist: false,
                tags: ['Feeder x17', '67m Downtime', '1.8x Stop Avg'],
                stopReasons: [
                    { reason: 'Feeder Stop', count: 17, durationMinutes: 41, estimatedLossMeters: 175 },
                    { reason: 'Other / Manual', count: 8, durationMinutes: 16, estimatedLossMeters: 68 }
                ],
                history7: trend(84, -0.6),
                history30Average: { efficiency: 87.1, downtimeMinutes: 38, productionMeters: 8700 }
            }
        ],
        maintenanceWatchlist: {
            criticalCount: 2,
            watchCount: 4,
            machines: [
                {
                    machineId: 'm08',
                    machineName: 'M08',
                    status: 'critical',
                    primaryTrend: 'Efficiency Declining',
                    explanation: 'Efficiency has declined for 5 consecutive production days.',
                    currentValue: '82% Efficiency',
                    currentEfficiency: 82,
                    historicalAverage: '90%',
                    historicalEfficiency: 90,
                    percentageChange: -8,
                    tags: ['Efficiency ↓ 8%', 'Feeder Stops ↑ 46%', 'Downtime ↑ 32%'],
                    trendData: [92, 91, 89, 87, 86, 84, 82].slice(-trendDays).map((efficiency, index) => ({
                        date: `2026-09-0${index + 3}`,
                        efficiency,
                        downtimeMinutes: 20 + index * 6,
                        productionMeters: 8600 - index * 80
                    })),
                    productionMeters: 8120,
                    picks: 344000,
                    efficiency: 79,
                    averageRpm: 571,
                    totalStops: 44,
                    downtimeMinutes: 82,
                    estimatedProductionLoss: 340,
                    history7: [92, 91, 89, 87, 86, 84, 82].map((efficiency, index) => ({
                        date: `2026-09-0${index + 3}`,
                        efficiency,
                        downtimeMinutes: 20 + index * 6,
                        productionMeters: 8600 - index * 80
                    })),
                    history30Average: { efficiency: 90, downtimeMinutes: 41, productionMeters: 8600 }
                },
                {
                    machineId: 'm17',
                    machineName: 'M17',
                    status: 'critical',
                    primaryTrend: 'Weft Stop Rising',
                    explanation: 'Weft Stop frequency increased 46% compared with the previous 7-day average.',
                    currentValue: '71% Efficiency',
                    currentEfficiency: 71,
                    historicalAverage: '86.2%',
                    historicalEfficiency: 86.2,
                    percentageChange: -15.2,
                    tags: ['Weft Stops ↑ 46%', 'Downtime ↑ 52%', 'Efficiency ↓ 15%'],
                    trendData: trend(82, -2).slice(-trendDays),
                    productionMeters: 6420,
                    picks: 288000,
                    efficiency: 71,
                    averageRpm: 542,
                    totalStops: 96,
                    downtimeMinutes: 128,
                    estimatedProductionLoss: 640
                },
                {
                    machineId: 'm04',
                    machineName: 'M04',
                    status: 'watch',
                    primaryTrend: 'Downtime Rising',
                    explanation: 'Machine downtime has remained above its previous 7-day average.',
                    currentValue: '84% Efficiency',
                    currentEfficiency: 84,
                    historicalAverage: '88%',
                    historicalEfficiency: 88,
                    percentageChange: -4,
                    tags: ['Downtime ↑ 34%', 'Warp Stops ↑ 21%'],
                    trendData: trend(88, -0.7).slice(-trendDays)
                },
                {
                    machineId: 'm12',
                    machineName: 'M12',
                    status: 'watch',
                    primaryTrend: 'Speed Degradation',
                    explanation: 'Average running speed is 7% below normal.',
                    currentValue: '86% Efficiency',
                    currentEfficiency: 86,
                    historicalAverage: '89%',
                    historicalEfficiency: 89,
                    percentageChange: -3,
                    tags: ['Speed ↓ 7%', 'Efficiency ↓ 3%'],
                    trendData: trend(89, -0.4).slice(-trendDays)
                },
                {
                    machineId: 'm21',
                    machineName: 'M21',
                    status: 'watch',
                    primaryTrend: 'Warp Stop Rising',
                    explanation: 'The same warp stop increased for 3 consecutive production days.',
                    currentValue: '85% Efficiency',
                    currentEfficiency: 85,
                    historicalAverage: '88.4%',
                    historicalEfficiency: 88.4,
                    percentageChange: -3.4,
                    tags: ['Warp Stops ↑ 18%', 'Downtime ↑ 22%'],
                    trendData: trend(88, -0.5).slice(-trendDays)
                },
                {
                    machineId: 'm29',
                    machineName: 'M29',
                    status: 'watch',
                    primaryTrend: 'Efficiency Declining',
                    explanation: 'Efficiency has declined for 3 consecutive production days.',
                    currentValue: '83% Efficiency',
                    currentEfficiency: 83,
                    historicalAverage: '87%',
                    historicalEfficiency: 87,
                    percentageChange: -4,
                    tags: ['Efficiency ↓ 4%', 'Weft Stops ↑ 16%'],
                    trendData: trend(87, -0.6).slice(-trendDays)
                }
            ]
        },
        productionLossBreakdown: {
            topSharePercent: 61,
            summary: 'Top 5 machines caused 61% of total estimated production loss.',
            rows: [
                { machineId: 'm17', machineName: 'M17', estimatedLossMeters: 640, downtimeMinutes: 128, mainReason: 'Weft Stop' },
                { machineId: 'm24', machineName: 'M24', estimatedLossMeters: 520, downtimeMinutes: 114, mainReason: 'Warp Stop' },
                { machineId: 'm08', machineName: 'M08', estimatedLossMeters: 340, downtimeMinutes: 82, mainReason: 'Feeder Stop' },
                { machineId: 'm31', machineName: 'M31', estimatedLossMeters: 285, downtimeMinutes: 67, mainReason: 'Feeder Stop' },
                { machineId: 'm04', machineName: 'M04', estimatedLossMeters: 210, downtimeMinutes: 54, mainReason: 'Warp Stop' }
            ]
        },
        stopReasonLosses: [
            { reason: 'Weft Stop', count: 214, durationMinutes: 286, estimatedLossMeters: 3280 },
            { reason: 'Warp Stop', count: 168, durationMinutes: 198, estimatedLossMeters: 2140 },
            { reason: 'Feeder Stop', count: 121, durationMinutes: 112, estimatedLossMeters: 1280 },
            { reason: 'Other / Manual', count: 74, durationMinutes: 79, estimatedLossMeters: 920 }
        ],
        recommendations: [
            {
                title: 'Check M17 Weft System',
                detail: 'M17 recorded 34 Weft Stops, 2.4x higher than factory average.'
            },
            {
                title: 'Investigate M24 Long Downtime',
                detail: 'M24 lost approximately 520 m due to 114 minutes of downtime.'
            },
            {
                title: 'Inspect M08',
                detail: 'Efficiency has declined for five consecutive production days.'
            },
            {
                title: 'Focus on Weft Stop',
                detail: 'Weft Stop accounts for 3,280 m of estimated production loss.'
            }
        ]
    };
}

function trend(start: number, step: number) {
    return Array.from({ length: 7 }, (_, index) => ({
        date: `2026-09-0${index + 3}`,
        efficiency: Number((start + step * index).toFixed(1)),
        downtimeMinutes: 24 + index * 4,
        productionMeters: 8400 - index * 60
    }));
}

function formatDateLabel(value: string): string {
    const date = new Date(`${value}T00:00:00`);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function shortDate(value: string): string {
    const date = new Date(`${value}T00:00:00`);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}
