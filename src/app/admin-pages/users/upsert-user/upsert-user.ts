import { Component, DestroyRef, EventEmitter, inject, Input, Output, SimpleChanges } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

import moment from 'moment';

import { CommonDropdown } from '@src/app/shared/components/common-dropdown/common-dropdown';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';

import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';
import APP_REGEXP from '@src/app/constants/app-regexp';


@Component({
  selector: 'app-upsert-user',
  imports: [
    ReactiveFormsModule,
    CommonDropdown
  ],
  templateUrl: './upsert-user.html',
  styleUrl: './upsert-user.scss'
})
export class UpsertUser {


  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);


  @Input('workspaceList') workspaceList: any = [];
  @Input('userData') userData: any = null;
  @Output('closeOrCancel') closeOrCancel: EventEmitter<any> = new EventEmitter<any>();
  @Output('upsert') upsert: EventEmitter<any> = new EventEmitter<any>();


  protected usernameRegObj = APP_REGEXP.USER_NAME;
  protected isEditMode: boolean = false;
  protected userForm: FormGroup = this._fb.group({
    workspace: [null, [Validators.required]],
    userType: [null, [Validators.required]],
    fullname: ["", [Validators.required, Validators.maxLength(100)]],
    userName: ["", [Validators.required, Validators.minLength(this.usernameRegObj.MIN_LENGTH), Validators.pattern(this.usernameRegObj.REGEXP)]],// username/mobile number
    password: ["", [Validators.required, Validators.minLength(6)]],
    mobile: ["", [Validators.pattern('^[0-9]{10}$')]],
    email: ["", [Validators.email]],
    isActive: [true, [Validators.required]],
    receiveWhatsappReport: [{ value: false, disabled: true }],
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


  protected get showMasterFields(): boolean {
    const masterRole = this._coreService.appConfig.roles?.MASTER;
    return masterRole !== undefined && this.userType?.value === masterRole;
  }



  protected ngOnChanges(changes: SimpleChanges) {
    if (changes['userData']?.currentValue) {
      // Initializing form for edit mode
      this.isEditMode = true;
      this.userForm.patchValue({
        fullname: this.userData?.fullname ?? '',
        userName: this.userData?.userName ?? '',
        password: this.userData?.password ?? '',
        mobile: this.userData?.mobile ?? '',
        email: this.userData?.email ?? '',
        isActive: this.userData?.isActive ?? true,
        receiveWhatsappReport: this.userData?.receiveWhatsappReport ?? false,
        workspace: this.workspaceList.find((ws: any) => ws._id === this.userData.workspaceId?._id) || null,
        userType: this.userData?.userType ?? null,
        shift: this.normalizeShiftValue(this.userData?.shift),
        machineIds: this.userData?.machineIds ?? [],
      });
      if (this.userData?.isOwner) {
        const userPlan = this.userData?.plan || {};
        const plan = {
          startDate: userPlan?.startDate ? moment(userPlan.startDate).format('YYYY-MM-DD') : '',
          endDate: userPlan?.endDate ? moment(userPlan.endDate).format('YYYY-MM-DD') : '',
          subUserLimit: userPlan?.subUserLimit || 0,
        };
        this.userForm.addControl('plan', this._fb.group({
          startDate: [plan.startDate, [this.planDateValidatorFactory('endDate', 'start')]],
          endDate: [plan.endDate, [this.planDateValidatorFactory('startDate', 'end')]],
          subUserLimit: [plan.subUserLimit, [Validators.pattern('^[0-9]+$')]],
        }));
      }
      this.workspace?.disable();
      this.userType?.disable();
      this.password?.setValidators([Validators.minLength(6)]);
      if (this.showMasterFields && this.userData.workspaceId?._id) {
        this.loadMachines(this.userData.workspaceId._id);
      }
      this.syncWhatsappReportControl();
    }
    this.syncMasterFieldValidators();
  }


  protected ngOnInit(): void {
    this.syncMasterFieldValidators();
    this.syncWhatsappReportControl();
    this.mobile?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.syncWhatsappReportControl());
    this.userType?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.onUserTypeChange());
  }


  private onUserTypeChange(): void {
    this.syncMasterFieldValidators();
    const workspaceId = this.workspace?.value?._id;
    if (this.showMasterFields && workspaceId) {
      this.loadMachines(workspaceId);
    } else {
      this.machineList = [];
    }
  }


  private loadMachines(workspaceId: string): void {
    if (!workspaceId) {
      this.machineList = [];
      return;
    }

    this._apiFs.machine.optionList(workspaceId).subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.machineList = res.data?.list ?? [];
        }
      },
      error: () => {
        this.machineList = [];
      }
    });
  }


  private syncMasterFieldValidators(): void {
    if (this.showMasterFields) {
      this.shift?.setValidators([this.atLeastOneShiftValidator]);
      this.machineIds?.setValidators([Validators.required, this.atLeastOneMachineValidator]);
    } else {
      this.shift?.clearValidators();
      this.machineIds?.clearValidators();
      this.shift?.setValue([], { emitEvent: false });
      this.machineIds?.setValue([], { emitEvent: false });
    }
    this.shift?.updateValueAndValidity({ emitEvent: false });
    this.machineIds?.updateValueAndValidity({ emitEvent: false });
  }

  private syncWhatsappReportControl(): void {
    if (this.mobile?.value) {
      this.receiveWhatsappReport?.enable({ emitEvent: false });
    } else {
      this.receiveWhatsappReport?.setValue(false, { emitEvent: false });
      this.receiveWhatsappReport?.disable({ emitEvent: false });
    }
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


  protected planDateValidatorFactory(siblingKey: string, mode: 'start' | 'end'): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) return null; // parent not ready

      const selfValue = control.value;
      const siblingValue = control.parent.get(siblingKey)?.value;

      // here we need to check required validation if any of the field is not empty
      if (selfValue && !siblingValue) {
        control.parent.get(siblingKey)?.setErrors({ required: true });
        return null;
      } else if (siblingValue && !selfValue) {
        return { required: true };
      } else if (!selfValue || !siblingValue) {
        control.parent.get(siblingKey)?.setErrors(null);
        return null;// skip further validation if any field is empty
      } else {
        control.parent.get(siblingKey)?.setErrors(null);// Clear sibling errors
      }

      const start = mode === 'start' ? selfValue : siblingValue;
      const end = mode === 'end' ? selfValue : siblingValue;

      const startMoment = moment(start);
      const endMoment = moment(end);

      if (!startMoment.isValid() || !endMoment.isValid()) {
        return { invalidFormat: true };
      }

      if (endMoment.isSameOrBefore(startMoment)) {
        return { invalidTimeRange: true };
      }

      return null;
    };
  }


  get fullname(): AbstractControl | null {
    return this.userForm.get('fullname');
  }
  get workspace(): AbstractControl | null {
    return this.userForm.get('workspace');
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
  get receiveWhatsappReport(): AbstractControl | null {
    return this.userForm.get('receiveWhatsappReport');
  }
  get planStartDate(): AbstractControl | null {
    return this.userForm?.get('plan.startDate');
  }
  get planEndDate(): AbstractControl | null {
    return this.userForm?.get('plan.endDate');
  }
  get planSubUserLimit(): AbstractControl | null {
    return this.userForm?.get('plan.subUserLimit');
  }
  get shift(): AbstractControl | null {
    return this.userForm.get('shift');
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


  protected onWorkspaceChange(workspace: any): void {
    if (!workspace || workspace?._id === this.workspace?.value?._id) return;

    this.userForm.patchValue({ workspace: workspace, machineIds: [] });
    if (this.showMasterFields) {
      this.loadMachines(workspace._id);
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
    return this.machineList.length > 0 && this.machineList.every((m) => this.isMachineSelected(m._id));
  }


  protected get isSomeMachinesSelected(): boolean {
    if (!this.machineList.length) return false;
    const selectedCount = this.machineList.filter((m) => this.isMachineSelected(m._id)).length;
    return selectedCount > 0 && selectedCount < this.machineList.length;
  }


  protected onToggleMachine(machineId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
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


  protected onToggleSelectAllMachines(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const allIds = this.machineList.map((m) => m._id);
    this.machineIds?.setValue(checked ? allIds : []);
    this.machineIds?.markAsTouched();
  }



  protected isReqAlive: boolean = false;
  protected onSubmit(): void {
    if (this.isReqAlive) return;

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const { workspace, ...restFields } = this.userForm.getRawValue();
    const body: any = {
      ...restFields,
    };
    if (!body.mobile) {
      body.receiveWhatsappReport = false;
    }
    if (workspace) {
      body.workspaceId = workspace._id;
    }
    if (body.plan?.subUserLimit) {
      body.plan.subUserLimit = Number(body.plan.subUserLimit);
    }
    if (this.showMasterFields) {
      body.shift = this.normalizeShiftValue(body.shift);
      body.machineIds = body.machineIds || [];
    } else {
      delete body.shift;
      delete body.machineIds;
    }
    if (this.isEditMode) {
      delete body.userType;
    } else {
      body.userType = Number(body.userType);
    }

    this.isReqAlive = true;
    if (this.isEditMode) {
      if (!body.password) {
        delete body.password;
      }
      this._apiFs.users.adminUpdate(this.userData._id, body).subscribe({
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
      this._apiFs.users.adminCreate(body).subscribe({
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