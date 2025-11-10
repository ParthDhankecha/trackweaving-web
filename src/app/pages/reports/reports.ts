import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { DatePipe, DecimalPipe } from '@angular/common';

import moment from 'moment';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';

import { EToasterType } from '@src/app/models/utils.model';


@Component({
  selector: 'app-reports',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    DecimalPipe,
    DatePipe
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.scss'
})
export class Reports {

  // Inject services
  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);

  protected readonly _fb = inject(FormBuilder);


  protected readonly tableShifts: { key: string, label: string }[] = [
    { key: 'dayShift', label: 'Day Shift' },
    { key: 'nightShift', label: 'Night Shift' }
  ];
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
    { id: 'productionShiftWise', label: 'Production Shiftwise Report' }
  ];
  protected filterForm: FormGroup = this._fb.group({
    reportType: [this.reportTypeOptions[0].id, []],
    startDate: [moment().format('YYYY-MM-DD'), [Validators.required, this.startDateValidator.bind(this)]],
    endDate: [moment().format('YYYY-MM-DD'), [Validators.required, this.endDateValidator.bind(this)]],
    shift: [this.shiftOptions[0].id, []],
    groupByMachine: [false, []],
    selectAll: [false, []],
    machineIds: [null, [Validators.required]],
  });

  protected rawMachineList: any[] = [];
  protected machineList: any[] = [];
  protected machineGroupList: any[] = [];
  private subscriptionHandler$ = new Subject<void>();

  protected reportData: any;

  @ViewChild('reportTable', { static: false }) reportTable!: ElementRef<HTMLTableElement>;


  ngOnInit(): void {
    this.loadMachineList();
    this.loadMachineGroupList();
    this.setSubscriptions();
  }


  private loadMachineList(): void {
    this._apiFs.machineConfigure.optionList().subscribe({
      next: (res: any) => {
        if (res.code === 'OK') {
          this.rawMachineList = (res.data || []).map((m: any) => ({ ...m, selected: false }));
          this.machineList = [...this.rawMachineList];
        }
      }
    });
  }
  private loadMachineGroupList(): void {
    this._apiFs.machineGroup.list().subscribe({
      next: (res: any) => {
        if (res.code === 'OK') {
          this.machineGroupList = (res.data || []).map((mg: any) => ({ ...mg, selected: false }));
        }
      }
    });
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


  private setSubscriptions(): void {
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
  }

  protected arrangeMachineList(flag: boolean): void {
    if (flag) {
      // Group machines by their machine groups
      const groupedMachines: any = [];
      this.machineGroupList.forEach(mg => {
        const list = this.rawMachineList.filter(m => m.machineGroupId === mg._id);
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
    const machineIds = this.rawMachineList.filter(m => m.selected).map(m => m._id);
    this.machineIds?.patchValue(machineIds.length > 0 ? machineIds : null);

    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }

    const filter = this.filterForm.value;
    const shiftCb = filter.shift === 'all' ? (val: any) => val.id !== 'all' : (val: any) => val.id === filter.shift;
    const payload: any = {
      reportType: filter.reportType,
      startDate: filter.startDate,
      endDate: filter.endDate,
      machineIds: machineIds,
      shift: this.shiftOptions.filter(shiftCb).map(o => o.val)
    };

    this.isReqAlive = true;
    this._apiFs.reports.generateReport(payload).subscribe({
      next: (res: any) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this.reportData = res.data || {};
          this.reportData.reportTitle = this.reportTypeOptions.find(rt => rt.id === filter.reportType)?.label || 'Report';
          this.reportData.fromDate = filter.startDate;
          this.reportData.toDate = filter.endDate;

          if (Array.isArray(this.reportData?.list)) {
            const list: any[] = [];
            this.reportData.list?.forEach((item: any) => {
              if (item.reportData?.dayShift) {
                list.push({
                  ...item.reportData.dayShift,
                  reportDate: item.reportDate,
                  shiftLabel: this.tableShiftObj[0].label,
                });
              }
              if (item.reportData?.nightShift) {
                list.push({
                  ...item.reportData.nightShift,
                  reportDate: item.reportDate,
                  shiftLabel: this.tableShiftObj[1].label,
                });
              }
            });
            this.reportData.list = list;
          }
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        this.reportData = null;
        const msg = err?.error.message || 'An error occurred while generating the report';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
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