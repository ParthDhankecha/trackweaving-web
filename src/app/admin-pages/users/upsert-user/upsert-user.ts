import { Component, EventEmitter, inject, Input, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

import moment from 'moment';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { SearchInput } from '@src/app/shared/components/search-input/search-input';


@Component({
  selector: 'app-upsert-user',
  imports: [
    ReactiveFormsModule,
    SearchInput
  ],
  templateUrl: './upsert-user.html',
  styleUrl: './upsert-user.scss'
})
export class UpsertUser {


  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _fb = inject(FormBuilder);


  @Input('workspaceList') workspaceList: any = [];
  protected filteredWorkspaceList: any = [];
  @Input('userData') userData: any = null;
  @Output('closeOrCancel') closeOrCancel: EventEmitter<any> = new EventEmitter<any>();
  @Output('upsert') upsert: EventEmitter<any> = new EventEmitter<any>();


  protected isEditMode: boolean = false;
  protected userForm: FormGroup = this._fb.group({
    workspace: [null, [Validators.required]],
    fullname: ["", [Validators.required, Validators.maxLength(100)]],
    userName: ["", [Validators.required]],// username/mobile number
    password: ["", [Validators.required, Validators.minLength(6), Validators.maxLength(20)]],
    mobile: ["", [Validators.pattern('^[0-9]{10}$')]],
    email: ["", [Validators.email]],
    isActive: [true, [Validators.required]],
    plan: this._fb.group({
      startDate: ['', [this.planDateValidatorFactory('endDate', 'start')]],
      endDate: ['', [this.planDateValidatorFactory('startDate', 'end')]],
      subUserLimit: [0, [Validators.pattern('^[0-9]+$')]],
    }),
  });
  protected isEyeOpen: boolean = false;



  protected ngOnChanges(changes: SimpleChanges) {
    if (changes['workspaceList']?.currentValue) {
      this.filteredWorkspaceList = this.workspaceList;
      if (this.cacheSearchTerms) {
        this.onSearchTerms(this.cacheSearchTerms);
      }
    }

    if (changes['userData']?.currentValue) {
      // Initializing form for edit mode
      this.isEditMode = true;
      const plan = this.userData?.plan || {};
      this.userForm.patchValue({
        ...this.userData,
        workspace: this.workspaceList.find((ws: any) => ws._id === this.userData.workspaceId?._id) || null,
        plan: {
          startDate: plan?.startDate ? moment(plan.startDate).format('YYYY-MM-DD') : '',
          endDate: plan?.endDate ? moment(plan.endDate).format('YYYY-MM-DD') : '',
          subUserLimit: plan?.subUserLimit || 0,
        }
      });
      this.password?.clearValidators();
    }
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
  get planStartDate(): AbstractControl | null {
    return this.userForm.get('plan.startDate');
  }
  get planEndDate(): AbstractControl | null {
    return this.userForm.get('plan.endDate');
  }
  get planSubUserLimit(): AbstractControl | null {
    return this.userForm.get('plan.subUserLimit');
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

  private cacheSearchTerms: string = '';
  protected onSearchTerms(event: string): void {
    this.cacheSearchTerms = event;
    this.filteredWorkspaceList = this.workspaceList.filter((item: any) => item.firmName.toLowerCase().includes(event));
  }

  protected onWorkspaceChange(workspace: any): void {
    if (!workspace || workspace?._id === this.workspace?.value?._id) return;

    this.userForm.patchValue({ workspace: workspace });
    if (this.cacheSearchTerms) this.onSearchTerms('');
  }



  protected isReqAlive: boolean = false;
  protected onSubmit(): void {
    if (this.isReqAlive) return;

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const { workspace, ...restFields } = this.userForm.value;
    const body: any = {
      ...restFields,
      workspaceId: workspace._id
    };
    if (body.plan?.subUserLimit) {
      body.plan.subUserLimit = Number(body.plan.subUserLimit);
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