import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { EToasterType } from '@src/app/models/utils.model';


@Component({
  selector: 'app-upsert-maintenance-category',
  imports: [ReactiveFormsModule],
  templateUrl: './upsert-maintenance-category.html',
  styleUrl: './upsert-maintenance-category.scss'
})
export class UpsertMaintenanceCategory implements OnChanges {
  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _fb = inject(FormBuilder);

  protected isEditMode = false;
  @Input('maintenanceCategoryData') maintenanceCategoryData: any;
  @Output('close') closeOrCancel = new EventEmitter<void>();
  @Output('upsert') upsert = new EventEmitter<any>();

  protected categoryForm: FormGroup = this._fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    scheduleDays: [30, [Validators.required, Validators.min(1)]],
    alertDays: [5, [Validators.required, Validators.min(0)]],
    alertMessage: ['', [Validators.maxLength(500)]]
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['maintenanceCategoryData']?.currentValue) {
      this.isEditMode = !!changes['maintenanceCategoryData']?.currentValue?._id;
      this.categoryForm.patchValue({
        name: this.maintenanceCategoryData?.name || '',
        scheduleDays: this.maintenanceCategoryData?.scheduleDays ?? 30,
        alertDays: this.maintenanceCategoryData?.alertDays ?? 5,
        alertMessage: this.maintenanceCategoryData?.alertMessage || ''
      });
      return;
    }

    if (changes['maintenanceCategoryData'] && !changes['maintenanceCategoryData'].currentValue) {
      this.isEditMode = false;
      this.categoryForm.reset({
        name: '',
        scheduleDays: 30,
        alertDays: 5,
        alertMessage: ''
      });
    }
  }

  get name(): AbstractControl | null {
    return this.categoryForm.get('name');
  }

  get scheduleDays(): AbstractControl | null {
    return this.categoryForm.get('scheduleDays');
  }

  get alertDays(): AbstractControl | null {
    return this.categoryForm.get('alertDays');
  }

  get alertMessage(): AbstractControl | null {
    return this.categoryForm.get('alertMessage');
  }

  protected isReqAlive = false;

  protected onSubmit(): void {
    if (this.isReqAlive) return;

    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const body = {
      name: String(this.name?.value || '').trim(),
      scheduleDays: Number(this.scheduleDays?.value),
      alertDays: Number(this.alertDays?.value),
      alertMessage: String(this.alertMessage?.value || '').trim()
    };

    this.isReqAlive = true;

    if (!this.isEditMode) {
      this._apiFs.maintenanceCategory.create(body).subscribe({
        next: (res: any) => {
          this.isReqAlive = false;
          if (res.code === 'CREATED') {
            this._coreService.utils.showToaster(EToasterType.Success, 'Maintenance category created successfully.');
            this.upsert.emit(res.data);
          }
        },
        error: (err: any) => {
          this.isReqAlive = false;
          const msg = err?.error?.message || 'Something went wrong, please try again later.';
          this._coreService.utils.showToaster(EToasterType.Danger, msg);
        }
      });
      return;
    }

    const categoryId = this.maintenanceCategoryData?._id;
    if (!categoryId) {
      this.isReqAlive = false;
      this._coreService.utils.showToaster(EToasterType.Danger, 'Maintenance category ID is missing.');
      return;
    }

    this._apiFs.maintenanceCategory.update(categoryId, body).subscribe({
      next: (res: any) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this._coreService.utils.showToaster(EToasterType.Success, 'Maintenance category updated successfully.');
          this.upsert.emit(res.data);
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        const msg = err?.error?.message || 'Something went wrong, please try again later.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }

  protected onCloseOrCancel(): void {
    this.closeOrCancel.emit();
  }
}
