import { Component, EventEmitter, inject, Input, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';
import { ApiFacadeService } from '@src/app/services/api-facade-service';


@Component({
  selector: 'app-upsert-apk-version',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './upsert-apk-version.html',
  styleUrl: './upsert-apk-version.scss'
})
export class UpsertApkVersion {

  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _fb = inject(FormBuilder);


  @Input('apkVersionData') apkVersionData: any = null;
  @Output('closeOrCancel') closeOrCancel: EventEmitter<any> = new EventEmitter<any>();
  @Output('upsert') upsert: EventEmitter<any> = new EventEmitter<any>();


  protected readonly appTypeList: string[] = ['android', 'ios'];
  protected isEditMode: boolean = false;

  protected apkVForm: FormGroup = this._fb.group({
    appType: ['', [Validators.required]],
    version: ['', [Validators.required, Validators.pattern(/^\d+(\.\d+){0,2}$/)]],// e.g., 1 or 1.0 or 1.0.0
    showPopup: [true, [Validators.required]],
    hardUpdate: [true, [Validators.required]],
  });


  protected ngOnChanges(changes: SimpleChanges) {
    if (changes['apkVersionData']?.currentValue) {
      this.isEditMode = true;
      this.apkVForm.patchValue({
        appType: this.apkVersionData.appType,
        version: this.apkVersionData.version,
        showPopup: this.apkVersionData.showPopup,
        hardUpdate: this.apkVersionData.hardUpdate,
      });
    }
  }


  get ff_appType(): AbstractControl | null {
    return this.apkVForm.get('appType');
  }
  get ff_version(): AbstractControl | null {
    return this.apkVForm.get('version');
  }
  get ff_showPopup(): AbstractControl | null {
    return this.apkVForm.get('showPopup');
  }
  get ff_hardUpdate(): AbstractControl | null {
    return this.apkVForm.get('hardUpdate');
  }


  protected isReqAlive: boolean = false;
  protected onSubmit(): void {
    if (this.isReqAlive) return;

    if (this.apkVForm.invalid) {
      this.apkVForm.markAllAsTouched();
      return;
    }

    this.isReqAlive = true;
    const body = {
      appType: this.ff_appType?.value,
      version: this.ff_version?.value,
      showPopup: this.ff_showPopup?.value,
      hardUpdate: this.ff_hardUpdate?.value,
    };
    if (this.isEditMode) {
      if (!this.apkVersionData?._id) {
        this.isReqAlive = false;
        return;
      }

      this._apiFs.apkVersion.update(this.apkVersionData?._id, body).subscribe({
        next: (res: IResponse) => {
          this.isReqAlive = false;
          if (res.code === 'OK') {
            this._coreService.utils.showToaster(EToasterType.Success, 'APK Version updated successfully');
            this.upsert.emit(res.data);
          }
        },
        error: (err: any) => {
          this.isReqAlive = false;
          const msg = err?.error?.message || 'Failed to update APK Version';
          this._coreService.utils.showToaster(EToasterType.Danger, msg);
        }
      });
    } else {
      this._apiFs.apkVersion.create(body).subscribe({
        next: (res: IResponse) => {
          this.isReqAlive = false;
          if (res.code === 'CREATED') {
            this._coreService.utils.showToaster(EToasterType.Success, 'APK Version created successfully');
            this.upsert.emit(true);
          }
        },
        error: (err: any) => {
          this.isReqAlive = false;
          const msg = err?.error?.message || 'Failed to create APK Version';
          this._coreService.utils.showToaster(EToasterType.Danger, msg);
        }
      });
    }
  }

  protected onCloseOrCancel(): void {
    this.closeOrCancel.emit();
  }
}