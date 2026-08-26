import { Component, DestroyRef, EventEmitter, inject, Input, Output, SimpleChanges } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';

import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';
import APP_REGEXP from '@src/app/constants/app-regexp';


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
  private readonly destroyRef = inject(DestroyRef);


  @Input('userData') userData: any = null;
  @Output('closeOrCancel') closeOrCancel: EventEmitter<any> = new EventEmitter<any>();
  @Output('upsert') upsert: EventEmitter<any> = new EventEmitter<any>();


  protected usernameRegObj = APP_REGEXP.USER_NAME;
  protected isEditMode: boolean = false;
  protected userForm: FormGroup = this._fb.group({
    userType: [null, [Validators.required]],
    fullname: ["", [Validators.required, Validators.maxLength(100)]],
    userName: ["", [Validators.required, Validators.minLength(this.usernameRegObj.MIN_LENGTH), Validators.pattern(this.usernameRegObj.REGEXP)]],// username/mobile number
    password: ["", [Validators.required, Validators.minLength(6)]],
    mobile: ["", [Validators.pattern('^[0-9]{10}$')]],
    email: ["", [Validators.email]],
    isActive: [true, []],
    shift: [[], []],
    machineIds: [[], []],
  });

  protected isEyeOpen: boolean = false;
  protected machineList: any[] = [];
  protected readonly shiftOptions: { value: number, label: string }[] = [
    { value: 0, label: 'Day Shift' },
    { value: 1, label: 'Night Shift' },
  ];


  protected get userTypeOptions() {
    return this._coreService.appConfig.userTypeOptions;
  }

  protected get hasUpsertAccess(): boolean {
    return this._coreService.utils.can('user', this.isEditMode ? 'update' : 'create');
  }

  /** Workspace owner can set type on create, and change another user's type on edit. */
  protected get canChangeUserType(): boolean {
    if (!this._coreService.utils.isOwner || !this.hasUpsertAccess) return false;
    return !(this.isEditMode && this.userData?.isCurrentUser);
  }

  private readonly _userRoles = this._coreService.appConfig.roles;
  protected get showMasterFields(): boolean {
    const masterRole = this._userRoles?.MASTER;
    if (masterRole === undefined) return false;
    if (!this.isEditMode) return this.userType?.value === masterRole;
    return this._coreService.utils.isOwner && this.userType?.value === masterRole;
  }

  protected get userTypeChangeWarning(): string {
    if (!this.isEditMode || this.userType?.value == this.userData?.userType) return '';

    return this.userType?.value === this._userRoles?.MASTER
      ? 'Changing this user to Master requires shift and machine assignments. Module access will default to read-only if they have none. The user will need to sign in again.'
      : 'Changing this user to Admin will remove their shift, machine assignments, and module access. The user will need to sign in again.';
  }


  protected ngOnChanges(changes: SimpleChanges) {
    if (changes['userData']?.currentValue) {
      // Initializing form for edit mode
      this.isEditMode = true;
      if (this.userData?.isCurrentUser) {
        this.userForm.removeControl('isActive');
      }
      this.password?.setValidators([Validators.minLength(6)]);
      this.userForm.patchValue({
        fullname: this.userData.fullname || '',
        userName: this.userData.userName || '',
        mobile: this.userData.mobile || '',
        email: this.userData.email || '',
        isActive: this.userData.isActive ?? true,
        userType: this.userData.userType ?? null,
        shift: this.normalizeShiftValue(this.userData.shift),
        machineIds: this.userData?.machineIds ?? []
      });
      if (!this.canChangeUserType) {
        this.userType?.disable();
      }
    }
    this.syncMasterFieldValidators();
  }


  protected ngOnInit(): void {
    this.loadMachines();
    this.syncMasterFieldValidators();
    this.userType?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      if (this.isEditMode) {
        this.resetMasterFieldsToOriginal();
      }
      this.syncMasterFieldValidators();
    });
  }


  private loadMachines(): void {
    this._apiFs.machineConfigure.optionList().subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.machineList = res.data || [];
        }
      },
      error: () => {
        this.machineList = [];
      }
    });
  }


  private resetMasterFieldsToOriginal(): void {
    this.shift?.setValue(this.normalizeShiftValue(this.userData?.shift), { emitEvent: false });
    this.machineIds?.setValue([...(this.userData?.machineIds ?? [])], { emitEvent: false });
  }


  private syncMasterFieldValidators(): void {
    if (this.showMasterFields) {
      this.shift?.setValidators([this.atLeastOneShiftValidator]);
      this.machineIds?.setValidators([Validators.required, this.atLeastOneMachineValidator]);
    } else {
      this.shift?.clearValidators();
      this.machineIds?.clearValidators();
      if (!this.isEditMode) {
        this.shift?.setValue([], { emitEvent: false });
        this.machineIds?.setValue([], { emitEvent: false });
      }
    }
    this.shift?.updateValueAndValidity({ emitEvent: false });
    this.machineIds?.updateValueAndValidity({ emitEvent: false });
  }


  private atLeastOneMachineValidator(control: AbstractControl) {
    const value = control.value;
    if (!Array.isArray(value) || value.length === 0) {
      return { required: true };
    }
    return null;
  }


  private atLeastOneShiftValidator(control: AbstractControl) {
    const value = control.value;
    if (!Array.isArray(value) || value.length === 0) {
      return { required: true };
    }
    return null;
  }

  private normalizeShiftValue(shift: unknown): number[] {
    if (Array.isArray(shift)) {
      return [
        ...new Set(shift.map(Number)
          .filter(Number.isFinite))
      ].sort();
    }
    return [];
  }


  get fullname(): AbstractControl | null {
    return this.userForm.get('fullname');
  }
  get userType(): AbstractControl | null {
    return this.userForm.get('userType');
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
  get shift(): AbstractControl | null {
    return this.userForm.get('shift')
  }
  get machineIds(): AbstractControl | null {
    return this.userForm.get('machineIds');
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


  protected isShiftSelected(shiftValue: number): boolean {
    return (this.shift?.value || []).includes(shiftValue);
  }

  protected onToggleShift(shiftValue: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current: number[] = [...(this.shift?.value || [])];
    if (checked && !current.includes(shiftValue)) {
      current.push(shiftValue);
    } else if (!checked) {
      const idx = current.indexOf(shiftValue);
      if (idx !== -1) current.splice(idx, 1);
    }
    this.shift?.setValue(current.sort());
    this.shift?.markAsTouched();
  }


  protected isMachineSelected(machineId: string): boolean {
    return (this.machineIds?.value || []).includes(machineId);
  }

  protected get isAllMachinesSelected(): boolean {
    return this.machineList.length === (this.machineIds?.value || []).length;
  }

  protected onToggleMachine(event: Event, machineId?: string): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (!machineId) {
      this.machineIds?.setValue(
        checked ? this.machineList.map((m) => m._id) : []
      );
      this.machineIds?.markAsTouched();
      return;
    }

    // Single machine toggle
    const current: string[] = [...(this.machineIds?.value || [])];
    if (checked && !current.includes(machineId)) {
      current.push(machineId);
    } else if (!checked) {
      const idx = current.indexOf(machineId);
      if (idx !== -1) current.splice(idx, 1);
    }
    this.machineIds?.setValue(current);
    this.machineIds?.markAsTouched();
  }


  protected isReqAlive: boolean = false;
  protected onSubmit(): void {
    if (!this.hasUpsertAccess) return;
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
    if (this.showMasterFields) {
      body.shift = this.normalizeShiftValue(this.shift?.value);
      body.machineIds = this.machineIds?.value || [];
    }
    if (!this.isEditMode || this.canChangeUserType) {
      body.userType = Number(this.userType?.value);
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