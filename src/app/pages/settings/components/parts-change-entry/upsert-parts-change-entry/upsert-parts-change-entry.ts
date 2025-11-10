import { Component, EventEmitter, inject, Input, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import moment from 'moment';

import { CommonDropdown } from '@src/app/shared/components/common-dropdown/common-dropdown';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';

import { EToasterType } from '@src/app/models/utils.model';


@Component({
  selector: 'app-upsert-parts-change-entry',
  imports: [
    ReactiveFormsModule,
    CommonDropdown
  ],
  templateUrl: './upsert-parts-change-entry.html',
  styleUrl: './upsert-parts-change-entry.scss'
})
export class UpsertPartsChangeEntry {
  // Inject Services
  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _fb = inject(FormBuilder);


  protected isEditMode: boolean = false;
  protected _partNameList: any[] = [];
  @Input('partNameList') partNameList: any[] = [];
  @Input('machineList') machineList: any[] = [];

  @Input('pceData') pceData: any;
  @Output('close') closeOrCancel: EventEmitter<any> = new EventEmitter<any>();
  @Output('upsert') upsert: EventEmitter<any> = new EventEmitter<any>();


  protected pceForm: FormGroup = this._fb.group({
    // add item if it's missing in the search
    partName: ['', [Validators.required, Validators.maxLength(180)]],
    machineId: ['', [Validators.required, Validators.maxLength(24)]],
    changeDate: ['', [Validators.required]],
    changedBy: ['', [Validators.required, Validators.pattern('^(?!\s*$).+')]],// Input cannot be empty or only spaces
    changedByContact: ['', [Validators.pattern('^(?:\\+91[-\\s]?|91[-\\s]?|0)?[6-9]\\d{9}$')]],
    notes: ['', [Validators.maxLength(500)]],
  });


  protected ngOnChanges(changes: SimpleChanges) {
    if (changes['partNameList']?.currentValue) {
      this._partNameList = [...(changes['partNameList']?.currentValue || [])];
    }

    if (changes['pceData']?.currentValue) {
      this.isEditMode = !!changes['pceData']?.currentValue?._id;

      this.pceForm.patchValue({
        partName: this.pceData?.partName ?? '',
        machineId: this.pceData?.machineId?._id ?? '',
        changeDate: this.pceData?.changeDate ? moment(this.pceData.changeDate).format('YYYY-MM-DD') : '',
        changedBy: this.pceData?.changedBy ?? '',
        changedByContact: this.pceData?.changedByContact ?? '',
        notes: this.pceData?.notes ?? ''
      });
    }
  }



  get partName(): AbstractControl | null {
    return this.pceForm.get('partName');
  }
  get machineId(): AbstractControl | null {
    return this.pceForm.get('machineId');
  }
  get changeDate(): AbstractControl | null {
    return this.pceForm.get('changeDate');
  }
  get changedBy(): AbstractControl | null {
    return this.pceForm.get('changedBy');
  }
  get changedByContact(): AbstractControl | null {
    return this.pceForm.get('changedByContact');
  }
  get notes(): AbstractControl | null {
    return this.pceForm.get('notes');
  }


  protected onCreateNewPart(event: any): void {
    const partName = (event ?? '').trim();
    this.partNameList.push(partName);
    this._partNameList = [...this.partNameList];
    this.partName?.patchValue(partName);
  }
  protected onSelectPart(event: any): void {
    this.partName?.patchValue(event);
  }


  protected isReqAlive: boolean = false;
  protected onSubmit(): void {
    if (this.isReqAlive) return;

    if (this.pceForm.invalid) {
      this.pceForm.markAllAsTouched();
      return;
    }

    const body: any = {
      machineId: this.machineId?.value?.trim(),
      partName: this.partName?.value?.trim(),
      changeDate: this.changeDate?.value,
      changedBy: this.changedBy?.value?.trim(),
      changedByContact: this.changedByContact?.value?.trim(),
      notes: this.notes?.value?.trim(),
    };

    this.isReqAlive = true;
    if (this.isEditMode) {
      this._apiFs.partsChangeEntry.update(this.pceData._id, body).subscribe({
        next: (res: any) => {
          this.isReqAlive = false;
          if (res.code === 'OK') {
            this._coreService.utils.showToaster(EToasterType.Success, 'Parts Change Entry updated successfully.');
            this.upsert.emit(res.data);
            this.onCloseOrCancel();
          }
        },
        error: (err: any) => {
          this.isReqAlive = false;
          const msg = err?.error?.message || 'Failed to update Parts Change Entry. Please try again.';
          this._coreService.utils.showToaster(EToasterType.Danger, msg);
        }
      });
    } else {
      this._apiFs.partsChangeEntry.create(body).subscribe({
        next: (res: any) => {
          this.isReqAlive = false;
          if (res.code === 'OK') {
            this._coreService.utils.showToaster(EToasterType.Success, 'Parts Change Entry created successfully.');
            this.upsert.emit(res.data);
            this.onCloseOrCancel();
          }
        },
        error: (err: any) => {
          this.isReqAlive = false;
          const msg = err?.error?.message || 'Failed to create Parts Change Entry. Please try again.';
          this._coreService.utils.showToaster(EToasterType.Danger, msg);
        }
      });
    }
  }


  protected onCloseOrCancel(): void {
    this.closeOrCancel.emit();
  }
}