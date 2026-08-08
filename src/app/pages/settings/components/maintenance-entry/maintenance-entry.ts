import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';

import moment from 'moment';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';


@Component({
  selector: 'app-maintenance-entry',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    DatePipe
  ],
  templateUrl: './maintenance-entry.html',
  styleUrl: './maintenance-entry.scss'
})
export class MaintenanceEntry {
  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _fb = inject(FormBuilder);
  private readonly _route = inject(ActivatedRoute);

  protected meForm: FormGroup = this._fb.group({
    lastMaintenanceDate: ['', [Validators.required, this.lastMaintenanceDateValidator.bind(this)]],
    nextMaintenanceDate: ['', [Validators.required, this.nextMaintenanceDateValidator.bind(this)]],
    completedBy: [''],
    phone: ['', [Validators.required, Validators.pattern('^(?:\\+91[-\\s]?|91[-\\s]?|0)?[6-9]\\d{9}$')]],
    remarks: ['', [Validators.maxLength(500)]],
  });

  protected maintenanceEntryList: any[] = [];
  protected maintenanceCategoryList: any[] = [];
  protected machineFilterList: any[] = [];
  protected maintenanceHistoryList: any[] = [];
  protected selectedCategoryId = '';
  protected selectedMachineId = '';
  protected selectedCategoryName = '';
  protected isHistoryLoading = false;
  protected showHistorySection = false;

  ngOnInit(): void {
    this.loadList();
    this.loadCategories();
    this.loadMachineFilterList();

    this._route.queryParamMap.subscribe(params => {
      const categoryId = params.get('categoryId') || '';
      if (categoryId) {
        this.selectedCategoryId = categoryId;
        this.loadMaintenanceHistory();
      }
    });
  }

  private loadList(): void {
    this._apiFs.maintenanceEntry.list().subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.maintenanceEntryList = res.data || [];
        }
      },
      error: () => { }
    });
  }

  private loadCategories(): void {
    this._apiFs.maintenanceCategory.list().subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.maintenanceCategoryList = res.data || [];
        }
      },
      error: () => { }
    });
  }

  private loadMachineFilterList(): void {
    this._apiFs.machineConfigure.optionList().subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.machineFilterList = res.data || [];
        }
      },
      error: () => { }
    });
  }

  protected onCategoryFilterChange(): void {
    if (!this.selectedCategoryId) {
      this.showHistorySection = false;
      this.maintenanceHistoryList = [];
      this.selectedCategoryName = '';
      return;
    }
    this.loadMaintenanceHistory();
  }

  protected onMachineFilterChange(): void {
    if (!this.selectedCategoryId) return;
    this.loadMaintenanceHistory();
  }

  protected loadMaintenanceHistory(): void {
    if (!this.selectedCategoryId) return;

    this.isHistoryLoading = true;
    this.showHistorySection = true;

    const params: { maintenanceCategoryId: string; machineId?: string } = {
      maintenanceCategoryId: this.selectedCategoryId
    };
    if (this.selectedMachineId) {
      params.machineId = this.selectedMachineId;
    }

    this._apiFs.maintenanceEntry.history(params).subscribe({
      next: (res: IResponse) => {
        this.isHistoryLoading = false;
        if (res.code === 'OK') {
          this.maintenanceHistoryList = res.data?.list || [];
          this.selectedCategoryName = res.data?.categoryName || '';
        }
      },
      error: (err: any) => {
        this.isHistoryLoading = false;
        this.maintenanceHistoryList = [];
        const msg = err?.error?.message || 'Failed to load maintenance history.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
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
    if (!this.lastMaintenanceDate) return null;

    const lastDate = this.lastMaintenanceDate?.value;
    const nextDate = control.value;

    if (!lastDate || !nextDate) return null;
    const last = new Date(lastDate);
    const next = new Date(nextDate);

    if (next <= last) {
      return { nextDateInvalid: true };
    }
    return null;
  }

  protected upsertMaintenanceEntryModalData: any;
  protected isUpsertMaintenanceEntryModalOpen = false;

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

  protected isReqAlive = false;

  protected onSubmitUpdateMaintenanceEntry(): void {
    if (this.isReqAlive || !this.upsertMaintenanceEntryModalData?.machineId) return;
    if (this.meForm.invalid) {
      this.meForm.markAllAsTouched();
      return;
    }

    this.isReqAlive = true;
    const body: any = {
      ...this.meForm.value,
    };
    body.completedBy = (body.completedBy || '').trim();
    body.completedByMobile = (body.phone || '').trim();
    body.remarks = (body.remarks || '').trim();
    delete body.phone;

    this._apiFs.maintenanceEntry.update(this.upsertMaintenanceEntryModalData?.alerts?._id, body).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this.loadList();
          if (this.selectedCategoryId) {
            this.loadMaintenanceHistory();
          }
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
