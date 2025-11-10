import { Component, EventEmitter, inject, Input, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';

import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';


@Component({
  selector: 'app-upsert-user',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './upsert-user.html',
  styleUrl: './upsert-user.scss'
})
export class UpsertUser {


  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _fb = inject(FormBuilder);


  @Input('userData') userData: any = null;
  @Output('closeOrCancel') closeOrCancel: EventEmitter<any> = new EventEmitter<any>();
  @Output('upsert') upsert: EventEmitter<any> = new EventEmitter<any>();


  protected isEditMode: boolean = false;
  protected userForm: FormGroup = this._fb.group({
    fullname: ["", [Validators.required, Validators.maxLength(100)]],
    userName: ["", [Validators.required]],// username/mobile number
    password: ["", [Validators.required, Validators.minLength(6), Validators.maxLength(20)]],
    mobile: ["", [Validators.pattern('^[0-9]{10}$')]],
    email: ["", [Validators.email]],
    isActive: [true, []],
  });
  protected isEyeOpen: boolean = false;



  protected ngOnChanges(changes: SimpleChanges) {
    if (changes['userData']?.currentValue) {
      // Initializing form for edit mode
      this.isEditMode = true;
      if (this.userData?.isCurrentUser) {
        this.userForm.removeControl('isActive');
      }
      this.password?.setValidators([Validators.minLength(6), Validators.maxLength(20)]);
      this.userForm.patchValue({
        fullname: this.userData.fullname || '',
        userName: this.userData.userName || '',
        mobile: this.userData.mobile || '',
        email: this.userData.email || '',
        isActive: this.userData.isActive ?? true
      });
    }
  }



  get fullname(): AbstractControl | null {
    return this.userForm.get('fullname');
  }
  get userName(): AbstractControl | null {
    return this.userForm.get('userName');
  }
  get mobile(): AbstractControl | null {
    return this.userForm.get('mobile');
  }
  get email(): AbstractControl | null {
    return this.userForm.get('email');
  }
  get password(): AbstractControl | null {
    return this.userForm.get('password');
  }
  get isActive(): AbstractControl | null {
    return this.userForm.get('isActive');
  }


  protected onlyDigits(event: KeyboardEvent, inputLength: number = 10): void {
    const input = event.target as HTMLInputElement;
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'];
    if (allowedKeys.includes(event.key)) {
      return;
    }

    if (!/^\d$/.test(event.key) || input.value.length >= inputLength) {
      event.preventDefault();
    }
  }


  protected isReqAlive: boolean = false;
  protected onSubmit(): void {
    if (this.isReqAlive) return;

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const body: any = {
      fullname: this.fullname?.value?.trim(),
      userName: this.userName?.value?.trim(),
      mobile: this.mobile?.value?.trim(),
      email: this.email?.value?.trim(),
      password: this.password?.value?.trim(),
    };
    if (this.isActive) {
      body.isActive = this.isActive?.value;
    }

    this.isReqAlive = true;
    if (this.isEditMode) {
      if (!body.password) {
        delete body.password;
      }
      this._apiFs.users.update(this.userData._id, body).subscribe({
        next: (res: IResponse) => {
          this.isReqAlive = false;
          if (res.code === 'OK') {
            this._coreService.utils.showToaster(EToasterType.Success, 'User updated successfully.');
            this.upsert.emit(res.data);
          }
        },
        error: (err) => {
          this.isReqAlive = false;
          const msg = err?.error?.message || 'Something went wrong, please try again later.';
          this._coreService.utils.showToaster(EToasterType.Danger, msg);
        }
      });
    } else {
      this._apiFs.users.create(body).subscribe({
        next: (res: IResponse) => {
          this.isReqAlive = false;
          if (res.code === 'CREATED') {
            this._coreService.utils.showToaster(EToasterType.Success, 'User created successfully.');
            this.upsert.emit(true);
          }
        },
        error: (err) => {
          this.isReqAlive = false;
          const msg = err?.error?.message || 'Something went wrong, please try again later.';
          this._coreService.utils.showToaster(EToasterType.Danger, msg);
        }
      });
    }
  }


  protected onCloseOrCancel(): void {
    this.closeOrCancel.emit();
  }
}