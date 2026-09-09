import { Component, Input } from '@angular/core';

import { EfficiencyLine, formatLineLabel } from '@src/app/models/custom-dashboard.model';

@Component({
  selector: 'app-line-efficiency-bar',
  imports: [],
  templateUrl: './line-efficiency-bar.html',
  styleUrl: './line-efficiency-bar.scss'
})
export class LineEfficiencyBar {
  @Input({ required: true }) line!: EfficiencyLine;
  @Input() isTop: boolean = false;

  protected get lineLabel(): string {
    return formatLineLabel(this.line.lineKey);
  }

  protected get performanceClass(): string {
    return `perf-${this.line.performance || 'good'}`;
  }
}
