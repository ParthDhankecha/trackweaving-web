import { Component, EventEmitter, inject, Input, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import moment from 'moment';


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


  @Input('workspaceList') workspaceList: any = [];
  @Input('userData') userData: any = null;
  @Output('closeOrCancel') closeOrCancel: EventEmitter<any> = new EventEmitter<any>();
  @Output('upsert') upsert: EventEmitter<any> = new EventEmitter<any>();


  protected isEditMode: boolean = false;
  protected userForm: FormGroup = this._fb.group({
    fullname: ["", [Validators.required, Validators.maxLength(100)]],
    workspaceId: ['', [Validators.required]],
    userName: ["", [Validators.required]],
    mobile: ["", [Validators.pattern('^[0-9]{10}$')]],
    email: ["", [Validators.email]],
    password: ["", [Validators.required, Validators.minLength(6), Validators.maxLength(20)]],
    isActive: [true, [Validators.required]],
    plan: {
      startDate: [null, [Validators.required]],
      endDate: [null, [Validators.required]],
      subUserLimit: [0, [Validators.required, Validators.min(0)]],
    },
  });
  protected isEyeOpen: boolean = false;



  protected ngOnChanges(changes: SimpleChanges) {
    if (changes['userData']?.currentValue) {
      // Initializing form for edit mode
      this.isEditMode = true;
      this.userForm.patchValue(this.userData);
    }
  }


  // protected shiftTimeValidatorFactory(siblingKey: string, mode: 'start' | 'end'): ValidatorFn {
  //   return (control: AbstractControl): ValidationErrors | null => {
  //     if (!control.parent) return null; // parent not ready

  //     const selfValue = control.value;
  //     const siblingValue = control.parent.get(siblingKey)?.value;

  //     // here we need to check required validation if any of the field is not empty
  //     if (selfValue && !siblingValue) {
  //       control.parent.get(siblingKey)?.setErrors({ required: true });
  //       return null;
  //     } else if (siblingValue && !selfValue) {
  //       return { required: true };
  //     } else if (!selfValue || !siblingValue) {
  //       control.parent.get(siblingKey)?.setErrors(null);
  //       return null;// skip further validation if any field is empty
  //     } else {
  //       control.parent.get(siblingKey)?.setErrors(null);// Clear sibling errors
  //     }

  //     const start = mode === 'start' ? selfValue : siblingValue;
  //     const end = mode === 'end' ? selfValue : siblingValue;

  //     const startMoment = moment(start);
  //     const endMoment = moment(end);

  //     if (!startMoment.isValid() || !endMoment.isValid()) {
  //       return { invalidFormat: true };
  //     }

  //     if (endMoment.isSameOrBefore(startMoment)) {
  //       return { invalidTimeRange: true };
  //     }

  //     return null;
  //   };
  // }


  get fullname(): AbstractControl | null {
    return this.userForm.get('fullname');
  }
  get workspace(): AbstractControl | null {
    return this.userForm.get('workspaceId');
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

  protected onWorkspaceChange(event: Event, workspace: any): void {
    event.stopPropagation();
    this.userForm.patchValue({ workspaceId: workspace._id });
  }



  protected isReqAlive: boolean = false;
  protected onSubmit(): void {
    if (this.isReqAlive) return;

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    console.log('Submitting user form with data:', this.userForm.value);
  }


  protected onCloseOrCancel(): void {
    this.closeOrCancel.emit();
  }
}