import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';

import { PANNA_LABEL_MAP, PANNA_OPTIONS } from '@src/app/constants/machine';


@Component({
  selector: 'app-machine-configure',
  imports: [
    ReactiveFormsModule,
    FormsModule
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


  protected readonly pannaOptions = PANNA_OPTIONS;
  protected readonly pannaLabelMap = PANNA_LABEL_MAP;
  protected mcForm: FormGroup = this._fb.group({
    machineName: ['', []],// disable always
    machineCode: ['', [Validators.required, Validators.pattern('^M[0-9]+$')]],
    machineGroupId: ['', []],
    maxSpeedLimit: [null, [Validators.min(0)]],
    quality: ['', []],
    reed: ['', []],
    panna: [null, [Validators.required]],
  });


  protected get hasUpdateAccess(): boolean {
    return this._coreService.utils.can('machine_configure', 'update');
  }


  ngOnInit(): void {
    if (this.isAdmin) {
      this.mcForm.addControl('isAlertActive', this._fb.control(false, []));
    }
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


  protected get isAdmin(): boolean {
    return this._coreService.utils.isAdmin;
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
  get quality(): AbstractControl | null {
    return this.mcForm.get('quality');
  }
  get reed(): AbstractControl | null {
    return this.mcForm.get('reed');
  }
  get panna(): AbstractControl | null {
    return this.mcForm.get('panna');
  }
  get isAlertActive(): AbstractControl | null {
    return this.mcForm.get('isAlertActive');
  }

  private normalizePanna(value: unknown): number | null {
    const n = Number(value);
    return this.pannaOptions.some(o => o.value === n) ? n : null;
  }

  protected onChangeAlert(): void {
    this.isAlertActive?.patchValue(!this.isAlertActive.value);
  }


  protected onOpenUpsertMachineConfigureModal(machineConfigure: any): void {
    if (!this.hasUpdateAccess || !machineConfigure) return;

    this.upsertMachineConfigureModalData = machineConfigure;
    const obj: any = {
      machineName: machineConfigure?.machineName ?? '',
      machineCode: machineConfigure?.machineCode ?? '',
      machineGroupId: machineConfigure?.machineGroupId?._id ?? '',
      maxSpeedLimit: machineConfigure?.maxSpeedLimit ?? null,
      quality: machineConfigure?.quality ?? '',
      reed: machineConfigure?.reed ?? '',
      panna: this.normalizePanna(machineConfigure?.panna),
    };
    if (this.isAdmin) obj.isAlertActive = machineConfigure?.isAlertActive ?? false;

    this.mcForm.patchValue(obj);
    this.machineName?.disable();
    this.machineCode?.disable();
    this.isUpsertMachineConfigureModalOpen = true;
  }

  protected onCloseMachineConfigureModal(): void {
    this.isUpsertMachineConfigureModalOpen = false;
    this.upsertMachineConfigureModalData = null;
    const obj: any = {
      machineName: '',
      machineCode: '',
      machineGroupId: '',
      maxSpeedLimit: null,
      quality: '',
      reed: '',
      panna: null,
    };
    if (this.isAdmin) obj.isAlertActive = false;

    this.mcForm.reset(obj);
  }

  protected isReqAlive: boolean = false;
  protected upsertMachineConfigure(): void {
    if (!this.hasUpdateAccess) return;
    if (this.isReqAlive || !this.upsertMachineConfigureModalData?._id) return;

    if (this.mcForm?.invalid) {
      this.mcForm.markAllAsTouched();
      return;
    }

    this.isReqAlive = true;
    const body = { ...this.mcForm.value };
    body.machineGroupId = body.machineGroupId || null;
    body.panna = this.normalizePanna(body.panna);

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
    if (!this.isAdmin || this.isReqAlive || !machineConfigure?._id) return;

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


  protected isGroupChangeConfirmOpen: boolean = false;
  protected groupChangeConfirmData: {
    machine: any;
    newGroupId: string | null;
    currentGroupName: string;
    newGroupName: string;
    selectEl: HTMLSelectElement;
  } | null = null;

  protected getMachineGroupId(machineConfigure: any): string {
    const group = machineConfigure?.machineGroupId;
    if (!group) return '';
    return typeof group === 'string' ? group : (group._id ?? '');
  }

  protected onGroupChangeRequest(newGroupId: string, machineConfigure: any, selectEl: HTMLSelectElement): void {
    if (!this.hasUpdateAccess) return;

    const normalizedNewId = newGroupId || null;
    const currentGroupId = this.getMachineGroupId(machineConfigure) || null;

    if (normalizedNewId === currentGroupId) return;

    const selectedGroup = this.machineGroupList.find((mg) => mg._id === normalizedNewId);
    this.groupChangeConfirmData = {
      machine: machineConfigure,
      newGroupId: normalizedNewId,
      currentGroupName: machineConfigure?.machineGroupId?.groupName || '-',
      newGroupName: selectedGroup?.groupName || '-',
      selectEl
    };
    this.isGroupChangeConfirmOpen = true;
  }

  protected closeGroupChangeConfirm(): void {
    if (this.groupChangeConfirmData?.selectEl) {
      this.groupChangeConfirmData.selectEl.value =
        this.getMachineGroupId(this.groupChangeConfirmData.machine);
    }
    this.isGroupChangeConfirmOpen = false;
    this.groupChangeConfirmData = null;
  }

  protected confirmGroupChange(): void {
    if (!this.hasUpdateAccess) return;
    if (this.isReqAlive || !this.groupChangeConfirmData?.machine?._id) return;

    const machineId = this.groupChangeConfirmData.machine._id;
    const body = {
      machineGroupId: this.groupChangeConfirmData.newGroupId
    };

    this.isReqAlive = true;
    this._apiFs.machineConfigure.update(machineId, body).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          const index = this.machineConfigureList.findIndex((mc) => mc._id === machineId);
          if (index > -1 && res.data?._id) {
            this.machineConfigureList[index] = res.data;
          }
          this._coreService.utils.showToaster(EToasterType.Success, 'Machine group updated successfully.');
          this.isGroupChangeConfirmOpen = false;
          this.groupChangeConfirmData = null;
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        this.closeGroupChangeConfirm();
        const msg = err?.error?.message || 'Something went wrong, please try again later.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }
}