import { AfterViewInit, Component, ElementRef, HostListener, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';

import { IDailyPerformance, IDailySummary } from '@src/app/models/monthly-summary.model';
import { formatHoursMinutes, formatMeters, formatPercent } from '../../monthly-summary.utils';


interface IChartPoint {
    day: IDailyPerformance;
    x: number;
    barX: number;
    barWidth: number;
    barHeight: number;
    barY: number;
    lineY: number;
}

@Component({
    selector: 'app-performance-trend-chart',
    imports: [],
    templateUrl: './performance-trend-chart.html',
    styleUrl: './performance-trend-chart.scss'
})
export class PerformanceTrendChart implements AfterViewInit, OnChanges, OnDestroy {
    @Input({ required: true }) days: IDailyPerformance[] = [];
    @Input() monthLabel = '';
    @Input() summary: IDailySummary | null = null;

    @ViewChild('chartHost') chartHost?: ElementRef<HTMLElement>;

    protected width = 860;
    protected height = 320;
    protected readonly pad = { top: 18, right: 48, bottom: 36, left: 56 };
    protected points: IChartPoint[] = [];
    protected linePath = '';
    protected yTicks: { y: number; label: string }[] = [];
    protected y2Ticks: { y: number; label: string }[] = [];
    protected hovered: IDailyPerformance | null = null;
    protected tooltipLeft = 0;
    protected tooltipTop = 0;
    protected readonly formatMeters = formatMeters;
    protected readonly formatPercent = formatPercent;
    protected readonly formatHoursMinutes = formatHoursMinutes;

    private resizeObserver?: ResizeObserver;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['days']) {
            this.layout();
        }
    }

    ngAfterViewInit(): void {
        this.observeSize();
        this.layout();
    }

    ngOnDestroy(): void {
        this.resizeObserver?.disconnect();
    }

    @HostListener('window:resize')
    protected onWindowResize(): void {
        this.observeSize();
        this.layout();
    }

    protected get innerWidth(): number {
        return Math.max(40, this.width - this.pad.left - this.pad.right);
    }

    protected get innerHeight(): number {
        return Math.max(40, this.height - this.pad.top - this.pad.bottom);
    }

    protected get plotBottom(): number {
        return this.height - this.pad.bottom;
    }

    protected onHover(point: IChartPoint, event: MouseEvent): void {
        this.hovered = point.day;
        const host = this.chartHost?.nativeElement.getBoundingClientRect();
        if (!host) return;
        this.tooltipLeft = Math.min(event.clientX - host.left + 12, host.width - 180);
        this.tooltipTop = Math.max(8, event.clientY - host.top - 88);
    }

    protected clearHover(): void {
        this.hovered = null;
    }

    protected formatDayLabel(day: IDailyPerformance): string {
        const [year, month, date] = day.date.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${Number(date)} ${months[Number(month) - 1]} ${year}`;
    }

    protected shortDate(day: IDailyPerformance): string {
        const [year, month, date] = day.date.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${Number(date)} ${months[Number(month) - 1]}`;
    }

    private observeSize(): void {
        if (!this.chartHost || this.resizeObserver) {
            if (this.chartHost) {
                this.width = Math.max(640, this.chartHost.nativeElement.clientWidth);
            }
            return;
        }
        this.resizeObserver = new ResizeObserver((entries) => {
            const nextWidth = entries[0]?.contentRect.width ?? 860;
            this.width = Math.max(640, nextWidth);
            this.layout();
        });
        this.resizeObserver.observe(this.chartHost.nativeElement);
        this.width = Math.max(640, this.chartHost.nativeElement.clientWidth);
    }

    private layout(): void {
        if (!this.days.length) {
            this.points = [];
            this.linePath = '';
            return;
        }

        const maxProd = Math.max(...this.days.map((day) => day.productionMeters), 0);
        const prodCeiling = maxProd + 200;
        const effMin = 0;
        const effMax = 100;
        const slot = this.innerWidth / this.days.length;
        const barWidth = Math.max(4, Math.min(18, slot * 0.55));

        this.points = this.days.map((day, index) => {
            const x = this.pad.left + slot * index + slot / 2;
            const barHeight = (day.productionMeters / prodCeiling) * this.innerHeight;
            const efficiency = Math.min(effMax, Math.max(effMin, day.efficiency || 0));
            const lineY = this.pad.top + ((effMax - efficiency) / (effMax - effMin)) * this.innerHeight;
            return {
                day,
                x,
                barX: x - barWidth / 2,
                barWidth,
                barHeight,
                barY: this.plotBottom - barHeight,
                lineY
            };
        });

        this.yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
            y: this.plotBottom - ratio * this.innerHeight,
            label: formatMeters(prodCeiling * ratio).replace(' m', '')
        }));
        this.y2Ticks = [0, 20, 40, 60, 80, 100].map((value) => ({
            y: this.pad.top + ((effMax - value) / (effMax - effMin)) * this.innerHeight,
            label: `${value}%`
        }));
        this.linePath = this.smoothLine(this.points.map((point) => ({ x: point.x, y: point.lineY })));
    }

    private smoothLine(points: { x: number; y: number }[]): string {
        if (points.length < 2) return '';
        let path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i - 1] ?? points[i];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2] ?? p2;
            const c1x = p1.x + (p2.x - p0.x) / 6;
            const c1y = p1.y + (p2.y - p0.y) / 6;
            const c2x = p2.x - (p3.x - p1.x) / 6;
            const c2y = p2.y - (p3.y - p1.y) / 6;
            path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
        }
        return path;
    }
}
