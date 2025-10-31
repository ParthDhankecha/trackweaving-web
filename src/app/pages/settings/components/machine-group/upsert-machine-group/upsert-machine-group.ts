import { Component, EventEmitter, inject, Input, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { EToasterType } from '@src/app/models/utils.model';


@Component({
  selector: 'app-upsert-machine-group',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './upsert-machine-group.html',
  styleUrl: './upsert-machine-group.scss'
})
export class UpsertMachineGroup {
  // Inject Services
  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _fb = inject(FormBuilder);


  protected isEditMode: boolean = false;
  @Input('machineGroupData') machineGroupData: any;
  @Output('close') closeOrCancel: EventEmitter<any> = new EventEmitter<any>();
  @Output('upsert') upsert: EventEmitter<any> = new EventEmitter<any>();


  protected mgForm: FormGroup = this._fb.group({
    groupName: ['', [Validators.required, Validators.maxLength(120)]]
  });


  protected ngOnChanges(changes: SimpleChanges) {
    if (changes['machineGroupData']?.currentValue) {
      this.isEditMode = !!changes['machineGroupData']?.currentValue?._id;

      this.mgForm.patchValue({
        groupName: this.machineGroupData?.groupName || ''
      });
    }
  }


  get groupName(): AbstractControl | null {
    return this.mgForm.get('groupName');
  }


  protected isReqAlive: boolean = false;
  protected onSubmit(): void {
    if (this.isReqAlive) return;

    if (this.mgForm.invalid) {
      this.mgForm.markAllAsTouched();
      return;
    }

    const body: any = {
      groupName: this.groupName?.value
    };

    console.log('Submitting workspace form with data:', body);
    this.isReqAlive = true;
    if (!this.isEditMode) {
      this._apiFs.machineGroup.create(body).subscribe({
        next: (res: any) => {
          this.isReqAlive = false;
          if (res.code === 'CREATED') {
            this._coreService.utils.showToaster(EToasterType.Success, 'Machine Group created successfully.');
            this.upsert.emit(true);
          }
        },
        error: (err: any) => {
          this.isReqAlive = false;
          const msg = err?.error?.message || 'Something went wrong, please try again later.';
          this._coreService.utils.showToaster(EToasterType.Danger, msg);
        }
      });
    } else {
      const mgId = this.machineGroupData?._id;
      if (!mgId) {
        this.isReqAlive = false;
        this._coreService.utils.showToaster(EToasterType.Danger, 'Machine Group ID is missing.');
        return;
      }

      this._apiFs.machineGroup.update(mgId, body).subscribe({
        next: (res: any) => {
          this.isReqAlive = false;
          if (res.code === 'OK') {
            this._coreService.utils.showToaster(EToasterType.Success, 'Machine Group updated successfully.');
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