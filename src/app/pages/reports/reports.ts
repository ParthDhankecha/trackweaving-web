import { Component, ElementRef, inject, NgZone, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';

import moment from 'moment';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { CommonDropdown } from '@src/app/shared/components/common-dropdown/common-dropdown';

import { EToasterType } from '@src/app/models/utils.model';
import { getStopColumnsForTypes, hasStopKey, MachineType, formatQualityReed } from '@src/app/models/machine.model';
import { ROUTES } from '@src/app/constants/app.routes';
import StorageKeys from '@src/app/constants/storage-keys';

interface IReportNavState {
  reportType?: string;
  machineCode?: string;
  machineGroupId?: string;
  workspaceId?: string;
}

type TExportAction = 'download' | 'share';


@Component({
  selector: 'app-reports',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    DecimalPipe,
    DatePipe,
    NgTemplateOutlet,
    CommonDropdown
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.scss'
})
export class Reports {

  // Inject services
  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _router = inject(Router);
  protected readonly _route = inject(ActivatedRoute);
  private readonly _ngZone = inject(NgZone);
  /** Captured at construction — `getCurrentNavigation()` is only available then. */
  private readonly navState: IReportNavState =
    (this._router.currentNavigation()?.extras?.state as IReportNavState | undefined)
    ?? (history.state as IReportNavState) ?? {};

  protected readonly _fb = inject(FormBuilder);

  /** From route data (`device-report` sets `{ isDevice: true }`). */
  protected readonly isDevice = !!this._route.snapshot.data['isDevice'];
  protected isOptionsLoading = false;
  protected showFactoryFilter = false;
  protected workspaceOptions: { _id: string; firmName: string }[] = [];
  protected selectedWorkspaceId = '';


  protected readonly tableShiftObj: Record<string, string> = {
    '0': 'Day Shift',
    '1': 'Night Shift'
  };
  protected readonly shiftOptions: any[] = [
    { id: 'all', val: -1, label: 'All Shift' },
    { id: 'day', val: 0, label: 'Day Shift' },
    { id: 'night', val: 1, label: 'Night Shift' }
  ];
  protected readonly reportTypeOptions: { id: string, label: string }[] = [
    { id: 'productionShiftWise', label: 'Production Shiftwise Report' },
    { id: 'qualityProductionReport', label: 'Quality Production Report' },
    { id: 'stoppageReport', label: 'Stoppage Report' },
    { id: 'beamProductionReport', label: 'Beam Production Report' },
    { id: 'beamCompletionDateReport', label: 'Beam Completion Date Report' }
  ];
  protected readonly stopTimeOptions: { id: string, label: string, value: number }[] = [
    { id: '5', label: '5 mins', value: 5 },
    { id: '10', label: '10 mins', value: 10 },
    { id: '15', label: '15 mins', value: 15 },
    { id: '30', label: '30 mins', value: 30 },
    { id: '45', label: '45 mins', value: 45 }
  ];
  protected readonly stopTimeCustomId = 'custom';
  protected filterForm: FormGroup = this._fb.group({
    reportType: [this.reportTypeOptions[0].id, []],
    startDate: [moment().format('YYYY-MM-DD'), [Validators.required, this.startDateValidator.bind(this)]],
    endDate: [moment().format('YYYY-MM-DD'), [Validators.required, this.endDateValidator.bind(this)]],
    shift: [this.shiftOptions[0].id, []],
    stopTimeFilter: [this.stopTimeOptions[0].id, []],
    customStopMinutes: [{ value: null, disabled: true }, []],
    groupByMachine: [false, []],
    selectAll: [false, []],
    machineIds: [null, [Validators.required]],
    quality: ['', []],
  });

  protected rawMachineList: any[] = [];
  protected machineList: any[] = [];
  protected machineGroupList: any[] = [];
  protected qualityList: string[] = [];
  private subscriptionHandler$ = new Subject<void>();

  protected reportData: any;
  protected reportStopColumns: { key: string; label: string }[] = [];
  protected showBeamCompletionDateColumn = false;
  protected stoppageTableRows: any[] = [];
  protected stopTimeSelectionError: boolean = false;
  protected stoppageViewMode: 'machineWise' | 'timeWise' = 'machineWise';
  protected by24Hours: boolean = false;
  protected readonly stoppageViewOptions: { id: 'machineWise' | 'timeWise'; label: string }[] = [
    { id: 'machineWise', label: 'Machine Wise' },
    { id: 'timeWise', label: 'Time Wise (Descending)' }
  ];


  protected get isTimeWiseStoppageView(): boolean {
    return this.stoppageViewMode === 'timeWise';
  }

  protected get isStoppageReport(): boolean {
    return this.reportType?.value === 'stoppageReport';
  }

  protected get isBeamProductionReport(): boolean {
    return this.reportType?.value === 'beamProductionReport';
  }

  protected get isBeamCompletionDateReport(): boolean {
    return this.reportType?.value === 'beamCompletionDateReport';
  }

  protected get isDateRangeReport(): boolean {
    return !this.isBeamCompletionDateReport;
  }

  protected get isQualityWiseReport(): boolean {
    return this.reportType?.value === 'qualityProductionReport';
  }

  protected get isProductionShiftWiseReport(): boolean {
    return this.reportData?.reportType === 'productionShiftWise';
  }

  protected get showBy24HoursOption(): boolean {
    return this.isProductionShiftWiseReport && this.shift?.value === 'all';
  }

  protected get showMachineSelection(): boolean {
    return !this.isQualityWiseReport;
  }

  protected get isCustomStopTime(): boolean {
    return this.stopTimeFilter?.value === this.stopTimeCustomId;
  }

  get stopSectionColspan(): number {
    return this.reportStopColumns.length * 2 + 3;
  }

  get reportTableColspan(): number {
    return (this.showBeamCompletionDateColumn ? 11 : 10) + this.stopSectionColspan;
  }

  get qualityWiseTableColspan(): number {
    return (this.showBeamCompletionDateColumn ? 10 : 9) + this.stopSectionColspan;
  }

  get shiftTotalAvgColspan(): number {
    return this.showBeamCompletionDateColumn ? 3 : 2;
  }

  get by24HoursTableColspan(): number {
    // // Date + Machine + Quality + Shift + (7 metrics * 2) + optional beam date (1)
    // // + (stopColumns * 4) + Total Stops (4)
    return 4 + ((this.reportDataBy24Hours?.shiftColumns?.length ?? 0) * 2) + (this.showBeamCompletionDateColumn ? 1 : 0);
  }

  protected formatQualityReed = formatQualityReed;

  protected getStopValue(data: any, key: string, field: 'count' | 'duration'): string | number {
    if (!hasStopKey((data?.machineType || 'rapier') as MachineType, key)) {
      return field === 'count' ? 0 : '-';
    }
    const value = data?.stopsData?.[key]?.[field];
    return value ?? (field === 'count' ? 0 : '-');
  }

  private updateReportStopColumns(reportList: any[]): void {
    const machineTypes = new Set<MachineType>();
    reportList.forEach(item => {
      (item.list || []).forEach((data: any) => {
        machineTypes.add((data.machineType || 'rapier') as MachineType);
      });
    });
    this.reportStopColumns = getStopColumnsForTypes([...machineTypes]);
    this.showBeamCompletionDateColumn = reportList.some(item =>
      (item.list || []).some((data: any) => !!data.beamCompletionDate)
    );
  }


  @ViewChild('reportTable', { static: false }) reportTable!: ElementRef<HTMLTableElement>;
  @ViewChild('machineCol', { static: false }) machineCol!: ElementRef<HTMLTableCellElement>;
  @ViewChild('reportTableScroll', { static: false }) reportTableScroll!: ElementRef<HTMLElement>;


  private machineColumnInitialLeft: number = 0;
  protected isTableScrolledX: boolean = false;
  private refreshStickyState(options: { delay?: number; force?: boolean } = {}): void {
    const { delay = 10, force = false } = options;

    // Sticky `left` is based on the column's natural offset. Measure only after
    // sticky is off and the real scroll container (not the <table>) is at 0.
    this.isTableScrolledX = false;
    this.resetReportTableScroll();

    setTimeout(() => {
      requestAnimationFrame(() => {
        this.resetReportTableScroll();

        const table = this.reportTable?.nativeElement;
        const machine = this.machineCol?.nativeElement;
        if (!table || !machine) return;

        if (this.machineColumnInitialLeft === 0 || force) {
          const tableRect = table.getBoundingClientRect();
          const machineRect = machine.getBoundingClientRect();
          this.machineColumnInitialLeft = machineRect.left - tableRect.left + 1;
        }
      });
    }, delay);
  }
  private resetReportTableScroll(): void {
    const container = this.reportTableScroll?.nativeElement;
    if (container) container.scrollLeft = 0;
  }
  protected onReportTableScroll(event: Event): void {
    const container = event.currentTarget as HTMLElement;
    if (!container) return;

    const isScrolled = container.scrollLeft > this.machineColumnInitialLeft;
    if (isScrolled !== this.isTableScrolledX) {
      this.isTableScrolledX = isScrolled;
    }
  }


  protected machinesLoaded = false;
  protected machineGroupsLoaded = false;
  protected navStateConsumed = false;

  ngOnInit(): void {
    this.syncReportTypeValidators();
    this.setSubscriptions();

    if (this.isDevice) {
      // WebView invokes this outside NgZone; wrap so the view updates.
      (window as any).setDeviceToken = (token: string, state?: IReportNavState) => {
        this._ngZone.run(() => this.setDeviceToken(token, state));
      };
    } else {
      this.initialize();
    }
  }

  private async initialize(): Promise<void> {
    this.isOptionsLoading = true;
    try {
      await Promise.allSettled([
        this.loadMachineList(),
        this.loadMachineGroupList(),
        this.loadQualityList()
      ]);
    } finally {
      this.isOptionsLoading = false;
    }
  }

  setDeviceToken(token: string, state?: IReportNavState): void {
    if (typeof token !== 'string' || !token?.trim()) return;

    // clear all local storage items & set new token
    localStorage.clear();
    localStorage.setItem(StorageKeys.ACCESS_TOKEN, token.trim());
    if (state) {
      try {
        Object.assign(this.navState, state);
      } catch (error) { }
    }
    // initialize the page
    this.initialize();
  }


  protected async loadMachineList(): Promise<void> {
    if (this.showFactoryFilter && !this.selectedWorkspaceId) return Promise.resolve();

    return new Promise<void>((resolve) => {
      this.fetchMachineOptions().subscribe({
        next: (res: any) => {
          if (res.code === 'OK') {
            this.rawMachineList = (res.data || []).map((m: any) => ({ ...m, selected: false }));
            this.machineList = [...this.rawMachineList];
            if (this.groupByMachine?.value) {
              this.groupByMachine?.patchValue(false, { emitEvent: false });
            }
            this.machinesLoaded = true;
            this.applyNavStateAndLoadReport();
          }
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  protected fetchMachineOptions() {
    return this._apiFs.machineConfigure.optionList();
  }

  protected async loadQualityList(): Promise<void> {
    if (this.showFactoryFilter && !this.selectedWorkspaceId) return Promise.resolve();

    return new Promise<void>((resolve) => {
      this.fetchQualities().subscribe({
        next: (res: any) => {
          if (res.code === 'OK') {
            this.qualityList = res.data || [];
          }
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  protected fetchQualities() {
    return this._apiFs.reports.getQualities();
  }

  protected async loadMachineGroupList(): Promise<void> {
    if (this.showFactoryFilter && !this.selectedWorkspaceId) return Promise.resolve();

    return new Promise<void>((resolve) => {
      this.fetchMachineGroups().subscribe({
        next: (res: any) => {
          if (res.code === 'OK') {
            this.machineGroupList = (res.data || []).map((mg: any) => ({ ...mg, selected: false }));
            this.machineGroupsLoaded = true;
            this.applyNavStateAndLoadReport();
          }
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  protected fetchMachineGroups() {
    return this._apiFs.machineGroup.list();
  }

  protected get selectedWorkspace(): { _id: string; firmName: string } | null {
    if (!this.selectedWorkspaceId) return null;
    return this.workspaceOptions.find(ws => ws._id === this.selectedWorkspaceId) ?? null;
  }

  protected onWorkspaceSelect(workspace: { _id: string; firmName: string } | null): void {
    if (!workspace?._id || workspace._id === this.selectedWorkspaceId) return;
    this.navStateConsumed = true;
    this.selectedWorkspaceId = workspace._id;
    this.onWorkspaceChange();
  }

  protected goToManufacturerDashboard(): void {
    if (!this.showFactoryFilter) return;

    this._router.navigate(
      [ROUTES.MANUFACTURER.getFullRoute(ROUTES.MANUFACTURER.DASHBOARD)],
      { state: this.selectedWorkspaceId ? { workspaceId: this.selectedWorkspaceId } : undefined }
    );
  }

  protected onWorkspaceChange(): void {
    this.machinesLoaded = false;
    this.machineGroupsLoaded = false;
    this.rawMachineList = [];
    this.machineList = [];
    this.machineGroupList = [];
    this.qualityList = [];
    this.reportData = null;
    this.isTableScrolledX = false;
    this.reportStopColumns = [];
    this.stoppageTableRows = [];
    this.stoppageViewMode = 'machineWise';
    this.by24Hours = false;
    this.reportDataBy24Hours = null;
    this.machineIds?.patchValue(null, { emitEvent: false });
    this.selectAll?.patchValue(false, { emitEvent: false });
    this.loadMachineList();
    this.loadMachineGroupList();
    this.loadQualityList();
  }

  /** Prefill filters from dashboard navigation state and auto-generate the report. */
  protected applyNavStateAndLoadReport(): void {
    if (!this.machinesLoaded || !this.machineGroupsLoaded || this.navStateConsumed) return;

    const workspaceId = this.navState?.workspaceId;
    if (workspaceId && workspaceId !== this.selectedWorkspaceId) {
      this.selectedWorkspaceId = workspaceId;
      this.onWorkspaceChange();
      return;
    }

    this.navStateConsumed = true;

    const reportType = this.navState?.reportType;
    const machineCode = this.navState?.machineCode;

    if (!reportType && !machineCode) return;

    if (reportType && this.reportTypeOptions.some(o => o.id === reportType)) {
      this.reportType?.patchValue(reportType, { emitEvent: false });
      if (reportType === 'stoppageReport') {
        // custom stop time filter
        this.stopTimeFilter?.patchValue(this.stopTimeCustomId, { emitEvent: false });
        this.customStopMinutes?.patchValue(1, { emitEvent: false });
        this.syncCustomStopMinutesControl();
      }
    }

    if (machineCode) {
      const machine = this.machineList.find(m => m.machineCode === machineCode);

      if (machine) {
        machine.selected = true;
      }
      this.machineIds?.patchValue(machine ? [machine._id] : null, { emitEvent: false });
      this.toggleSelectAllState();
    }

    if (this.rawMachineList.some(m => m.selected)) {
      this.onShowReport();
    }
  }


  get reportType(): AbstractControl | null {
    return this.filterForm.get('reportType');
  }
  get startDate(): AbstractControl | null {
    return this.filterForm?.get('startDate');
  }
  get endDate(): AbstractControl | null {
    return this.filterForm?.get('endDate');
  }
  get shift(): AbstractControl | null {
    return this.filterForm.get('shift');
  }
  get groupByMachine(): AbstractControl | null {
    return this.filterForm.get('groupByMachine');
  }
  get selectAll(): AbstractControl | null {
    return this.filterForm.get('selectAll');
  }
  get machineIds(): AbstractControl | null {
    return this.filterForm.get('machineIds');
  }
  get quality(): AbstractControl | null {
    return this.filterForm.get('quality');
  }
  get stopTimeFilter(): AbstractControl | null {
    return this.filterForm.get('stopTimeFilter');
  }
  get customStopMinutes(): AbstractControl | null {
    return this.filterForm.get('customStopMinutes');
  }


  protected isNightShift(shift: number | string): boolean {
    return shift === 1 || shift === this.tableShiftObj['1'];
  }

  private flattenProductionReportList(parsedList: any[] = [], includeEntireDay = false): any[] {
    const list: any[] = [];
    parsedList.forEach((item: any) => {
      const dayShift = item.reportData?.dayShift;
      if (dayShift) {
        list.push({
          ...dayShift,
          reportDate: item.reportDate,
          shiftLabel: this.tableShiftObj['0'],
        });
      }

      const nightShift = item.reportData?.nightShift;
      if (nightShift) {
        list.push({
          ...nightShift,
          reportDate: item.reportDate,
          shiftLabel: this.tableShiftObj['1'],
        });
      }
      if (includeEntireDay && dayShift && nightShift) {
        list.at(-1).fullDay = this.buildEntireDayTotal(item.reportDate, dayShift, nightShift);
      }
    });
    return list;
  }

  private buildEntireDayTotal(reportDate: string, dayShift: any, nightShift: any): any {
    const shiftCount = 2;
    return {
      reportDate,
      shiftLabel: 'Full Day',
      prodMeter: (dayShift.prodMeter || 0) + (nightShift.prodMeter || 0),
      totalPicks: (dayShift.totalPicks || 0) + (nightShift.totalPicks || 0),
      efficiency: Math.round(((dayShift.efficiency || 0) + (nightShift.efficiency || 0)) / shiftCount),
      realEfficiency: Math.round((((dayShift.realEfficiency || 0) + (nightShift.realEfficiency || 0)) / shiftCount) * 10) / 10,
      avgSpeed: Math.round(((dayShift.avgSpeed || 0) + (nightShift.avgSpeed || 0)) / shiftCount),
      avgPicks: Math.round(((dayShift.avgPicks || 0) + (nightShift.avgPicks || 0)) / shiftCount),
    };
  }

  protected syncReportTypeValidators(): void {
    if (this.isQualityWiseReport) {
      this.machineIds?.clearValidators();
      this.quality?.setValidators([Validators.required]);
    } else {
      this.quality?.clearValidators();
      this.machineIds?.setValidators([Validators.required]);
    }

    if (this.isBeamCompletionDateReport) {
      this.startDate?.clearValidators();
      this.endDate?.clearValidators();
    } else {
      this.startDate?.setValidators([Validators.required, this.startDateValidator.bind(this)]);
      this.endDate?.setValidators([Validators.required, this.endDateValidator.bind(this)]);
    }

    this.machineIds?.updateValueAndValidity({ emitEvent: false });
    this.quality?.updateValueAndValidity({ emitEvent: false });
    this.startDate?.updateValueAndValidity({ emitEvent: false });
    this.endDate?.updateValueAndValidity({ emitEvent: false });
  }

  private getSelectedMinStopMinutes(): number | null {
    const filter = this.stopTimeFilter?.value;
    if (filter === this.stopTimeCustomId) {
      const customMins = Number(this.customStopMinutes?.value);
      return customMins > 0 ? customMins : null;
    }
    const option = this.stopTimeOptions.find(o => o.id === filter);
    return option ? option.value : null;
  }

  private getDateGroupKey(row: any): string {
    return `${row.reportDate}`;
  }

  private getShiftGroupKey(row: any): string {
    return `${row.reportDate}|${row.shift}|${row.shiftLabel}`;
  }

  private getMachineGroupKey(row: any): string {
    return `${row.reportDate}|${row.shift}|${row.shiftLabel}|${row.machineCode}`;
  }

  private countGroupSpan(list: any[], startIndex: number, keyFn: (row: any) => string): number {
    const key = keyFn(list[startIndex]);
    let count = 1;
    for (let i = startIndex + 1; i < list.length; i++) {
      if (keyFn(list[i]) === key) count++;
      else break;
    }
    return count;
  }

  private getStopDurationSeconds(row: any): number {
    if (!row?.from || !row?.to) return 0;
    return Math.max(0, new Date(row.to).getTime() - new Date(row.from).getTime()) / 1000;
  }

  private prepareStoppageTableRows(list: any[] = []): void {
    if (this.isTimeWiseStoppageView) {
      this.prepareTimeWiseStoppageTableRows(list);
      return;
    }

    const rows: any[] = [];
    let shiftGroupIndex = 0;

    list.forEach((row, index) => {
      const prevRow = index > 0 ? list[index - 1] : null;
      const isDateStart = !prevRow || this.getDateGroupKey(row) !== this.getDateGroupKey(prevRow);
      const isShiftStart = !prevRow || this.getShiftGroupKey(row) !== this.getShiftGroupKey(prevRow);
      const isMachineStart = !prevRow || this.getMachineGroupKey(row) !== this.getMachineGroupKey(prevRow);

      if (isShiftStart && index > 0) shiftGroupIndex++;

      rows.push({
        ...row,
        showDate: isDateStart,
        dateRowspan: isDateStart ? this.countGroupSpan(list, index, r => this.getDateGroupKey(r)) : undefined,
        showShift: isShiftStart,
        shiftRowspan: isShiftStart ? this.countGroupSpan(list, index, r => this.getShiftGroupKey(r)) : undefined,
        showMachine: isMachineStart,
        machineRowspan: isMachineStart ? this.countGroupSpan(list, index, r => this.getMachineGroupKey(r)) : undefined,
        groupEven: shiftGroupIndex % 2 === 0
      });
    });

    this.stoppageTableRows = rows;
  }

  private prepareTimeWiseStoppageTableRows(list: any[] = []): void {
    const sorted = [...list].sort((a, b) => {
      const durationDiff = this.getStopDurationSeconds(b) - this.getStopDurationSeconds(a);
      if (durationDiff !== 0) return durationDiff;
      return new Date(b.from || 0).getTime() - new Date(a.from || 0).getTime();
    });

    this.stoppageTableRows = sorted.map((row, index) => ({
      ...row,
      groupEven: index % 2 === 0
    }));
  }

  protected onStoppageViewModeChange(mode: 'machineWise' | 'timeWise'): void {
    this.stoppageViewMode = mode;
    if (!this.reportData?.list) return;

    this.prepareStoppageTableRows(this.reportData.list);
    this.reportData.stoppageViewMode = mode;
    this.reportData.stoppageTableRows = this.stoppageTableRows;
  }

  private syncStoppageReportRows(): void {
    if (!this.reportData?.list) return;

    this.prepareStoppageTableRows(this.reportData.list);
    this.reportData.stoppageViewMode = this.stoppageViewMode;
    this.reportData.stoppageTableRows = this.stoppageTableRows;
  }


  // start and end date validators
  private startDateValidator(control: AbstractControl): ValidationErrors | null {
    if (this.endDate && !this.endDate?.touched) this.endDate.markAsTouched();
    this.endDate?.updateValueAndValidity();
    return null;
  }
  private endDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.startDate) return null; // Form not initialized yet

    const startDate = this.startDate?.value;
    const endDate = control.value;

    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if end date is before start date
    if (end < start) {
      return { invalidRange: true };
    }
    return null;
  }


  protected setSubscriptions(): void {
    this.reportType?.valueChanges.pipe(
      takeUntil(this.subscriptionHandler$)
    ).subscribe(() => {
      this.syncReportTypeValidators();

      const today = moment().format('YYYY-MM-DD');
      this.startDate?.patchValue(today, { emitEvent: false });
      this.endDate?.patchValue(today, { emitEvent: false });
      this.reportData = null;
      this.isTableScrolledX = false;
      this.reportStopColumns = [];
      this.stoppageTableRows = [];
      this.stoppageViewMode = 'machineWise';
      this.by24Hours = false;
      this.reportDataBy24Hours = null;
      this.machineColumnInitialLeft = 0;
    });
    this.groupByMachine?.valueChanges.pipe(
      debounceTime(10),
      takeUntil(this.subscriptionHandler$)
    ).subscribe(val => {
      this.arrangeMachineList(val);
    });
    this.selectAll?.valueChanges.pipe(
      debounceTime(10),
      takeUntil(this.subscriptionHandler$)
    ).subscribe(value => {
      this.onSelectAllChange(value);
    });
    this.stopTimeFilter?.valueChanges.pipe(
      takeUntil(this.subscriptionHandler$)
    ).subscribe(() => {
      this.syncCustomStopMinutesControl();
    });
  }

  private syncCustomStopMinutesControl(): void {
    const control = this.customStopMinutes;
    if (!control) return;

    if (this.isCustomStopTime) {
      if (control.disabled) control.enable({ emitEvent: false });
    } else if (control.enabled) {
      control.disable({ emitEvent: false });
    }
  }

  protected arrangeMachineList(flag: boolean): void {
    if (flag) {
      // Group machines by their machine groups
      const groupedMachines: any = [];
      this.machineGroupList.forEach(mg => {
        const mgId = String(mg._id ?? '');
        const list = this.rawMachineList.filter(m => String(m.machineGroupId ?? '') === mgId);
        if (list.length > 0) {
          groupedMachines.push({
            _id: mg._id,
            groupName: mg.groupName,
            machines: list.map(m => {
              m.selected = false;
              return m;
            }),
            selected: false
          });
        }
      });
      const otherMachines = this.rawMachineList.filter(m => !m.machineGroupId);
      if (otherMachines.length > 0) {
        groupedMachines.push({
          _id: 'other',
          groupName: 'Other Machines',
          machines: otherMachines.map(m => {
            m.selected = false;
            return m;
          }),
          selected: false
        }); // For machines without a group
      }
      this.machineList = groupedMachines;
    } else {
      // Show flat machine list
      this.machineList = this.rawMachineList.map(m => {
        m.selected = false;
        return m;
      });
    }
    this.toggleSelectAllState(true);
  }

  protected onMachineGroupSelectionChange(event: boolean, machineGroup: any): void {
    const isSelected = event;
    if (machineGroup && Array.isArray(machineGroup.machines)) {
      machineGroup.machines.forEach((m: any) => m.selected = isSelected);
    }
    this.toggleSelectAllState();
  }

  protected onSelectAllChange(event: boolean): void {
    const isSelected = event;
    const isGroupByMachine = this.groupByMachine?.value;
    if (isGroupByMachine) {
      // Select/Deselect all machine groups and their machines
      this.machineList.forEach((mg: any) => {
        mg.selected = isSelected;
        if (Array.isArray(mg.machines)) {
          mg.machines.forEach((m: any) => m.selected = isSelected);
        }
      });
    } else {
      // Select/Deselect all individual machines
      this.machineList.forEach((m: any) => m.selected = isSelected);
    }
    this.toggleSelectAllState();
  }

  protected onMachineSelectionChange(group: any = null): void {
    // Update machine group selection based on individual machine selections
    if (group) group.selected = group.machines?.length > 0 && group.machines.every((m: any) => m.selected);

    this.toggleSelectAllState();
  }

  // Toggle Select All checkbox state
  protected toggleSelectAllState(onReset: boolean = false): void {
    if (onReset) {
      this.selectAll?.patchValue(false, { emitEvent: false });
      return;
    }
    this.selectAll?.patchValue(this.rawMachineList?.length > 0 && this.rawMachineList.every((m: any) => m.selected), { emitEvent: false });
    if (this.machineIds?.errors) {
      this.machineIds.setErrors(null);
    }
  }


  protected isReqAlive: boolean = false;
  protected onShowReport(): void {
    if (this.isReqAlive) return;
    if (this.showFactoryFilter && !this.selectedWorkspaceId) return;

    if (!this.isQualityWiseReport) {
      const machineIds = this.rawMachineList.filter(m => m.selected).map(m => m._id);
      this.machineIds?.patchValue(machineIds.length > 0 ? machineIds : null);
    }

    if (this.isStoppageReport) {
      const minStopMinutes = this.getSelectedMinStopMinutes();
      if (!minStopMinutes) {
        this.stopTimeSelectionError = true;
        this.customStopMinutes?.markAsTouched();
        return;
      }
      this.stopTimeSelectionError = false;
      this.customStopMinutes?.setErrors(null);
    }

    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }

    const filter = this.filterForm.value;
    const payload: any = {
      reportType: filter.reportType,
    };

    if (this.isDateRangeReport) {
      payload.startDate = filter.startDate;
      payload.endDate = filter.endDate;
    }

    if (filter.reportType !== 'beamProductionReport' && filter.reportType !== 'beamCompletionDateReport') {
      const shiftCb = filter.shift === 'all' ? (val: any) => val.id !== 'all' : (val: any) => val.id === filter.shift;
      payload.shift = this.shiftOptions.filter(shiftCb).map(o => o.val);
    }

    if (filter.reportType === 'qualityProductionReport') {
      payload.quality = filter.quality;
    } else {
      payload.machineIds = this.rawMachineList.filter(m => m.selected).map(m => m._id);
    }

    if (filter.reportType === 'stoppageReport') {
      payload.minStopMinutes = this.getSelectedMinStopMinutes();
    }

    if (this.showFactoryFilter) {
      payload.workspaceId = this.selectedWorkspaceId;
    }

    this.isReqAlive = true;
    this.fetchGenerateReport(payload).subscribe({
      next: (res: any) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this.reportData = res.data || {};
          this.isTableScrolledX = false;
          this.reportData.reportTitle = this.reportTypeOptions.find(rt => rt.id === filter.reportType)?.label || 'Report';
          this.reportData.reportType = filter.reportType;
          this.reportData.fromDate = filter.startDate;
          this.reportData.toDate = filter.endDate;
          this.by24Hours = false;
          this.reportDataBy24Hours = null;

          if (filter.reportType === 'stoppageReport') {
            this.reportStopColumns = [];
            this.stoppageViewMode = 'machineWise';
            this.syncStoppageReportRows();
            return;
          }

          if (filter.reportType === 'beamProductionReport') {
            this.reportStopColumns = [];
            this.stoppageTableRows = [];
            return;
          }

          if (filter.reportType === 'beamCompletionDateReport') {
            this.reportStopColumns = [];
            this.stoppageTableRows = [];
            this.showBeamCompletionDateColumn = false;
            return;
          }

          if (Array.isArray(this.reportData?.list)) {
            const list = this.flattenProductionReportList(this.reportData.list, filter.shift === 'all');
            this.reportData.list = list;
            this.updateReportStopColumns(list);
            this.reportData.stopColumns = this.reportStopColumns;
            this.reportData.showBeamCompletionDateColumn = this.showBeamCompletionDateColumn;

            this.refreshStickyState();
          }
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        this.reportData = null;
        this.isTableScrolledX = false;
        this.reportStopColumns = [];
        this.showBeamCompletionDateColumn = false;
        this.stoppageTableRows = [];
        this.by24Hours = false;
        this.reportDataBy24Hours = null;
        const msg = err?.error.message || 'An error occurred while generating the report';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }

  protected fetchGenerateReport(payload: any) {
    return this._apiFs.reports.generateReport(payload);
  }


  protected reportDataBy24Hours: any = null;
  protected onBy24HoursChange(enabled: boolean): void {
    if (!this.reportData || this.reportData.reportType !== 'productionShiftWise') return;

    if (!enabled || this.reportDataBy24Hours !== null) {
      this.refreshStickyState({ force: true });
      return;
    }

    const { list, ...rest } = this.reportData;
    this.reportDataBy24Hours = {
      ...rest,
      list: [],
      shiftColumns: Array.from({ length: 7 + (rest.stopColumns.length * 2) + 2 }, (_, i) => ({
        key: `cell_${i + 1}`,
        label: (i == 2 || i == 3) ? 'Avg' : 'Total'
      })),
    };

    const groupByDate: Map<string, Record<string, any>> = new Map();

    const dayShiftLabel = this.tableShiftObj['0'];
    const nightShiftLabel = this.tableShiftObj['1'];
    for (const item of list) {
      const key = item.reportDate;
      if (!groupByDate.has(key)) groupByDate.set(key, {});

      const val: any = groupByDate.get(key);
      if (item.shiftLabel === dayShiftLabel) {
        val.day = item;
      } else if (item.shiftLabel === nightShiftLabel) {
        val.night = item;
        if (item.fullDay) {
          val.fullDay = item.fullDay;
        }
      }
    }

    const result: any[] = [];
    for (const [reportDate, { day, night, fullDay }] of groupByDate) {
      const machineMap = new Map<string, Record<string, any>>();

      for (const machine of day?.list ?? []) {
        const id = String(machine.machineId ?? machine.machineCode);
        machineMap.set(id, {
          machineId: machine.machineId,
          machineCode: machine.machineCode,
          day: { ...machine },
          night: null
        });
      }
      for (const machine of night?.list ?? []) {
        const id = String(machine.machineId ?? machine.machineCode);
        const existing: any = machineMap.get(id);
        if (existing) {
          existing.night = { ...machine };
        } else {
          machineMap.set(id, {
            machineId: machine.machineId,
            machineCode: machine.machineCode,
            day: null,
            night: { ...machine },
          });
        }
      }

      const list = [...machineMap.values()].map(
        entry => this.mergeMachineDayNight(entry)
      ).sort((a, b) =>
        String(a.machineCode || '').localeCompare(String(b.machineCode || ''))
      );

      const dateTotals = fullDay ?? {
        reportDate,
        prodMeter: (day ?? night)?.prodMeter ?? 0,
        totalPicks: (day ?? night)?.totalPicks ?? 0,
        efficiency: (day ?? night)?.efficiency ?? 0,
        realEfficiency: (day ?? night)?.realEfficiency ?? 0,
        avgSpeed: (day ?? night)?.avgSpeed ?? 0,
        avgPicks: (day ?? night)?.avgPicks ?? 0
      };

      result.push({
        ...dateTotals,
        reportDate,
        list
      });
    }

    this.reportDataBy24Hours.list = result;
    this.refreshStickyState({ force: true });
  }

  private mergeMachineDayNight(entry: Record<string, any>): any {
    const { day, night } = entry;
    const qualityParts: string[] = [];
    if (day) qualityParts.push(formatQualityReed(day.quality, day.reed));
    if (night) {
      const nightQuality = formatQualityReed(night.quality, night.reed);
      if (!qualityParts.includes(nightQuality)) qualityParts.push(nightQuality);
    }

    return {
      machineId: entry['machineId'],
      machineCode: entry['machineCode'],
      qualityLabel: qualityParts.filter(Boolean).join(' / ') || '-',
      day: day || null,
      night: night || null,
      total: {
        pieceLengthM: (day?.pieceLengthM ?? 0) + (night?.pieceLengthM ?? 0),
        picksCurrentShift: (day?.picksCurrentShift ?? 0) + (night?.picksCurrentShift ?? 0),
        efficiencyPercent: this.avgDefined([day?.efficiencyPercent, night?.efficiencyPercent]),
        realEfficiencyPercent: this.avgDefined([day?.realEfficiencyPercent, night?.realEfficiencyPercent]),
        speedRpm: this.avgDefined([day?.speedRpm || null, night?.speedRpm || null]),
        runTime: this.sumRunTime([day?.runTime, night?.runTime]),
        beamLeft: night?.beamLeft ?? day?.beamLeft ?? 0,
        stopsData: this.mergeStopsData(day?.stopsData, night?.stopsData),
      }
    };
  }
  private avgDefined(values: Array<number | null | undefined>): number | null {
    const nums = values.filter((v): v is number => v != null && Number.isFinite(Number(v))).map(Number);
    if (!nums.length) return null;
    const avg = nums.reduce((sum, n) => sum + n, 0) / nums.length;
    return Math.round(avg);
  }
  private sumRunTime(values: Array<string | null | undefined>): string | null {
    const validValues = values.filter((value): value is string => !!value?.trim?.());
    if (!validValues.length) { return null; }

    const totalMinutes = validValues.reduce((total, value) => {
      const [hours, minutes] = value.split(':').map(Number);
      return total + moment.duration({ hours, minutes }).asMinutes();
    }, 0);

    const duration = moment.duration(totalMinutes, 'minutes');
    return `${Math.floor(duration.asHours()).toString().padStart(2, '0')}:${duration.minutes().toString().padStart(2, '0')}`;
  }
  private mergeStopsData(dayStops: any = {}, nightStops: any = {}): any {
    const keys = new Set<string>([
      ...Object.keys(dayStops || {}),
      ...Object.keys(nightStops || {})
    ]);
    const merged: any = {};

    keys.forEach(key => {
      const dayCount = Number(dayStops?.[key]?.count) || 0;
      const nightCount = Number(nightStops?.[key]?.count) || 0;
      merged[key] = {
        count: dayCount + nightCount,
        duration: this.sumRunTime([dayStops?.[key]?.duration, nightStops?.[key]?.duration]) || '00:00'
      };
    });

    return merged;
  }


  protected isPdfExporting: boolean = false;
  protected exportAsPDF(action?: TExportAction): void {
    if (!this.reportTable?.nativeElement || this.isPdfExporting) return;

    if (this.by24Hours) {
      if (!this.reportDataBy24Hours) return;

      this.isPdfExporting = true;
      this._coreService.exportData.exportTableToPDF({
        ...this.reportDataBy24Hours,
        isBy24Hours: true,
        reportTitle: `${this.reportData?.reportTitle || 'Report'} (By 24 Hours)`,
      }, {
        isDevice: this.isDevice,
        action: this.isDevice ? action : undefined
      }).finally(() => {
        this.isPdfExporting = false;
      });
      return;
    }

    this.isPdfExporting = true;
    this._coreService.exportData.exportTableToPDF(this.reportData, {
      isDevice: this.isDevice,
      action: this.isDevice ? action : undefined
    }).finally(() => {
      this.isPdfExporting = false;
    });
  }

  protected isExcelExporting: boolean = false;
  protected exportAsExcel(action?: TExportAction): void {
    if (!this.reportTable?.nativeElement || this.isExcelExporting) return;

    this.isExcelExporting = true;
    const filename = `${String(this.reportData?.reportTitle || 'report').toLowerCase().replace(/ +/g, '_')}_${moment().format('YYYYMMDD_HHmmss')}.xlsx`;
    this._coreService.exportData.exportTableToExcel(this.reportTable.nativeElement, filename, {
      isDevice: this.isDevice,
      action: this.isDevice ? action : undefined
    }).finally(() => {
      this.isExcelExporting = false;
    });
  }


  ngOnDestroy(): void {
    if (this.isDevice) {
      delete (window as any).setDeviceToken;
    }
    this.subscriptionHandler$.next();
    this.subscriptionHandler$.complete();
  }
}