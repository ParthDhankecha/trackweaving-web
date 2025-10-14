import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { interval, Subscription } from 'rxjs';

import moment from 'moment';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';

import { IMachineStatus } from '@src/app/models/machine.model';


@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    RouterLinkActive,
    NgTemplateOutlet
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {

  @Input('containerClass') containerClass: string = '';

  @Input('liveMetrics') liveMetrics: any = {};
  @Input('machineStatus') machineStatus: IMachineStatus[] = [];
  protected selectedMachineStatus!: any;
  @Output('onMachineStatusChange') onMachineStatusChange: EventEmitter<IMachineStatus> = new EventEmitter<IMachineStatus>();


  readonly _moment = moment;
  protected readonly currentDateAndTimeFormat: string = 'DD-MM-YYYY, hh:mm A';
  protected currentDateAndTime: string = this._moment().format(this.currentDateAndTimeFormat);


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['liveMetrics'] && this.liveMetrics) {
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


  ngOnInit(): void {
    this.setCurrentTime();
  }


  protected currentTimeSubscription!: Subscription;
  private setCurrentTime(): void {
    this.currentTimeSubscription = interval(1000).subscribe(() => {
      this.currentDateAndTime = this._moment().format(this.currentDateAndTimeFormat);
    });
  }


  protected onSelectMachineStatus(status: any): void {
    if (this.selectedMachineStatus.key === status.key) {
      return;
    }
    this.selectedMachineStatus = status;
    this.onMachineStatusChange.emit(this.selectedMachineStatus);
  }


  ngOnDestroy(): void {
    this.currentTimeSubscription?.unsubscribe();
  }
}