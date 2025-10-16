import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

import moment from 'moment';

import { IMachineStatus } from '@src/app/models/machine.model';

@Component({
  selector: 'app-header',
  imports: [
    NgTemplateOutlet
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {

  @Input('containerClass') containerClass: string = '';

  @Input('liveMetrics') liveMetrics: any = {};
  @Input('selectedMachineStatus') selectedMachineStatus!: any;
  @Input('machineStatus') machineStatus: IMachineStatus[] = [];
  @Output('onMachineStatusChange') onMachineStatusChange: EventEmitter<IMachineStatus> = new EventEmitter<IMachineStatus>();


  readonly _moment = moment;
  protected readonly currentDateAndTimeFormat: string = 'DD-MM-YYYY, hh:mm:ss A';
  protected currentDateAndTime: string = this._moment().format(this.currentDateAndTimeFormat);


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['liveMetrics'] && this.liveMetrics) {
      this.currentDateAndTime = this._moment().format(this.currentDateAndTimeFormat);
      if (!this.selectedMachineStatus) {
        this.selectedMachineStatus = this.machineStatus[0];
      } else {
        const updatedStatus = this.machineStatus.find(ms => ms.key === this.selectedMachineStatus.key);
        if (updatedStatus) {
          this.selectedMachineStatus = updatedStatus;
        }
      }
    }
  }

  protected onSelectMachineStatus(status: any): void {
    if (this.selectedMachineStatus.key === status.key) {
      return;
    }
    this.selectedMachineStatus = status;
    this.onMachineStatusChange.emit(this.selectedMachineStatus);
  }
}