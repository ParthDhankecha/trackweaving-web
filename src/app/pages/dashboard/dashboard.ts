import { DecimalPipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';

import moment from 'moment';

import { Header } from '@src/app/layouts/header/header';
import { Footer } from '@src/app/layouts/footer/footer';
import { ModalLayer } from '@src/app/shared/components/modal-layer/modal-layer';
import { CommonDropdown } from '@src/app/shared/components/common-dropdown/common-dropdown';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';

import { RegisterModalLayer } from '@src/app/shared/directives/register-modal-layer';
import { IResponse } from '@src/app/models/http-response.model';
import {
  EMachineStatusIds, getStopColumns as buildStopColumns, IMachineLog, IMachineStatus, LayoutConfig,
  LayoutOption, MachineType, MetricDisplayMode, GroupByOption, IMachineLogGroup, EFFICIENCY_BANDS
} from '@src/app/models/machine.model';
import { IAppConfigData } from '@src/app/models/utils.model';
import StorageKeys from '@src/app/constants/storage-keys';
import { ROUTES } from '@src/app/constants/app.routes';


@Component({
  selector: 'app-dashboard',
  imports: [
    FormsModule,
    NgClass,
    DecimalPipe,
    NgTemplateOutlet,
    Header,
    Footer,
    ModalLayer,
    RegisterModalLayer,
    CommonDropdown
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit, OnDestroy {

  // Inject services
  constructor(
    protected _apiFs: ApiFacadeService,
    protected _router: Router,
    protected _coreService: CoreFacadeService
  ) {
    this.config = this._coreService.appConfig.configData;

    if (Number.isFinite(this.config?.beamLeftMin)) {
      this.beamLeftMin = this.config.beamLeftMin;
    }
  }

  protected config: IAppConfigData;

  protected dashboardHeaderMode: string = 'dashboard';
  protected footerContentOnly: boolean = false;
  protected showFactoryFilter: boolean = false;
  protected workspaceOptions: { _id: string; firmName: string }[] = [];
  protected selectedWorkspaceId: string = '';
  protected readonly machineTypeOptions = ['rapier', 'airjet', 'waterjet', 'circular'];
  protected selectedMachineType = '';


  // Component properties
  protected machineStatus: IMachineStatus[] = [
    { key: EMachineStatusIds.Running, label: 'Running' },
    { key: EMachineStatusIds.Stopped, label: 'Stopped' },
    { key: EMachineStatusIds.all, label: 'All' }
  ];
  protected selectedMachineStatus: IMachineStatus = this.machineStatus.at(-1)!;

  protected layoutOptions: LayoutOption[] = ['default', '2x2', '3x2', '4x2', '4x3', '5x3', 'dense'];
  protected readonly layoutMap: Record<LayoutOption, LayoutConfig> = {
    default: { rows: 1, cols: 1, fs: '' },
    '2x2': { rows: 2, cols: 2, fs: 'fs-2' },
    '3x2': { rows: 2, cols: 3, fs: 'fs-3' },
    '4x2': { rows: 2, cols: 4, fs: 'fs-5' },
    '4x3': { rows: 3, cols: 4, fs: 'fs-6' },
    '5x3': { rows: 3, cols: 5, fs: 'fs-6' },
    dense: { rows: 0, cols: 0, autoFill: true },
  };
  protected selectedLayout: LayoutOption = this.readStoredLayout() ?? 'default';
  protected selectedLayoutCardCount: number = this.getInitialLayoutCardCount();
  protected metricDisplayMode: MetricDisplayMode = 'label';

  protected groupByOptions: { key: GroupByOption; label: string }[] = [
    { key: 'default', label: 'Default' },
    { key: 'group', label: 'By Group' },
    { key: 'efficiency', label: 'By Efficiency' },
    { key: 'quality', label: 'By Quality' },
    { key: 'operator', label: 'By Operator' },
  ];
  protected selectedGroupBy: GroupByOption = this.readStoredGroupBy() ?? 'default';
  protected groupedMachineLogs: IMachineLogGroup[] = [];
  private collapsedGroupKeys = new Set<string>();

  /** Shorter labels for dense card metric rows */
  protected readonly denseMetricKeys = {
    leftKeys: [
      { key: 'picks', label: 'Pick' },
      { key: 'speed', label: 'Speed' },
      { key: 'pieceLengthM', label: 'Mtrs' },
    ],
    rightKeys: [
      { key: 'runTime', label: 'Run' },
      { key: 'beamLeft', label: 'Beam' },
      { key: 'setPicks', label: 'Set' },
    ],
  } as const;
  protected beamLeftMin: number = 1000;

  protected refreshSub!: Subscription;



  ngOnInit(): void {
    // Pagination disabled for now — restore for future use
    // this.initLayoutForApi();
    this.getMachineLogs();
    this.refreshSub = interval(this.config.refreshInterval * 1000).subscribe(() => {
      this.getMachineLogs();
    });
  }

  /** Ensure page/limit paging is ready when a grid layout is restored from storage. */
  // private initLayoutForApi(): void {
  //   if (this.isDefaultLayout || this.isDenseLayout) return;
  //
  //   this.selectedLayoutCardCount = this.getLayoutCardCount(this.selectedLayout);
  //   this.totalPages = 1;
  //   this.resetPaginationList(true);
  // }


  // Listen to fullscreen change events
  @HostListener('document:fullscreenchange', [])
  onFullscreenChange() {
    const isFullscreen = !!document.fullscreenElement;
    if (!isFullscreen) {
      this.isFullscreen = false;
      // this.clearShuffle();
      // // Dense stays selected; other layouts return to default when leaving fullscreen
      // if (!this.isDenseLayout) {
      //   this.onChangeLayout('default', false);
      // }
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
    // this.clearShuffle();
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
      { key: 'runTime', label: 'Run Time' },
      { key: 'beamLeft', label: 'Beam Left' },
      { key: 'setPicks', label: 'Set Picks' }
    ]
  } as const;
  protected liveMetrics: Record<string, any> = {};
  protected totalMachines: number = 0;
  // Pagination disabled for now — restore for future use
  // protected totalPages: number = 0;
  protected getMachineLogs(filter: any = {}): void {
    if (!this.selectedMachineStatus) return;
    if (this.showFactoryFilter && !this.selectedWorkspaceId) return;

    const payload: any = {
      status: this.selectedMachineStatus.key,
      ...filter
    };

    // Pagination disabled for now — restore for future use
    // if (!this.isDefaultLayout && !this.isDenseLayout) this.setPageAndLimit(payload);

    this.fetchMachineLogs(payload).subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.liveMetrics = res.data?.aggregateReport || {};
          this.machineLogs = res.data?.machineLogs || [];
          this.totalMachines = this.liveMetrics[payload.status] ?? 0;
          this.currentDateAndTime = this._moment().format(this.currentDateAndTimeFormat);
          this.applyGrouping();

          // Pagination disabled for now — restore for future use
          // if (!this.isDefaultLayout && !this.isDenseLayout && this.selectedLayoutCardCount > 0) {
          //   const totalPages = Math.ceil(this.totalMachines / this.selectedLayoutCardCount);
          //   if (this.totalPages !== totalPages) {
          //     this.totalPages = totalPages;
          //     // Rebuild paging when list length changed or page state was never set (e.g. after refresh)
          //     if (this.isFullscreen || !this.currentPageObj || this.paginationList.length !== totalPages) {
          //       this.resetPaginationList(true);
          //     }
          //   }
          // }

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

  protected fetchMachineLogs(payload: any) {
    return this._apiFs.dashboard.getList(payload);
  }

  protected get selectedWorkspace(): { _id: string; firmName: string } | null {
    if (!this.selectedWorkspaceId) return null;
    return this.workspaceOptions.find(ws => ws._id === this.selectedWorkspaceId) ?? null;
  }

  protected onWorkspaceSelect(workspace: { _id: string; firmName: string } | null): void {
    if (!workspace?._id) return;

    this.selectedWorkspaceId = workspace._id;
    this.onWorkspaceChange();
  }

  protected onWorkspaceChange(): void {
    this.getMachineLogs();
  }

  protected onMachineTypeChange(): void {
    this.getMachineLogs();
  }


  // Pagination disabled for now — restore for future use
  // private resetPaginationList(forceReset: boolean = false): boolean {
  //   const allUsed = this.paginationList.every(p => p.used);
  //   if (!forceReset && !allUsed) return false;
  //
  //   this.paginationList = Array.from(
  //     { length: this.totalPages },
  //     (_, i) => ({ page: i + 1, used: false })
  //   );
  //   if (forceReset) this.currentPageObj = this.paginationList[0];
  //   return true;
  // }
  //
  // protected setPageAndLimit(payload: any): void {
  //   if (this.isDefaultLayout || this.isDenseLayout) return;
  //
  //   if (this.isShuffle) {
  //     const resetDone = this.resetPaginationList();
  //     resetDone && console.log('Pagination list reset for shuffle mode');
  //     // Pick a random page from remaining ones
  //     const availablePages = this.paginationList.filter(p => !p.used);
  //     this.currentPageObj = availablePages[Math.floor(Math.random() * availablePages.length)];
  //     this.currentPageObj.used = true;// mark page as used
  //   }
  //
  //   if (this.currentPageObj) {
  //     // set page and limit in payload
  //     payload.page = this.currentPageObj.page;
  //     payload.limit = this.selectedLayoutCardCount;
  //   }
  // }

  get isDefaultLayout(): boolean {
    return this.selectedLayout === 'default';
  }

  get isDenseLayout(): boolean {
    return !!this.layoutMap[this.selectedLayout]?.autoFill;
  }

  get isGroupedView(): boolean {
    return this.selectedGroupBy !== 'default';
  }

  protected setMetricDisplayMode(mode: MetricDisplayMode): void {
    if (this.metricDisplayMode === mode) return;
    this.metricDisplayMode = mode;
  }

  private readStoredGroupBy(): GroupByOption | null {
    try {
      const stored = localStorage.getItem(StorageKeys.DASHBOARD_GROUP_BY) as GroupByOption | null;
      if (stored && this.groupByOptions.some(o => o.key === stored)) return stored;
    } catch { /* ignore */ }
    return null;
  }

  private persistGroupBy(opt: GroupByOption): void {
    try {
      localStorage.setItem(StorageKeys.DASHBOARD_GROUP_BY, opt);
    } catch { /* ignore */ }
  }

  protected groupByLabel(opt: GroupByOption = this.selectedGroupBy): string {
    return this.groupByOptions.find(o => o.key === opt)?.label ?? 'Default';
  }

  protected onChangeGroupBy(opt: GroupByOption): void {
    if (this.selectedGroupBy === opt) return;
    this.selectedGroupBy = opt;
    this.persistGroupBy(opt);
    this.collapsedGroupKeys.clear();
    this.applyGrouping();
  }

  protected isGroupCollapsed(key: string): boolean {
    return this.collapsedGroupKeys.has(key);
  }

  protected toggleGroupCollapse(key: string): void {
    if (this.collapsedGroupKeys.has(key)) {
      this.collapsedGroupKeys.delete(key);
    } else {
      this.collapsedGroupKeys.add(key);
    }
  }


  private applyGrouping(): void {
    if (this.selectedGroupBy === 'default') {
      this.groupedMachineLogs = [];
      return;
    }

    let groups: IMachineLogGroup[] = [];
    switch (this.selectedGroupBy) {
      case 'efficiency': groups = this.groupByEfficiency(this.machineLogs);
        break;
      case 'group':
      case 'operator':
      case 'quality': groups = this.arrangeByGroup(this.machineLogs, this.selectedGroupBy);
        break;
    }

    // Hide empty groups when any non-default grouping is active
    this.groupedMachineLogs = groups.filter(g => g.machines.length > 0).map(g => ({
      ...g, metrics: this.computeGroupMetrics(g.machines)
    }));
  }

  private computeGroupMetrics(machines: IMachineLog[]): IMachineLogGroup['metrics'] {
    const count = machines.length;
    if (!count) {
      return { efficiency: 0, pick: 0, avgPicks: 0, avgSpeed: 0, count: 0 };
    }

    let efficiencySum = 0, efficiencyCount = 0;
    let pickSum = 0;
    let speedSum = 0;
    let running = 0;

    for (const m of machines) {
      if (Number(m.efficiency) > 0) {
        efficiencySum += Number(m.efficiency);
        efficiencyCount++;
      }
      pickSum += Number(m.picks) || 0;
      speedSum += Number(m.speed) || 0;
      if (Number(m.speed) > 0) running++;
    }

    return {
      efficiency: Math.round(efficiencySum / (efficiencyCount || 1)),
      pick: pickSum,
      avgPicks: Math.round(pickSum / count),
      avgSpeed: running ? Math.round(speedSum / running) : 0,
      count,
    };
  }


  private resolveGroupKeyConfig(log: IMachineLog, groupKey: string): { key: string, label: string } {
    const obj: any = { key: 'ungrouped', label: 'No Group' };
    switch (groupKey) {
      case 'group': {
        if (log.machineGroup) {
          obj.key = log.machineGroup;
          obj.label = log.machineGroup;
        }
        break;
      }
      case 'quality': {
        if (log.quality) {
          obj.key = log.quality;
          obj.label = log.quality;
        }
        break;
      }
      case 'operator': {
        if (log.operator) {
          obj.key = log.operator;
          obj.label = log.operator;
        }
        break;
      }
    }
    return obj;
  }

  private arrangeByGroup(logs: IMachineLog[], groupKey: string): IMachineLogGroup[] {
    const map = new Map<string, IMachineLogGroup>();

    for (const log of logs) {
      const { key, label } = this.resolveGroupKeyConfig(log, groupKey);
      if (!map.has(key)) {
        map.set(key, {
          key,
          label,
          machines: [],
          metrics: { efficiency: 0, pick: 0, avgPicks: 0, avgSpeed: 0, count: 0 },
        });
      }
      map.get(key)!.machines.push(log);
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.key === 'ungrouped') return 1;
      if (b.key === 'ungrouped') return -1;
      return a.label.localeCompare(b.label);
    });
  }

  private groupByEfficiency(logs: IMachineLog[]): IMachineLogGroup[] {
    const groups = EFFICIENCY_BANDS.map(band => ({
      key: band.key,
      label: band.label,
      machines: [] as IMachineLog[],
      metrics: { efficiency: 0, pick: 0, avgPicks: 0, avgSpeed: 0, count: 0 },
    }));

    for (const log of logs) {
      const efficiency = Number(log.efficiency) || 0;
      const band = EFFICIENCY_BANDS.find(b => efficiency >= b.min && efficiency < b.max) ?? EFFICIENCY_BANDS[EFFICIENCY_BANDS.length - 1];
      const group = groups.find(g => g.key === band.key);
      group?.machines.push(log);
    }

    return groups;
  }

  private getLayoutCardCount(opt: LayoutOption): number {
    const config = this.layoutMap[opt];
    return config.rows * config.cols;
  }

  protected updateMachineStatus(status: IMachineStatus): void {
    if (this.selectedMachineStatus.key === status.key) return;

    this.selectedMachineStatus = status;
    // Pagination disabled for now — restore for future use
    // this.totalPages = 1;// reset total pages
    // this.resetPaginationList(true);// reset pagination
    this.getMachineLogs();
  }

  protected layoutLabel(opt: LayoutOption): string {
    return opt === 'dense' ? 'Mini cards' : opt;
  }

  private readStoredLayout(): LayoutOption | null {
    try {
      const stored = localStorage.getItem(StorageKeys.DASHBOARD_LAYOUT) as LayoutOption | null;
      if (stored && this.layoutOptions.includes(stored)) return stored;
    } catch { /* ignore */ }
    return null;
  }

  private getInitialLayoutCardCount(): number {
    if (this.selectedLayout === 'default' || this.layoutMap[this.selectedLayout]?.autoFill) {
      return -1;
    }
    return this.getLayoutCardCount(this.selectedLayout);
  }

  private persistLayout(opt: LayoutOption): void {
    try {
      localStorage.setItem(StorageKeys.DASHBOARD_LAYOUT, opt);
    } catch { /* ignore */ }
  }

  protected onChangeLayout(opt: LayoutOption, exitFullscreen: boolean = true): void {
    if (this.selectedLayout !== opt) {
      this.selectedLayout = opt;
      this.machineLogs = [];// clear current logs

      // Persist user choice; skip when fullscreen exit forces default
      if (opt !== 'default' || exitFullscreen) {
        this.persistLayout(opt);
      }

      if (opt === 'default') {
        this.selectedLayoutCardCount = -1;// reset to default
        // Pagination disabled for now — restore for future use
        // this.totalPages = 0;// reset total pages
        // this.resetPaginationList(true);// reset pagination
        this.getMachineLogs();
        if (exitFullscreen) this.closeFullscreen();
        return;
      }

      // Dense: no fixed page size — load all and scroll
      if (this.layoutMap[opt]?.autoFill) {
        this.selectedLayoutCardCount = -1;
        // Pagination disabled for now — restore for future use
        // this.totalPages = 0;
        // this.clearShuffle();
        // this.resetPaginationList(true);
        this.getMachineLogs();
        return;
      }

      this.selectedLayoutCardCount = this.getLayoutCardCount(opt);
      // Pagination disabled for now — restore for future use
      // this.totalPages = Math.ceil(this.totalMachines / this.selectedLayoutCardCount);
      // this.resetPaginationList(true);// reset pagination
      this.getMachineLogs();// fetch logs with new limit
    }
  }

  get selectedLayoutStr(): string {
    if (this.selectedLayout === 'default' || this.isDenseLayout) {
      return '';
    }
    return `(${this.selectedLayoutCardCount})`;
  }

  get rowClass(): string {
    const config = this.layoutMap[this.selectedLayout];
    if (this.selectedLayout === 'default') {
      return `default-grid ${config.fs || ''}`;
    }
    if (config.autoFill) {
      return 'grid-dense';
    }
    // Under grouped sections, keep column layout but allow rows to grow
    if (this.isGroupedView) {
      return `grid-${this.selectedLayout} custom-fs grouped-auto-rows`;
    }
    return `grid-${this.selectedLayout} custom-fs`;
  }


  // Pagination disabled for now — restore for future use
  // protected isShuffle: boolean = false;
  // // protected paginationSet: Set<number | boolean> = new Set([1, false]);
  // protected paginationList: { page: number, used: boolean }[] = [];
  // protected currentPageObj!: { page: number, used: boolean };
  // protected onRandomPage(): void {
  //   if (this.totalPages <= 1) {
  //     if (this.isShuffle) this.clearShuffle();
  //     return;
  //   }
  //   this.isShuffle = !this.isShuffle;
  //   this.resetPaginationList(true);
  //   this.getMachineLogs();
  // }
  // private clearShuffle(): void {
  //   this.isShuffle = false;
  //   this.resetPaginationList(true);
  // }
  //
  // protected onPaginationButton(state: 'prev' | 'next'): void {
  //   if (this.totalPages <= 1) return;
  //   if (!this.currentPageObj) {
  //     this.currentPageObj = this.paginationList[0];
  //   }
  //
  //   const currentIndex = this.paginationList.findIndex(p => p.page === this.currentPageObj?.page);
  //   let newIndex = currentIndex;
  //   if (state === 'prev') {
  //     newIndex = (currentIndex - 1 + this.paginationList.length) % this.paginationList.length;
  //   } else if (state === 'next') {
  //     newIndex = (currentIndex + 1) % this.paginationList.length;
  //   }
  //
  //   const newPageObj = this.paginationList[newIndex];
  //   if (newPageObj) {
  //     this.currentPageObj = newPageObj;
  //     this.getMachineLogs();
  //   }
  // }



  protected efficiencyClassName(efficiency: number = 0): string {
    if (efficiency === 0) {
      return 'bg-secondary bg-opacity-50';
    }
    if (efficiency >= this.config.efficiencyGoodPer) {
      return 'bg-success';
    } else if (efficiency > this.config.efficiencyAveragePer) {
      return 'bg-warning text-dark';
    } else {
      return 'bg-danger bg-opacity-75';
    }
  }

  protected isLowBeamLeft(machineLog: IMachineLog): boolean {
    const beamLeft = Number(machineLog?.beamLeft);
    if (!Number.isFinite(beamLeft) || beamLeft < 1) return false;
    return beamLeft < this.beamLeftMin;
  }

  protected getStopColumns(machineType: MachineType = 'rapier'): { key: string; label: string }[] {
    return buildStopColumns(machineType);
  }

  protected onTotalStopsClick(machineLog: IMachineLog): void {
    if (!machineLog?.machineCode) return;

    this._router.navigate([`/${ROUTES.BASE}/${ROUTES.REPORT}`], {
      state: {
        reportType: 'stoppageReport',
        machineCode: machineLog.machineCode,
        machineGroupId: machineLog.machineGroupId || undefined,
      },
    });
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


  ngOnDestroy(): void {
    // clean up to avoid memory leaks
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
    }
  }
}