import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

import moment from 'moment';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';


@Component({
  selector: 'app-maintenance-entry',
  imports: [
    ReactiveFormsModule,
    DatePipe
  ],
  templateUrl: './maintenance-entry.html',
  styleUrl: './maintenance-entry.scss'
})
export class MaintenanceEntry {
  // Inject Services
  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);

  protected readonly _fb = inject(FormBuilder);

  protected meForm: FormGroup = this._fb.group({
    lastMaintenanceDate: ['', [Validators.required, this.lastMaintenanceDateValidator.bind(this)]],
    nextMaintenanceDate: ['', [Validators.required, this.nextMaintenanceDateValidator.bind(this)]],
    completedBy: ['', [Validators.required, Validators.pattern('^(?!\s*$).+')]],// Input cannot be empty or only spaces
    phone: ['', [Validators.required, Validators.pattern('^(?:\\+91[-\\s]?|91[-\\s]?|0)?[6-9]\\d{9}$')]],
    remarks: ['', [Validators.maxLength(500)]],
  });


  ngOnInit(): void {
    this.loadList();
  }


  protected maintenanceEntryList: any[] = [];
  private loadList(): void {
    this._apiFs.maintenanceEntry.list().subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.maintenanceEntryList = res.data || [];
        }
      },
      error: (err: any) => { }
    });
  }



  get lastMaintenanceDate(): AbstractControl | null {
    return this.meForm?.get('lastMaintenanceDate');
  }
  get nextMaintenanceDate(): AbstractControl | null {
    return this.meForm?.get('nextMaintenanceDate');
  }
  get completedBy(): AbstractControl | null {
    return this.meForm.get('completedBy');
  }
  get phone(): AbstractControl | null {
    return this.meForm.get('phone');
  }
  get remarks(): AbstractControl | null {
    return this.meForm.get('remarks');
  }

  private lastMaintenanceDateValidator(control: AbstractControl): ValidationErrors | null {
    if (this.nextMaintenanceDate && !this.nextMaintenanceDate?.touched) this.nextMaintenanceDate.markAsTouched();
    this.nextMaintenanceDate?.updateValueAndValidity();
    return null;
  }

  private nextMaintenanceDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.lastMaintenanceDate) return null; // Form not initialized yet

    const lastDate = this.lastMaintenanceDate?.value;
    const nextDate = control.value;

    if (!lastDate || !nextDate) return null;
    const last = new Date(lastDate);
    const next = new Date(nextDate);

    // If next date is before or equal to last date
    if (next <= last) {
      return { nextDateInvalid: true };
    }
    return null;
  }



  protected upsertMaintenanceEntryModalData: any;
  protected isUpsertMaintenanceEntryModalOpen: boolean = false;
  protected onOpenUpsertMaintenanceEntryModal(maintenanceEntry: any, alertItem: any): void {
    if (!maintenanceEntry?.machineId || !alertItem?._id) return;

    this.upsertMaintenanceEntryModalData = { ...maintenanceEntry };
    this.upsertMaintenanceEntryModalData.alerts = { ...alertItem };
    this.meForm.patchValue({
      lastMaintenanceDate: moment().format('YYYY-MM-DD'),
      nextMaintenanceDate: moment().add(this.upsertMaintenanceEntryModalData?.alerts?.scheduleDays ?? 1, 'days').format('YYYY-MM-DD'),
      completedBy: '',
      phone: '',
      remarks: ''
    });
    this.isUpsertMaintenanceEntryModalOpen = true;
  }

  protected isReqAlive: boolean = false;
  protected onSubmitUpdateMaintenanceEntry(): void {
    if (this.isReqAlive || !this.upsertMaintenanceEntryModalData?.machineId) return;
    if (this.meForm.invalid) {
      this.meForm.markAllAsTouched();
      return;
    }

    this.isReqAlive = true;
    const body = {
      ...this.meForm.value,
    };
    body.completedBy = body.completedBy.trim();
    body.phone = body.phone.trim();
    body.remarks = body.remarks.trim();

    this._apiFs.maintenanceEntry.update(this.upsertMaintenanceEntryModalData?.alerts?._id, body).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this.loadList();
          this.onCloseMaintenanceEntryModal();
          this._coreService.utils.showToaster(EToasterType.Success, 'Maintenance entry updated successfully.');
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        const msg = err?.error?.message || 'Something went wrong, please try again later.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }

  protected onCloseMaintenanceEntryModal(): void {
    this.isUpsertMaintenanceEntryModalOpen = false;
    this.upsertMaintenanceEntryModalData = null;
    this.meForm.reset({
      lastMaintenanceDate: '',
      nextMaintenanceDate: '',
      completedBy: '',
      phone: '',
      remarks: ''
    });
  }
}