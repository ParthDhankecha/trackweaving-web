import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CommonDropdown } from '@src/app/shared/components/common-dropdown/common-dropdown';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';


@Component({
  selector: 'app-upsert-manufacturer-user',
  imports: [
    ReactiveFormsModule,
    CommonDropdown
  ],
  templateUrl: './upsert-manufacturer-user.html',
  styleUrl: './upsert-manufacturer-user.scss'
})
export class UpsertManufacturerUser implements OnChanges {

  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _fb = inject(FormBuilder);

  protected isEditMode: boolean = false;
  @Input('manufacturerList') manufacturerList: any[] = [];
  @Input('userData') userData: any = null;
  @Output('close') closeOrCancel = new EventEmitter<void>();
  @Output('upsert') upsert = new EventEmitter<void>();

  protected form: FormGroup = this.buildForm();
  protected isReqAlive: boolean = false;


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userData']) {
      this.isEditMode = !!this.userData;
      this.form = this.buildForm();

      if (this.isEditMode) {
        const manufacturer = this.manufacturerList.find(
          (m: any) => m._id === this.userData.manufacturerId?._id || m._id === this.userData.manufacturerId
        ) || this.userData.manufacturerId;

        this.form.patchValue({
          manufacturer,
          email: this.userData.email || '',
          contactPerson: this.userData.contactPerson || '',
          phone: this.userData.phone || '',
          isActive: this.userData.isActive ?? true
        });
        this.password?.clearValidators();
        this.password?.setValidators([Validators.minLength(6), Validators.maxLength(50)]);
        this.password?.updateValueAndValidity();
      }
    }
  }


  private buildForm(): FormGroup {
    return this._fb.group({
      manufacturer: [null, Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(50)]],
      contactPerson: ['', [Validators.required, Validators.maxLength(100)]],
      phone: ['', Validators.maxLength(20)],
      isActive: [true, Validators.required]
    });
  }


  get manufacturer(): AbstractControl | null { return this.form.get('manufacturer'); }
  get email(): AbstractControl | null { return this.form.get('email'); }
  get password(): AbstractControl | null { return this.form.get('password'); }
  get contactPerson(): AbstractControl | null { return this.form.get('contactPerson'); }
  get phone(): AbstractControl | null { return this.form.get('phone'); }


  protected onManufacturerChange(manufacturer: any): void {
    this.form.patchValue({ manufacturer });
  }


  protected onSubmit(): void {
    if (this.isReqAlive) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: any = {
      manufacturerId: raw.manufacturer?._id,
      email: raw.email?.trim(),
      contactPerson: raw.contactPerson?.trim(),
      phone: raw.phone?.trim() || '',
      isActive: raw.isActive === true || raw.isActive === 'true'
    };

    if (raw.password?.trim()) {
      payload.password = raw.password.trim();
    }

    this.isReqAlive = true;

    if (!this.isEditMode) {
      this._apiFs.manufacturerUser.create(payload).subscribe({
        next: (res: IResponse) => {
          this.isReqAlive = false;
          if (res.code === 'CREATED') {
            this._coreService.utils.showToaster(EToasterType.Success, 'Manufacturer user created.');
            this.upsert.emit();
          }
        },
        error: (err: any) => {
          this.isReqAlive = false;
          this._coreService.utils.showToaster(EToasterType.Danger, err?.error?.message || 'Failed to create.');
        }
      });
      return;
    }

    if (!payload.password) {
      delete payload.password;
    }

    this._apiFs.manufacturerUser.update(this.userData._id, payload).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this._coreService.utils.showToaster(EToasterType.Info, 'Manufacturer user updated.');
          this.upsert.emit();
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        this._coreService.utils.showToaster(EToasterType.Danger, err?.error?.message || 'Failed to update.');
      }
    });
  }


  protected onClose(): void {
    this.closeOrCancel.emit();
  }
}