import { NgClass, NgTemplateOutlet } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';

import moment from 'moment';

import { Header } from '@src/app/layouts/header/header';
import { Footer } from '@src/app/layouts/footer/footer';
import { ModalLayer } from '@src/app/shared/components/modal-layer/modal-layer';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';

import { RegisterModalLayer } from '@src/app/shared/directives/register-modal-layer';
import { IResponse } from '@src/app/models/http-response.model';
import { EMachineStatusIds, IMachineLog, IMachineStatus, LayoutConfig, LayoutOption } from '@src/app/models/machine.model';
import { IAppConfigData } from '@src/app/models/utils.model';


@Component({
  selector: 'app-dashboard',
  imports: [
    FormsModule,
    NgClass,
    NgTemplateOutlet,
    Header,
    Footer,
    ModalLayer,
    RegisterModalLayer
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {

  // Inject services
  constructor(
    private _apiFs: ApiFacadeService,
    protected _coreService: CoreFacadeService
  ) {
    this.config = this._coreService.appConfig.configData;
  }

  protected config: IAppConfigData;


  // Component properties
  protected machineStatus: IMachineStatus[] = [
    { key: EMachineStatusIds.Running, label: 'Running' },
    { key: EMachineStatusIds.Stopped, label: 'Stopped' },
    { key: EMachineStatusIds.all, label: 'All' }
  ];
  protected selectedMachineStatus: IMachineStatus = this.machineStatus.at(-1)!;

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

  private refreshSub!: Subscription;



  ngOnInit(): void {
    this.getMachineLogs();
    this.refreshSub = interval(this.config.refreshInterval * 1000).subscribe(() => {
      this.getMachineLogs();
    });
  }


  // Listen to fullscreen change events
  @HostListener('document:fullscreenchange', [])
  onFullscreenChange() {
    const isFullscreen = !!document.fullscreenElement;
    if (!isFullscreen) {
      this.isFullscreen = false;
      this.clearShuffle();
      this.onChangeLayout('default', false);// reset to default
    }
  }

  protected isFullscreen: boolean = false;
  protected openFullscreen(): void {
    const elem = document.body; // or any element you want
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) { // Safari
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).msRequestFullscreen) { // IE/Edge
      (elem as any).msRequestFullscreen();
    }
    this.isFullscreen = true;
  }
  protected closeFullscreen(): void {
    if (!this.isFullscreen) return;

    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) { // Safari
      (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) { // IE/Edge
      (document as any).msExitFullscreen();
    }
    this.isFullscreen = false;
    this.clearShuffle();
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
  protected totalPages: number = 0;
  protected getMachineLogs(filter: any = {}): void {
    if (!this.selectedMachineStatus) return;

    const payload: any = {
      status: this.selectedMachineStatus.key,
      ...filter
    };

    if (!this.isDefaultLayout) this.setPageAndLimit(payload);

    this._apiFs.dashboard.getList(payload).subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.liveMetrics = res.data?.aggregateReport || {};
          this.machineLogs = res.data?.machineLogs || [];
          this.totalMachines = this.liveMetrics[payload.status] ?? 0;
          const totalPages = Math.ceil(this.totalMachines / this.selectedLayoutCardCount);
          this.currentDateAndTime = this._moment().format(this.currentDateAndTimeFormat);
          if (this.totalPages !== totalPages) {
            this.totalPages = totalPages;
            // Update pagination list if in fullscreen mode
            if (this.isFullscreen && this.selectedLayoutCardCount > 0) {
              this.resetPaginationList(true);
            }
          }

          // Update selectedMachineLog reference if exists
          if (this.selectedMachineLog) {
            const { machineName, machineCode } = this.selectedMachineLog;
            this.selectedMachineLog = this.machineLogs.find(m => m.machineName === machineName && m.machineCode === machineCode) ?? null;
            if (!this.selectedMachineLog) this.closeMachineDetailsModal();
          }
        }
      },
      error: (err: any) => {
        console.log('Error while fetching machine logs', err);
      }
    });
  }


  private resetPaginationList(forceReset: boolean = false): boolean {
    const allUsed = this.paginationList.every(p => p.used);
    if (!forceReset && !allUsed) return false;

    this.paginationList = Array.from(
      { length: this.totalPages },
      (_, i) => ({ page: i + 1, used: false })
    );
    if (forceReset) this.currentPageObj = this.paginationList[0];
    return true;
  }

  protected setPageAndLimit(payload: any): void {
    if (this.isDefaultLayout) return;

    if (this.isShuffle) {
      const resetDone = this.resetPaginationList();
      resetDone && console.log('Pagination list reset for shuffle mode');
      // Pick a random page from remaining ones
      const availablePages = this.paginationList.filter(p => !p.used);
      this.currentPageObj = availablePages[Math.floor(Math.random() * availablePages.length)];
      this.currentPageObj.used = true;// mark page as used
    }

    if (this.currentPageObj) {
      // set page and limit in payload
      payload.page = this.currentPageObj.page;
      payload.limit = this.selectedLayoutCardCount;
    }
  }

  get isDefaultLayout(): boolean {
    return this.selectedLayout === 'default';
  }


  protected updateMachineStatus(status: IMachineStatus): void {
    if (this.selectedMachineStatus.key === status.key) return;

    this.selectedMachineStatus = status;
    this.totalPages = 1;// reset total pages
    this.resetPaginationList(true);// reset pagination
    this.getMachineLogs();
  }

  protected onChangeLayout(opt: LayoutOption, exitFullscreen: boolean = true): void {
    if (this.selectedLayout !== opt) {
      this.selectedLayout = opt;
      this.machineLogs = [];// clear current logs

      if (opt === 'default') {
        this.selectedLayoutCardCount = -1;// reset to default
        this.totalPages = 0;// reset total pages
        this.resetPaginationList(true);// reset pagination
        this.getMachineLogs();
        if (exitFullscreen) this.closeFullscreen();
        return;
      }

      this.selectedLayoutCardCount = this.layoutMap[opt].rows * this.layoutMap[opt].cols;
      this.totalPages = Math.ceil(this.totalMachines / this.selectedLayoutCardCount);
      this.resetPaginationList(true);// reset pagination
      this.getMachineLogs();// fetch logs with new limit
      this.openFullscreen();
    }
  }

  get selectedLayoutStr(): string {
    if (this.selectedLayout === 'default') {
      return '';
    }
    return `(${this.selectedLayoutCardCount})`;
  }

  get rowClass(): string {
    const config = this.layoutMap[this.selectedLayout];
    if (this.selectedLayout === 'default') {
      return `default-grid ${config.fs || ''}`;
    }
    return `grid-${this.selectedLayout} custom-fs`;
  }


  protected isShuffle: boolean = false;
  // protected paginationSet: Set<number | boolean> = new Set([1, false]);
  protected paginationList: { page: number, used: boolean }[] = [];
  protected currentPageObj!: { page: number, used: boolean };
  protected onRandomPage(): void {
    if (this.totalPages <= 1) {
      if (this.isShuffle) this.clearShuffle();
      return;
    }
    this.isShuffle = !this.isShuffle;
    this.resetPaginationList(true);
    this.getMachineLogs();
  }
  private clearShuffle(): void {
    this.isShuffle = false;
    this.resetPaginationList(true);
  }

  protected onPaginationButton(state: 'prev' | 'next'): void {
    if (this.totalPages <= 1) return;
    if (!this.currentPageObj) {
      this.currentPageObj = this.paginationList[0];
    }

    const currentIndex = this.paginationList.findIndex(p => p.page === this.currentPageObj?.page);
    let newIndex = currentIndex;
    if (state === 'prev') {
      newIndex = (currentIndex - 1 + this.paginationList.length) % this.paginationList.length;
    } else if (state === 'next') {
      newIndex = (currentIndex + 1) % this.paginationList.length;
    }

    const newPageObj = this.paginationList[newIndex];
    if (newPageObj) {
      this.currentPageObj = newPageObj;
      this.getMachineLogs();
    }
  }



  protected efficiencyClassName(efficiency: number = 0): string {
    if (efficiency >= this.config.efficiencyGoodPer) {
      return 'bg-success';
    } else if (efficiency > this.config.efficiencyAveragePer) {
      return 'bg-warning text-dark';
    } else {
      return 'bg-danger bg-opacity-75';
    }
  }

  protected machineCardViewModelId: string = 'viewMachineDetails';
  protected selectedMachineLog: IMachineLog | null = null;
  protected doubleClickOnMachineCard(machine: IMachineLog): void {
    if (!machine) return;

    this._coreService.modal.open(this.machineCardViewModelId);
    this.selectedMachineLog = machine;
  }

  protected closeMachineDetailsModal(): void {
    this._coreService.modal.close(this.machineCardViewModelId);
    this.selectedMachineLog = null;
  }


  readonly _moment = moment;
  protected readonly currentDateAndTimeFormat: string = 'DD-MM-YYYY, hh:mm:ss A';
  protected currentDateAndTime: string = this._moment().format(this.currentDateAndTimeFormat);

  protected onSelectMachineStatus(status: any): void {
    if (this.selectedMachineStatus.key === status.key) {
      return;
    }
    // this.selectedMachineStatus = status;
    this.updateMachineStatus(status);
  }


  private ngOnDestroy(): void {
    // clean up to avoid memory leaks
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
    }
  }
}