import { Component, EventEmitter, inject, Input, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

import moment from 'moment';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';
import { IWorkspace } from '@src/app/models/workspace.model';
import { ApiFacadeService } from '@src/app/services/api-facade-service';


@Component({
  selector: 'app-upsert-workspace',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './upsert-workspace.html',
  styleUrl: './upsert-workspace.scss'
})
export class UpsertWorkspace {

  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _fb = inject(FormBuilder);

  protected isEditMode: boolean = false;
  @Input('workspaceData') workspaceData: any = null;
  @Output('close') closeOrCancel: EventEmitter<any> = new EventEmitter<any>();
  @Output('upsert') upsert: EventEmitter<any> = new EventEmitter<any>();


  protected readonly formConfig: any = {
    // for workspace only
    workspace: {
      // firm name - Create - Edit
      workspaceName: ['', [Validators.required, Validators.maxLength(100)]],
      // status - Create - Edit
      isActive: [true, [Validators.required]],
      // GST number - Create - Edit - .e.x '24AAACC1206D1ZM'
      GSTNo: ['', [Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)]],
      dayShift: this._fb.group({
        startTime: ['', [Validators.required]],// this.shiftTimeValidatorFactory('endTime', 'start')
        endTime: ['', [Validators.required]],// this.shiftTimeValidatorFactory('startTime', 'end')
      }),
      nightShift: this._fb.group({
        startTime: ['', [Validators.required]],// this.shiftTimeValidatorFactory('endTime', 'start')
        endTime: ['', [Validators.required]],// this.shiftTimeValidatorFactory('startTime', 'end')
      }),
    },
    // for user only
    user: {
      // user full name - Create - 
      name: ['', [Validators.required]],
      // mobile number - Create - 
      userName: ['', [Validators.required]],
      // email - Create - 
      userEmail: ['', [Validators.email]],
      // mobile number - Create - 
      mobile: ['', [Validators.pattern('^[0-9]{10}$')]],
      // password - Create
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]],
    }
  };
  protected workspaceForm!: FormGroup;
  protected isEyeOpen: boolean = false;



  protected ngOnChanges(changes: SimpleChanges) {
    if (!changes['workspaceData']?.currentValue && changes['workspaceData']?.firstChange) {
      // Initializing form for create mode
      this.workspaceForm = this._fb.group({
        ...this.formConfig.workspace,
        ...this.formConfig.user,
      });
      this.isEditMode = false;
    } else if (changes['workspaceData']?.currentValue) {
      // Initializing form for edit mode
      this.isEditMode = true;
      this.workspaceForm = this._fb.group({
        ...this.formConfig.workspace
      });

      // let shiftType = this.workspaceData?.dayShift ? 'day' : 'night';
      // const shiftData = this.workspaceData?.[`${shiftType}Shift`] || {};
      this.workspaceForm.patchValue({
        workspaceName: this.workspaceData?.firmName || '',
        GSTNo: this.workspaceData?.GSTNo || '',
        dayShift: this.workspaceData?.dayShift,
        nightShift: this.workspaceData?.nightShift,
        isActive: this.workspaceData?.isActive || false
      });
    }
  }


  protected shiftTimeValidatorFactory(siblingKey: string, mode: 'start' | 'end'): ValidatorFn {
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

      const startMoment = moment(start, 'HH:mm');
      const endMoment = moment(end, 'HH:mm');

      if (!startMoment.isValid() || !endMoment.isValid()) {
        return { invalidFormat: true };
      }

      if (endMoment.isSameOrBefore(startMoment)) {
        return { invalidTimeRange: true };
      }

      return null;
    };
  }

  get workspaceName(): AbstractControl | null {
    return this.workspaceForm.get('workspaceName');
  }
  get isActive(): AbstractControl | null {
    return this.workspaceForm.get('isActive');
  }
  get gstNumber(): AbstractControl | null {
    return this.workspaceForm.get('GSTNo');
  }
  get shiftType(): AbstractControl | null {
    return this.workspaceForm.get('shiftType');
  }
  get dayStartTime(): AbstractControl | null {
    return this.workspaceForm?.controls?.['dayShift']?.get('startTime');
  }
  get dayEndTime(): AbstractControl | null {
    return this.workspaceForm?.controls?.['dayShift']?.get('endTime');
  }
  get nightStartTime(): AbstractControl | null {
    return this.workspaceForm?.controls?.['nightShift']?.get('startTime');
  }
  get nightEndTime(): AbstractControl | null {
    return this.workspaceForm?.controls?.['nightShift']?.get('endTime');
  }
  get name(): AbstractControl | null {
    return this.workspaceForm.get('name');
  }
  get userName(): AbstractControl | null {
    return this.workspaceForm.get('userName');
  }
  get userEmail(): AbstractControl | null {
    return this.workspaceForm.get('userEmail');
  }
  get mobile(): AbstractControl | null {
    return this.workspaceForm.get('mobile');
  }
  get password(): AbstractControl | null {
    return this.workspaceForm.get('password');
  }





  protected isReqAlive: boolean = false;
  protected onSubmit(): void {
    if (this.isReqAlive) return;

    if (this.workspaceForm.invalid) {
      this.workspaceForm.markAllAsTouched();
      return;
    }

    const body: IWorkspace = {
      ...this.workspaceForm.value
    };

    console.log('Submitting workspace form with data:', body);
    this.isReqAlive = true;
    if (!this.isEditMode) {
      this._apiFs.workspace.create(body).subscribe({
        next: (res: IResponse) => {
          this.isReqAlive = false;
          if (res.code === 'CREATED') {
            this._coreService.utils.showToaster(EToasterType.Info, 'Workspace created successfully.');
            this.upsert.emit();
          }
        },
        error: (err: any) => {
          this.isReqAlive = false;
          const msg = err?.error?.message || 'Something went wrong, please try again later.';
          this._coreService.utils.showToaster(EToasterType.Danger, msg);
        }
      });
    } else {
      const workspaceId = this.workspaceData?._id;
      if (!workspaceId) {
        this.isReqAlive = false;
        this._coreService.utils.showToaster(EToasterType.Danger, 'Workspace ID is missing.');
        return;
      }

      this._apiFs.workspace.update(workspaceId, body).subscribe({
        next: (res: IResponse) => {
          this.isReqAlive = false;
          if (res.code === 'OK') {
            this._coreService.utils.showToaster(EToasterType.Info, 'Workspace updated successfully.');
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
  }


  protected onCloseOrCancel(): void {
    this.closeOrCancel.emit();
  }
}