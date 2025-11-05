import { Component, EventEmitter, inject, Input, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { EToasterType } from '@src/app/models/utils.model';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { SearchInput } from '@src/app/shared/components/search-input/search-input';


@Component({
  selector: 'app-upsert-machine',
  imports: [
    ReactiveFormsModule,
    SearchInput
  ],
  templateUrl: './upsert-machine.html',
  styleUrl: './upsert-machine.scss'
})
export class UpsertMachine {

  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _fb = inject(FormBuilder);


  protected readonly _machineNames: string[] = ['taitan', 'signature', 'rifa'];
  protected isEditMode: boolean = false;
  @Input('workspaceList') workspaceList: any = [];
  protected filteredWorkspaceList: any = [];
  @Input('machineData') machineData: any = null;
  @Output('close') closeOrCancel: EventEmitter<any> = new EventEmitter<any>();
  @Output('upsert') upsert: EventEmitter<any> = new EventEmitter<any>();


  protected machineForm: FormGroup = this._fb.group({
    machineCode: ['', [Validators.required, Validators.pattern('^M[0-9]+$')]],
    machineName: ['', [Validators.required, Validators.maxLength(100)]],
    ip: ['', [Validators.required, Validators.pattern(/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/)]],
    workspace: ['', [Validators.required]],
    deviceType: ['', [Validators.required]],
    displayType: ['', [Validators.required]],
  });
  protected isEyeOpen: boolean = false;
  protected readonly deviceTypeList: string[] = ['lan', 'rs485'];
  protected readonly displayTypeList: string[] = ['nazon', 'chitic'];



  protected ngOnChanges(changes: SimpleChanges) {
    if (changes['workspaceList']?.currentValue) {
      this.filteredWorkspaceList = this.workspaceList;
      if (this.cacheSearchTerms) {
        this.onSearchTerms(this.cacheSearchTerms);
      }
    }

    if (!changes['machineData']?.currentValue && changes['machineData']?.firstChange) {
      // Initializing form for create mode
      this.isEditMode = false;
    } else if (changes['machineData']?.currentValue) {
      // Initializing form for edit mode
      this.isEditMode = true;
      const workspaceData = this.workspaceList.find((ws: any) => ws._id === this.machineData.workspaceId?._id);
      this.machineForm.patchValue({
        machineCode: this.machineData.machineCode || '',
        machineName: this.machineData.machineName || '',
        ip: this.machineData.ip || '',
        workspace: workspaceData || null,
        deviceType: this.machineData?.deviceType || '',
        displayType: this.machineData?.displayType || '',
      });
    }
  }



  protected getMachineCode(workspaceId: string): void {
    this._apiFs.machine.getMachineCode(workspaceId).subscribe({
      next: (res: any) => {
        if (res.code === 'OK') {
          this.machineForm.patchValue({ machineCode: res.data.machineCode });
        }
      },
      error: (err) => { }
    });
  }



  get machineCode(): AbstractControl | null {
    return this.machineForm.get('machineCode');
  }
  get deviceType(): AbstractControl | null {
    return this.machineForm.get('deviceType');
  }
  get displayType(): AbstractControl | null {
    return this.machineForm.get('displayType');
  }
  get machineName(): AbstractControl | null {
    return this.machineForm.get('machineName');
  }
  get machineIp(): AbstractControl | null {
    return this.machineForm.get('ip');
  }
  get workspace(): AbstractControl | null {
    return this.machineForm.get('workspace');
  }



  private cacheSearchTerms: string = '';
  protected onSearchTerms(event: string): void {
    this.cacheSearchTerms = event;
    this.filteredWorkspaceList = this.workspaceList.filter((item: any) => item.firmName.toLowerCase().includes(event));
  }

  protected onWorkspaceChange(workspace: any): void {
    if (!workspace || workspace?._id === this.workspace?.value?._id) return;

    this.machineForm.patchValue({ workspace: workspace });
    if (this.cacheSearchTerms) this.onSearchTerms('');
    this.getMachineCode(workspace._id);
  }



  protected isReqAlive: boolean = false;
  protected onSubmit(): void {
    if (this.isReqAlive) return;

    if (this.machineForm.invalid) {
      this.machineForm.markAllAsTouched();
      return;
    }

    const { workspace, ...restFields } = this.machineForm.value;
    const body = {
      ...restFields,
      workspaceId: workspace._id
    };

    this.isReqAlive = true;
    if (!this.isEditMode) {
      this._apiFs.machine.create(body).subscribe({
        next: (res: any) => {
          this.isReqAlive = false;
          if (res.code === 'CREATED') {
            this._coreService.utils.showToaster(EToasterType.Success, 'Machine created successfully.');
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
      const machineId = this.machineData?._id;
      if (!machineId) {
        this.isReqAlive = false;
        this._coreService.utils.showToaster(EToasterType.Danger, 'Machine ID is missing.');
        return;
      }

      this._apiFs.machine.update(machineId, body).subscribe({
        next: (res: any) => {
          this.isReqAlive = false;
          if (res.code === 'OK') {
            this._coreService.utils.showToaster(EToasterType.Success, 'Machine updated successfully.');
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