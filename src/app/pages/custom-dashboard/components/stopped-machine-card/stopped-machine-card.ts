import { Component, Input } from '@angular/core';

import { StoppedMachine, getStopReasonConfig } from '@src/app/models/custom-dashboard.model';

@Component({
  selector: 'app-stopped-machine-card',
  imports: [],
  templateUrl: './stopped-machine-card.html',
  styleUrl: './stopped-machine-card.scss'
})
export class StoppedMachineCard {
  /** Null renders a calm "all clear" filler slot instead of a machine alert (used to fill an odd-numbered last page). */
  @Input() machine: StoppedMachine | null = null;

  protected get reasonConfig() {
    return getStopReasonConfig(this.machine?.stopReason ?? '');
  }
}
