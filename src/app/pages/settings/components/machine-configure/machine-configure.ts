import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';


@Component({
  selector: 'app-machine-configure',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './machine-configure.html',
  styleUrl: './machine-configure.scss'
})
export class MachineConfigure {
  // Inject Services
  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);

  protected readonly _fb = inject(FormBuilder);

  protected upsertMachineConfigureModalData: any;
  protected isUpsertMachineConfigureModalOpen: boolean = false;


  protected mcForm: FormGroup = this._fb.group({
    machineName: ['', []],// disable always
    machineCode: ['', [Validators.required, Validators.pattern('^M[0-9]+$')]],
    machineGroupId: ['', []],
    maxSpeedLimit: [null, [Validators.min(0)]],
    isAlertActive: [false, []]
  });



  ngOnInit(): void {
    this.loadList();
    this.loadMachineGroupList();
  }


  protected machineConfigureList: any[] = [];
  private loadList(): void {
    this._apiFs.machineConfigure.list().subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.machineConfigureList = res.data || [];
        }
      },
      error: (err: any) => { }
    });
  }


  protected machineGroupList: any[] = [];
  protected selectedMachineGroup: any;
  private loadMachineGroupList(): void {
    this._apiFs.machineGroup.list().subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.machineGroupList = res.data || [];
        }
      },
      error: (err: any) => { }
    });
  }



  get machineName(): AbstractControl | null {
    return this.mcForm.get('machineName');
  }
  get machineCode(): AbstractControl | null {
    return this.mcForm.get('machineCode');
  }
  get machineGroupId(): AbstractControl | null {
    return this.mcForm.get('machineGroupId');
  }
  get maxSpeedLimit(): AbstractControl | null {
    return this.mcForm.get('maxSpeedLimit');
  }
  get isAlertActive(): AbstractControl | null {
    return this.mcForm.get('isAlertActive');
  }

  protected onChangeAlert(): void {
    this.isAlertActive?.patchValue(!this.isAlertActive.value);
  }


  protected onOpenUpsertMachineConfigureModal(machineConfigure: any): void {
    if (!machineConfigure) return;

    this.upsertMachineConfigureModalData = machineConfigure;
    this.mcForm.patchValue({
      machineName: machineConfigure?.machineName ?? '',
      machineCode: machineConfigure?.machineCode ?? '',
      machineGroupId: machineConfigure?.machineGroupId?._id ?? '',
      maxSpeedLimit: machineConfigure?.maxSpeedLimit ?? null,
      isAlertActive: machineConfigure?.isAlertActive ?? false
    });
    this.machineName?.disable();
    this.isUpsertMachineConfigureModalOpen = true;
  }

  protected onCloseMachineConfigureModal(): void {
    this.isUpsertMachineConfigureModalOpen = false;
    this.upsertMachineConfigureModalData = null;
    this.mcForm.reset({
      machineName: '',
      machineCode: '',
      machineGroupId: '',
      maxSpeedLimit: null,
      isAlertActive: false
    });
  }

  protected isReqAlive: boolean = false;
  protected upsertMachineConfigure(): void {
    if (this.isReqAlive || !this.upsertMachineConfigureModalData?._id) return;

    if (this.mcForm?.invalid) {
      this.mcForm.markAllAsTouched();
      return;
    }

    this.isReqAlive = true;
    const body = { ...this.mcForm.value };
    body.machineGroupId = body.machineGroupId || null;

    this._apiFs.machineConfigure.update(this.upsertMachineConfigureModalData._id, body).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          const index = this.machineConfigureList.findIndex((mc) => mc._id === this.upsertMachineConfigureModalData._id);
          if (index > -1 && res.data?._id) {
            this.machineConfigureList[index] = res.data;
          }
          this._coreService.utils.showToaster(EToasterType.Success, 'Machine configuration updated successfully.');
          this.onCloseMachineConfigureModal();
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        const msg = err?.error?.message || 'Something went wrong, please try again later.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }


  protected onToggleAlert(machineConfigure: any): void {
    if (this.isReqAlive || !machineConfigure?._id) return;

    this.isReqAlive = true;
    const body = {
      isAlertActive: !machineConfigure.isAlertActive
    };

    this._apiFs.machineConfigure.update(machineConfigure._id, body).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          const index = this.machineConfigureList.findIndex((mc) => mc._id === machineConfigure._id);
          if (index > -1 && res.data?._id) {
            this.machineConfigureList[index] = res.data;
          }
          this._coreService.utils.showToaster(EToasterType.Success, 'Alert updated successfully.');
          this.onCloseMachineConfigureModal();
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