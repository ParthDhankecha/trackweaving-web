import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';

import moment from 'moment';

import { CommonDropdown } from '@src/app/shared/components/common-dropdown/common-dropdown';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';

import { EToasterType } from '@src/app/models/utils.model';


@Component({
  selector: 'app-shift-wise-comment',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    DatePipe,
    CommonDropdown
  ],
  templateUrl: './shift-wise-comments.html',
  styleUrl: './shift-wise-comments.scss'
})
export class ShiftWiseComments {

  // Inject services
  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);

  protected readonly _fb = inject(FormBuilder);


  protected filterForm: FormGroup = this._fb.group({
    machineId: [null, []],
    date: [moment().format('YYYY-MM-DD'), [Validators.required]],
    shift: ['', []]
  });

  private readonly defaultMachineOption: any = { _id: '', machineCode: 'Select All' };
  protected readonly shiftOptions: any[] = ['', 'day', 'night'];
  protected machineList: any[] = [];


  ngOnInit(): void {
    this.loadMachineList();
  }

  private loadMachineList(): void {
    this._apiFs.machineConfigure.optionList().subscribe({
      next: (res: any) => {
        if (res.code === 'OK') {
          this.machineList = res.data || [];
          this.machineList.unshift(this.defaultMachineOption);
          this.machineId?.patchValue(this.defaultMachineOption);
        }
      }
    });
  }


  get machineId(): AbstractControl | null {
    return this.filterForm.get('machineId');
  }
  get date(): AbstractControl | null {
    return this.filterForm.get('date');
  }
  get shift(): AbstractControl | null {
    return this.filterForm.get('shift');
  }

  protected onSelectMachine(event: any): void {
    if (event) {
      this.machineId?.patchValue(event);
    }
  }


  protected shiftWiseCommentList: any[] = [];
  protected shiftWiseCommentMap: Map<string, any> = new Map<string, any>();
  protected isReportLoaded: boolean = false;
  protected isReqLive: boolean = false;
  protected isListUpdating: boolean = false;

  protected onFilterSubmit(): void {
    if (this.isReqLive) return;

    const { date, shift, machineId } = this.filterForm.value;
    const payload: any = {
      date: moment(date).format('YYYY-MM-DD'),
      shift: shift || null,
      machineId: machineId?._id || null
    };

    const forSingleDate = !payload.shift && !payload.machineId;
    this.isReqLive = true;
    if (!this.isListUpdating) {
      this.isReportLoaded = false;
    }

    this._apiFs.shiftWiseComments.list(payload).subscribe({
      next: (res: any) => {
        this.isReqLive = false;
        if (res.code === 'OK') {
          const shiftWiseCommentList = res.data?.list || [];
          this.shiftWiseCommentMap.clear();
          // prepare shift wise comment map for easy access
          shiftWiseCommentList.forEach((item: any) => {
            const key = this.getKey(item.machineId, item.shift, item.date);
            this.shiftWiseCommentMap.set(key, item);
          });
          // Prepare machine and shift arrays
          const machines = payload.machineId ? [machineId] : this.machineList.filter(m => m._id);
          const shifts = payload.shift ? [payload.shift] : this.shiftOptions.filter(s => s);
          // Define report date range
          const start = moment(payload.date, 'YYYY-MM-DD').startOf(forSingleDate ? 'day' : 'month');
          const end = moment(payload.date, 'YYYY-MM-DD').endOf(forSingleDate ? 'day' : 'month');
          // Generate report list
          this.generateCommentList(machines, shifts, start, end);
          if (!this.isListUpdating) {
            this.isReportLoaded = true;
          }
        }
      },
      error: () => {
        this.isReqLive = false;
        this.isReportLoaded = false;
      }
    });
  }

  /** Helper to generate consistent map key */
  private getKey(machineId: string, shift: string, date: string): string {
    return `${machineId}_${shift}_${moment(date).format('YYYY-MM-DD')}`;
  }

  /** Helper to build full comment list */
  private generateCommentList(machines: any[], shifts: string[], start: moment.Moment, end: moment.Moment): any[] {
    const list: any[] = [];
    const current = end.clone();

    if (this.isListUpdating) {
      this.isListUpdating = false;

      for (const entry of this.shiftWiseCommentList) {
        const machineId = entry.machineId?._id || entry.machineId;
        const date = entry.date;
        for (const shiftEntry of entry.shifts) {
          const key = this.getKey(machineId, shiftEntry.shift, date);
          shiftEntry.comment = this.shiftWiseCommentMap.get(key)?.comment || '';
        }
      }
      return this.shiftWiseCommentList;
    }

    while (current.isSameOrAfter(start)) {
      const dateStr = current.format('YYYY-MM-DD');
      for (const machine of machines) {
        list.push({
          machineId: machine,
          date: dateStr,
          shifts: shifts.map(shift => ({
            shift,
            comment: this.shiftWiseCommentMap.get(this.getKey(machine._id || machine, shift, dateStr))?.comment || '',
          })),
        });
      }
      current.subtract(1, 'day');
    }

    this.shiftWiseCommentList = [...list];
    return list;
  }


  protected isSaving: boolean = false;
  protected onSaveComments(): void {
    if (this.isSaving) return;

    // validate and prepare payload, detect new entry and updates only
    const commentList = [];
    for (const entry of this.shiftWiseCommentList) {
      const machineId = entry.machineId?._id || entry.machineId;
      const date = entry.date;
      for (const shiftEntry of entry.shifts) {
        const shift = shiftEntry.shift;
        const comment = shiftEntry.comment?.trim() || '';

        const key = this.getKey(machineId, shift, date);
        const preEntry = this.shiftWiseCommentMap.get(key);
        // If existing entry found, check for updates
        if ((preEntry && preEntry.comment !== comment) || (!preEntry && comment)) {
          commentList.push({ machineId, date, shift, comment });
        }
      }
    }

    if (commentList.length === 0) {
      this._coreService.utils.showToaster(EToasterType.Info, 'No changes to save.');
      return;
    }

    this.isSaving = true;
    this._apiFs.shiftWiseComments.update({ list: commentList }).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res.code === 'OK') {
          this.isListUpdating = true;
          this.onFilterSubmit();
        }
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }
}