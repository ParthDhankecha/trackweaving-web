import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';

import moment from 'moment';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { CommonDropdown } from '@src/app/shared/components/common-dropdown/common-dropdown';

import { EToasterType } from '@src/app/models/utils.model';
import { getStopColumnsForTypes, hasStopKey, MachineType } from '@src/app/models/machine.model';
import { ROUTES } from '@src/app/constants/app.routes';

interface IReportNavState {
  reportType?: string;
  machineCode?: string;
  machineGroupId?: string;
  workspaceId?: string;
}


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
  /** Captured at construction — `getCurrentNavigation()` is only available then. */
  private readonly navState: IReportNavState | null =
    (this._router.currentNavigation()?.extras?.state as IReportNavState | undefined)
    ?? (history.state as IReportNavState | null)
    ?? null;

  protected readonly _fb = inject(FormBuilder);

  protected showFactoryFilter = false;
  protected workspaceOptions: { _id: string; firmName: string }[] = [];
  protected selectedWorkspaceId = '';


  protected readonly tableShiftObj: any = {
    0: { key: 'dayShift', label: 'Day Shift' },
    1: { key: 'nightShift', label: 'Night Shift' }
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
    { id: 'beamProductionReport', label: 'Beam Production Report' }
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
  protected stoppageTableRows: any[] = [];
  protected stopTimeSelectionError: boolean = false;

  protected get isStoppageReport(): boolean {
    return this.reportType?.value === 'stoppageReport';
  }

  protected get isBeamProductionReport(): boolean {
    return this.reportType?.value === 'beamProductionReport';
  }

  protected get isQualityWiseReport(): boolean {
    return this.reportType?.value === 'qualityProductionReport';
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
    return 10 + this.stopSectionColspan;
  }

  get qualityWiseTableColspan(): number {
    return 9 + this.stopSectionColspan;
  }

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
  }

  @ViewChild('reportTable', { static: false }) reportTable!: ElementRef<HTMLTableElement>;


  protected machinesLoaded = false;
  protected machineGroupsLoaded = false;
  protected navStateConsumed = false;

  ngOnInit(): void {
    this.syncReportTypeValidators();
    this.loadMachineList();
    this.loadMachineGroupList();
    this.loadQualityList();
    this.setSubscriptions();
  }


  protected loadMachineList(): void {
    if (this.showFactoryFilter && !this.selectedWorkspaceId) return;

    this.fetchMachineOptions().subscribe({
      next: (res: any) => {
        if (res.code === 'OK') {
          this.rawMachineList = (res.data || []).map((m: any) => ({ ...m, selected: false }));
          this.machineList = [...this.rawMachineList];
          this.machinesLoaded = true;
          this.applyNavStateAndLoadReport();
        }
      }
    });
  }

  protected fetchMachineOptions() {
    return this._apiFs.machineConfigure.optionList();
  }

  protected loadQualityList(): void {
    if (this.showFactoryFilter && !this.selectedWorkspaceId) return;

    this.fetchQualities().subscribe({
      next: (res: any) => {
        if (res.code === 'OK') {
          this.qualityList = res.data || [];
        }
      }
    });
  }

  protected fetchQualities() {
    return this._apiFs.reports.getQualities();
  }

  protected loadMachineGroupList(): void {
    if (this.showFactoryFilter && !this.selectedWorkspaceId) return;

    this.fetchMachineGroups().subscribe({
      next: (res: any) => {
        if (res.code === 'OK') {
          this.machineGroupList = (res.data || []).map((mg: any) => ({ ...mg, selected: false }));
          this.machineGroupsLoaded = true;
          this.applyNavStateAndLoadReport();
        }
      }
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
    this.reportStopColumns = [];
    this.stoppageTableRows = [];
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
    const machineGroupId = this.navState?.machineGroupId;

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
      const machine = this.machineList.find(m => m.machineCode === machineCode && m.machineGroupId === machineGroupId);

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

  private flattenProductionReportList(parsedList: any[] = [], includeEntireDay = false): any[] {
    const list: any[] = [];
    parsedList.forEach((item: any) => {
      const dayShift = item.reportData?.dayShift;
      if (dayShift) {
        list.push({
          ...dayShift,
          reportDate: item.reportDate,
          shiftLabel: this.tableShiftObj[0].label,
        });
      }

      const nightShift = item.reportData?.nightShift;
      if (nightShift) {
        list.push({
          ...nightShift,
          reportDate: item.reportDate,
          shiftLabel: this.tableShiftObj[1].label,
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
    this.machineIds?.updateValueAndValidity({ emitEvent: false });
    this.quality?.updateValueAndValidity({ emitEvent: false });
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

  private prepareStoppageTableRows(list: any[] = []): void {
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
      const now = moment();
      if (this.isStoppageReport) {
        this.startDate?.patchValue(now.clone().startOf('month').format('YYYY-MM-DD'), { emitEvent: false });
      } else {
        this.startDate?.patchValue(now.format('YYYY-MM-DD'), { emitEvent: false });
        this.endDate?.patchValue(now.format('YYYY-MM-DD'), { emitEvent: false });
      }
      this.reportData = null;
      this.reportStopColumns = [];
      this.stoppageTableRows = [];
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
    if (group) group.selected = group.machines.every((m: any) => m.selected);

    this.toggleSelectAllState();
  }

  // Toggle Select All checkbox state
  protected toggleSelectAllState(onReset: boolean = false): void {
    if (onReset) {
      this.selectAll?.patchValue(false, { emitEvent: false });
      return;
    }
    this.selectAll?.patchValue(this.rawMachineList.every((m: any) => m.selected), { emitEvent: false });
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
      startDate: filter.startDate,
      endDate: filter.endDate,
    };

    if (filter.reportType !== 'beamProductionReport') {
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
          this.reportData.reportTitle = this.reportTypeOptions.find(rt => rt.id === filter.reportType)?.label || 'Report';
          this.reportData.reportType = filter.reportType;
          this.reportData.fromDate = filter.startDate;
          this.reportData.toDate = filter.endDate;

          if (filter.reportType === 'stoppageReport') {
            this.reportStopColumns = [];
            this.prepareStoppageTableRows(this.reportData.list || []);
            this.reportData.stoppageTableRows = this.stoppageTableRows;
            return;
          }

          if (filter.reportType === 'beamProductionReport') {
            this.reportStopColumns = [];
            this.stoppageTableRows = [];
            return;
          }

          if (Array.isArray(this.reportData?.list)) {
            const list = this.flattenProductionReportList(this.reportData.list, filter.shift === 'all');
            this.reportData.list = list;
            this.updateReportStopColumns(list);
            this.reportData.stopColumns = this.reportStopColumns;
          }
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        this.reportData = null;
        this.reportStopColumns = [];
        this.stoppageTableRows = [];
        const msg = err?.error.message || 'An error occurred while generating the report';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }

  protected fetchGenerateReport(payload: any) {
    return this._apiFs.reports.generateReport(payload);
  }

  protected exportAsPDF(): void {
    if (!this.reportTable?.nativeElement) return;
    this._coreService.exportData.exportTableToPDF(this.reportData);
  }

  protected exportAsExcel(): void {
    if (!this.reportTable?.nativeElement) return;
    const filename = `${String(this.reportData?.reportTitle || 'report').toLowerCase().replace(/ +/g, '_')}_${moment().format('YYYYMMDD_HHmmss')}.xlsx`;
    this._coreService.exportData.exportTableToExcel(this.reportTable.nativeElement, filename);
  }


  ngOnDestroy(): void {
    this.subscriptionHandler$.next();
    this.subscriptionHandler$.complete();
  }
}