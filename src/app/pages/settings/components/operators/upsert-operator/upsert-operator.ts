import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';
import { AppSrc } from '@src/app/shared/directives/src';


@Component({
  selector: 'app-upsert-operator',
  imports: [
    ReactiveFormsModule,
    AppSrc
  ],
  templateUrl: './upsert-operator.html',
  styleUrl: './upsert-operator.scss'
})
export class UpsertOperator implements OnInit, OnChanges {
  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _fb = inject(FormBuilder);

  protected isEditMode: boolean = false;
  protected machineList: any[] = [];
  protected isReqAlive: boolean = false;
  protected alreadyAssignedIds: string[] = [];
  protected profileFile: File | null = null;
  protected profilePreview: string | null = null;
  protected removeProfile: boolean = false;

  @Input('operatorData') operatorData: any;
  @Output('close') closeOrCancel = new EventEmitter<void>();
  @Output('upsert') upsert = new EventEmitter<any>();

  protected operatorForm: FormGroup = this._fb.group({
    operatorName: ['', [Validators.required, Validators.maxLength(120)]],
    shift: [null, [Validators.required]],
    machineIds: [[]]
  });
  protected readonly shiftOptions: { value: number, label: string }[] = [
    { value: 0, label: 'Day Shift' },
    { value: 1, label: 'Night Shift' },
  ];


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['operatorData']?.currentValue) {
      this.isEditMode = !!changes['operatorData']?.currentValue?._id;
      this.alreadyAssignedIds = [];
      this.profileFile = null;
      this.profilePreview = null;
      this.removeProfile = false;
      this.operatorForm.patchValue({
        operatorName: this.operatorData?.operatorName || '',
        shift: this.shiftOptions.find((s) => s.value === this.operatorData?.shift)?.value ?? null,
        machineIds: (this.operatorData?.machineIds || []).map((m: any) => String(m._id))
      });
      return;
    }
  }


  ngOnInit(): void {
    this.loadMachines();
  }


  get operatorName(): AbstractControl | null {
    return this.operatorForm.get('operatorName');
  }
  get shift(): AbstractControl | null {
    return this.operatorForm.get('shift');
  }
  get machineIds(): AbstractControl | null {
    return this.operatorForm.get('machineIds');
  }


  private loadMachines(): void {
    this._apiFs.machineConfigure.optionList().subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.machineList = Array.isArray(res.data) ? res.data : [];
        }
      },
      error: () => {
        this.machineList = [];
      }
    });
  }


  protected isMachineSelected(machineId: string): boolean {
    return (this.machineIds?.value || []).includes(machineId);
  }

  protected isAlreadyAssigned(machineId: string): boolean {
    return this.alreadyAssignedIds.includes(String(machineId));
  }

  protected get alreadyAssignedMachineCodes(): string[] {
    if (!this.alreadyAssignedIds.length) return [];
    const byId = new Map(this.machineList.map((m) => [String(m._id), String(m.machineCode || m._id)]));
    return this.alreadyAssignedIds.map((id) => byId.get(id) || id);
  }

  protected get isAllMachinesSelected(): boolean {
    return !!this.machineList.length && this.machineList.length === (this.machineIds?.value || []).length;
  }

  protected onShiftChange(): void {
    this.alreadyAssignedIds = [];
  }

  protected get existingProfile(): string | null {
    if (this.removeProfile) return null;
    return this.profilePreview || this.operatorData?.profile || null;
  }

  protected onProfileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!/^image\/(jpeg|jpg|png)$/i.test(file.type)) {
      this._coreService.utils.showToaster(EToasterType.Danger, 'Please select a JPG or PNG image.');
      input.value = '';
      return;
    }

    this.profileFile = file;
    this.removeProfile = false;

    const reader = new FileReader();
    reader.onload = () => {
      this.profilePreview = typeof reader.result === 'string' ? reader.result : null;
    };
    reader.readAsDataURL(file);
  }

  protected onRemoveProfile(profileInput?: HTMLInputElement): void {
    if (!this.existingProfile) return;

    this.profileFile = null;
    this.profilePreview = null;
    this.removeProfile = true;
    if (profileInput) {
      profileInput.value = '';
    }
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


  protected onSubmit(): void {
    if (this.isReqAlive) return;

    if (this.operatorForm.invalid) {
      this.operatorForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    const data: any = {
      operatorName: String(this.operatorName?.value || '').trim(),
      shift: Number(this.shift?.value),
      machineIds: this.machineIds?.value || []
    };
    if (this.isEditMode && this.removeProfile) data.removeProfile = true;

    formData.append('data', JSON.stringify(data));
    if (this.profileFile) {
      formData.append('profile', this.profileFile);
    }

    this.alreadyAssignedIds = [];
    this.isReqAlive = true;
    if (!this.isEditMode) {
      this._apiFs.operator.create(formData).subscribe({
        next: (res: any) => {
          this.isReqAlive = false;
          if (res.code === 'CREATED') {
            this._coreService.utils.showToaster(EToasterType.Success, 'Operator created successfully.');
            this.upsert.emit(res.data);
          }
        },
        error: (err: any) => this.handleUpsertError(err)
      });
      return;
    }

    const operatorId = this.operatorData?._id;
    if (!operatorId) {
      this.isReqAlive = false;
      this._coreService.utils.showToaster(EToasterType.Danger, 'Operator ID is missing.');
      return;
    }

    this._apiFs.operator.update(operatorId, formData).subscribe({
      next: (res: any) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this._coreService.utils.showToaster(EToasterType.Success, 'Operator updated successfully.');
          this.upsert.emit(res.data);
        }
      },
      error: (err: any) => this.handleUpsertError(err)
    });
  }


  private handleUpsertError(err: any): void {
    this.isReqAlive = false;
    const payload = err?.error || {};
    const assigned = payload?.data?.alreadyAssigned;
    this.alreadyAssignedIds = Array.isArray(assigned) ? assigned.map((id: any) => String(id)) : [];

    const codes = this.alreadyAssignedMachineCodes;
    const baseMsg = payload?.message || 'Something went wrong, please try again later.';
    const msg = codes.length ? `${baseMsg} Already assigned: ${codes.join(', ')}.` : baseMsg;
    this._coreService.utils.showToaster(EToasterType.Danger, msg);
  }


  protected onCloseOrCancel(): void {
    this.closeOrCancel.emit();
  }
}