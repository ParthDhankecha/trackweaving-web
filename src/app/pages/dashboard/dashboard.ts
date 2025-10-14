import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { Header } from '@src/app/layouts/header/header';
import { IResponse } from '@src/app/models/http-response.model';
import { EMachineStatusIds, IMachineLog, IMachineStatus } from '@src/app/models/machine.model';

import { ApiFacadeService } from '@src/app/services/api-facade-service';


export type LayoutOption = 'default' | '1x1' | '2x2' | '3x2' | '4x2' | '4x3' | '5x3';

export interface LayoutConfig {
  rows: number;
  cols: number;
  fs?: string;
  bootstrap?: string; // optional bootstrap class
};


@Component({
  selector: 'app-dashboard',
  imports: [
    FormsModule,
    Header
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {

  // Inject services
  readonly _apiFs = inject(ApiFacadeService);
  readonly _coreService = inject(CoreFacadeService);


  // Component properties
  protected machineStatus: IMachineStatus[] = [
    { key: EMachineStatusIds.Running, label: 'Running' },
    { key: EMachineStatusIds.Stopped, label: 'Stopped' },
    { key: EMachineStatusIds.all, label: 'All' }
  ];
  protected selectedMachineStatus: IMachineStatus = this.machineStatus[0];

  protected layoutOptions: LayoutOption[] = ['default', '1x1', '2x2', '3x2', '4x2', '4x3', '5x3'];
  protected selectedLayout: LayoutOption = 'default';
  protected selectedLayoutCardCount: number = -1;

  protected readonly layoutMap: Record<LayoutOption, LayoutConfig> = {
    default: { rows: 1, cols: 1, fs: '' },
    '1x1': { rows: 1, cols: 1, fs: 'fs-1' },
    '2x2': { rows: 2, cols: 2, fs: 'fs-2' },
    '3x2': { rows: 2, cols: 3, fs: 'fs-3' },
    '4x2': { rows: 2, cols: 4, fs: 'fs-5' },
    '4x3': { rows: 3, cols: 4, fs: 'fs-6' },
    '5x3': { rows: 3, cols: 5, fs: 'fs-6' },
  };



  ngOnInit(): void {
    this.getMachineLogs();
  }



  protected machineLogs: IMachineLog[] = [];
  protected machineCardKeyObj: {
    leftKeys: { key: string, label: string }[],
    rightKeys: { key: any, label: string }[]
  } = {
    leftKeys: [
      { key: 'picks', label: 'Picks' },
      { key: 'speed', label: 'Speed' },
      { key: 'pieceLengthM', label: 'Mtrs' }
    ],
    rightKeys: [
      { key: 'stops', label: 'Stops' },
      { key: 'beamLeft', label: 'Beam Left' },
      { key: 'setPicks', label: 'Set Picks' }
    ]
  } as const;
  protected liveMetrics: Record<string, any> = {};
  protected totalMachines: number = 0;
  protected getMachineLogs(): void {
    if (!this.selectedMachineStatus) return;

    this._apiFs.dashboard.getList({
      status: this.selectedMachineStatus.key
    }).subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.liveMetrics = res.data?.aggregateReport || {};
          this.machineLogs = res.data?.machineLogs || [];
          this.totalMachines = res.data?.totalCount || 0;
        }
      },
      error: (err: any) => {
        console.log('Error while fetching machine logs', err);
      }
    });
  }


  protected openFullscreen(): void {
    const elem = document.body; // or any element you want
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) { // Safari
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).msRequestFullscreen) { // IE/Edge
      (elem as any).msRequestFullscreen();
    }
  }
  protected closeFullscreen(): void {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) { // Safari
      (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) { // IE/Edge
      (document as any).msExitFullscreen();
    }
  }


  protected updateMachineStatus(status: IMachineStatus): void {
    if (this.selectedMachineStatus.key === status.key) {
      return;
    }
    this.selectedMachineStatus = status;
    this.getMachineLogs();
  }

  protected onChangeLayout(opt: LayoutOption): void {
    if (this.selectedLayout !== opt) {
      this.selectedLayout = opt;
      if (opt === 'default') {
        this.selectedLayoutCardCount = -1;// reset
        this.closeFullscreen();
        return;
      }
      this.selectedLayoutCardCount = this.layoutMap[opt].rows * this.layoutMap[opt].cols;
      this.openFullscreen();
    }
  }

  get selectedLayoutStr(): string {
    if (this.selectedLayout === 'default') {
      return '';
    }
    return `(${this.selectedLayoutCardCount})`;
  }

  get gridArray(): number[] {
    const config = this.layoutMap[this.selectedLayout];
    return Array(config.rows * config.cols).fill(0).map((_, i) => i + 1);
  }

  get colClass(): string {
    const config = this.layoutMap[this.selectedLayout];
    return `col-${12 / config.cols}`;
  }

  get rowClass(): string {
    const config = this.layoutMap[this.selectedLayout];
    if (this.selectedLayout === 'default') {
      return `default-grid ${config.fs || ''}`;
    }
    return `row-cols-${config.cols} ${config.fs || ''}`;
  }


  onChange(event: any) {
    console.log('Layout changed to:', this.selectedLayout);
    console.log(this.gridArray);
    console.log(this.colClass);
  }
}