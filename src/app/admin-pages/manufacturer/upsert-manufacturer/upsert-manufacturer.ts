import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';


@Component({
  selector: 'app-upsert-manufacturer',
  imports: [ReactiveFormsModule],
  templateUrl: './upsert-manufacturer.html',
  styleUrl: './upsert-manufacturer.scss'
})
export class UpsertManufacturer implements OnChanges {

  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _fb = inject(FormBuilder);

  protected isEditMode: boolean = false;
  @Input('manufacturerData') manufacturerData: any = null;
  @Output('close') closeOrCancel = new EventEmitter<void>();
  @Output('upsert') upsert = new EventEmitter<void>();

  protected form!: FormGroup;
  protected isEyeOpen: boolean = false;
  protected isReqAlive: boolean = false;


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['manufacturerData']) {
      this.isEditMode = !!this.manufacturerData;
      this.buildForm();
      if (this.isEditMode) {
        this.form.patchValue({
          companyName:   this.manufacturerData.companyName || '',
          contactPerson: this.manufacturerData.contactPerson || '',
          phone:         this.manufacturerData.phone || '',
          email:         this.manufacturerData.email || '',
          isActive:      this.manufacturerData.isActive ?? true
        });
      }
    }
  }


  private buildForm(): void {
    if (this.isEditMode) {
      this.form = this._fb.group({
        companyName:   ['', [Validators.required, Validators.maxLength(100)]],
        contactPerson: [''],
        phone:         ['', [Validators.pattern('^[0-9+\\-\\s]{7,15}$')]],
        email:         [{ value: '', disabled: true }],
        isActive:      [true, Validators.required]
      });
    } else {
      this.form = this._fb.group({
        companyName:   ['', [Validators.required, Validators.maxLength(100)]],
        contactPerson: [''],
        phone:         ['', [Validators.pattern('^[0-9+\\-\\s]{7,15}$')]],
        email:         ['', [Validators.required, Validators.email]],
        password:      ['', [Validators.required, Validators.minLength(6), Validators.maxLength(30)]],
        isActive:      [true, Validators.required]
      });
    }
  }


  get companyName(): AbstractControl | null { return this.form.get('companyName'); }
  get email():       AbstractControl | null { return this.form.get('email'); }
  get password():    AbstractControl | null { return this.form.get('password'); }
  get phone():       AbstractControl | null { return this.form.get('phone'); }


  protected onSubmit(): void {
    if (this.isReqAlive) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isReqAlive = true;
    const raw = this.form.getRawValue();

    if (!this.isEditMode) {
      this._apiFs.manufacturer.create(raw).subscribe({
        next: (res: IResponse) => {
          this.isReqAlive = false;
          if (res.code === 'CREATED') {
            this._coreService.utils.showToaster(EToasterType.Success, 'Manufacturer created.');
            this.upsert.emit();
          }
        },
        error: (err: any) => {
          this.isReqAlive = false;
          this._coreService.utils.showToaster(EToasterType.Danger, err?.error?.message || 'Failed to create.');
        }
      });
    } else {
      const id = this.manufacturerData._id;
      const payload: any = {
        companyName:   raw.companyName,
        contactPerson: raw.contactPerson,
        phone:         raw.phone,
        isActive:      raw.isActive
      };
      this._apiFs.manufacturer.update(id, payload).subscribe({
        next: (res: IResponse) => {
          this.isReqAlive = false;
          if (res.code === 'OK') {
            this._coreService.utils.showToaster(EToasterType.Info, 'Manufacturer updated.');
            this.upsert.emit();
          }
        },
        error: (err: any) => {
          this.isReqAlive = false;
          this._coreService.utils.showToaster(EToasterType.Danger, err?.error?.message || 'Failed to update.');
        }
      });
    }
  }

  protected onClose(): void {
    this.closeOrCancel.emit();
  }
}
