import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnChanges,
    OnDestroy,
    SimpleChanges,
    inject
} from '@angular/core';
import { DatePipe } from '@angular/common';

import {
    IStopTimelineReport,
    IStopTimelineSegment,
    IStopTimelineStop
} from '@src/app/models/stop-timeline.model';
import {
    buildCategoryLegendItems,
    buildTimeAxisLabels,
    collectStopCategoriesFromReport,
    computeRunningFillPct,
    formatTimelineClock,
    stopCategoryColor,
    stopCategoryLabel
} from './stop-timeline.utils';

interface IHoverStop extends IStopTimelineStop {
    machineCode: string;
}

interface ITimelineRowView {
    machineId: string;
    machineCode: string;
    totalStopTime: string;
    stops: {
        key: string;
        leftPct: number;
        widthPct: number;
        color: string;
        stop: IStopTimelineStop;
    }[];
}

interface ISegmentView {
    axisLabels: { pct: number; text: string }[];
    rows: ITimelineRowView[];
    runningFillPct: number;
}

@Component({
    selector: 'app-stop-timeline-report',
    imports: [DatePipe],
    templateUrl: './stop-timeline-report.html',
    styleUrl: './stop-timeline-report.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StopTimelineReport implements OnChanges, OnDestroy {
    @Input({ required: true }) report!: IStopTimelineReport | null;

    private readonly cdr = inject(ChangeDetectorRef);

    protected selectedSegmentIndex = 0;
    protected hoveredStop: IHoverStop | null = null;
    protected segmentView: ISegmentView | null = null;
    protected tooltipLeft = 0;
    protected tooltipTop = 0;

    protected categoryLegend: { key: string; label: string; color: string }[] = [];

    private liveRefreshTimer: ReturnType<typeof setInterval> | null = null;

    protected readonly formatTimelineClock = formatTimelineClock;
    protected readonly stopCategoryLabel = stopCategoryLabel;

    protected get segments(): IStopTimelineSegment[] {
        return this.report?.segments || [];
    }

    protected get activeSegment(): IStopTimelineSegment | null {
        return this.segments[this.selectedSegmentIndex] ?? null;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['report']) {
            this.selectedSegmentIndex = 0;
            this.hoveredStop = null;
        }
        this.rebuildSegmentView();
    }

    ngOnDestroy(): void {
        this.clearLiveRefresh();
    }

    protected selectSegment(index: number): void {
        if (this.selectedSegmentIndex === index) return;
        this.selectedSegmentIndex = index;
        this.hoveredStop = null;
        this.rebuildSegmentView();
    }

    protected segmentKey(segment: IStopTimelineSegment, index: number): string {
        return `${segment.reportDate}|${segment.shift}|${index}`;
    }

    protected onStopHover(event: MouseEvent, stop: IStopTimelineStop, machineCode: string): void {
        this.hoveredStop = { ...stop, machineCode };
        this.updateTooltipPosition(event);
        this.cdr.markForCheck();
    }

    protected onStopFocus(event: FocusEvent, stop: IStopTimelineStop, machineCode: string): void {
        const target = event.target as HTMLElement | null;
        if (!target) return;
        const rect = target.getBoundingClientRect();
        this.onStopHover({
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
            currentTarget: event.currentTarget
        } as MouseEvent, stop, machineCode);
    }

    protected onStopLeave(event: MouseEvent): void {
        const related = event.relatedTarget;
        if (related instanceof HTMLElement && related.classList.contains('timeline-row__stop')) {
            return;
        }
        this.clearHover();
    }

    protected onStopBlur(): void {
        this.clearHover();
    }

    protected clearHover(): void {
        if (!this.hoveredStop) return;
        this.hoveredStop = null;
        this.cdr.markForCheck();
    }

    private updateTooltipPosition(event: MouseEvent): void {
        const chart = (event.currentTarget as HTMLElement | null)?.closest('.timeline-chart') as HTMLElement | null;
        if (!chart) return;

        const rect = chart.getBoundingClientRect();
        const padding = 8;
        const tooltipWidth = 220;
        const tooltipHeight = 120;

        let left = event.clientX - rect.left + 12;
        let top = event.clientY - rect.top + 12;

        left = Math.min(Math.max(padding, left), rect.width - tooltipWidth - padding);
        top = Math.min(Math.max(padding, top), rect.height - tooltipHeight - padding);

        this.tooltipLeft = left;
        this.tooltipTop = top;
    }

    private rebuildSegmentView(): void {
        this.categoryLegend = buildCategoryLegendItems(collectStopCategoriesFromReport(this.report));

        const segment = this.activeSegment;
        if (!segment?.shiftWindow) {
            this.segmentView = null;
            this.clearLiveRefresh();
            this.cdr.markForCheck();
            return;
        }

        const axisLabels = buildTimeAxisLabels(
            segment.shiftWindow.start,
            segment.shiftWindow.end,
            5
        );

        const rows: ITimelineRowView[] = (segment.machines || []).map((machine) => ({
            machineId: String(machine.machineId),
            machineCode: machine.machineCode,
            totalStopTime: machine.totalStopTime,
            stops: (machine.stops || []).map((stop, index) => ({
                key: `${stop.from}|${index}`,
                leftPct: stop.startOffsetPct,
                widthPct: Math.max(stop.widthPct, 0.35),
                color: stopCategoryColor(stop.category),
                stop
            }))
        }));

        const runningFillPct = computeRunningFillPct(segment.shiftWindow, segment.reportDate);

        this.segmentView = { axisLabels, rows, runningFillPct };
        this.syncLiveRefresh(runningFillPct);
        this.cdr.markForCheck();
    }

    private syncLiveRefresh(runningFillPct: number): void {
        this.clearLiveRefresh();
        if (runningFillPct <= 0 || runningFillPct >= 100) return;

        this.liveRefreshTimer = setInterval(() => {
            this.rebuildSegmentView();
        }, 60_000);
    }

    private clearLiveRefresh(): void {
        if (!this.liveRefreshTimer) return;
        clearInterval(this.liveRefreshTimer);
        this.liveRefreshTimer = null;
    }
}
