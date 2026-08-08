import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';


@Component({
  selector: 'app-apk-version',
  imports: [
    ReactiveFormsModule,
    DatePipe
  ],
  templateUrl: './apk-version.html',
  styleUrl: './apk-version.scss'
})
export class ApkVersion {

  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _fb = inject(FormBuilder);

  protected appVersionId: string | null = null;
  protected history: any[] = [];
  protected showHistory: boolean = false;
  protected isReqAlive: boolean = false;
  protected isLoading: boolean = false;


  protected versionForm: FormGroup = this._fb.group({
    android: this._fb.group({
      min: [1, [Validators.required, Validators.min(1)]],
      latest: [1, [Validators.required, Validators.min(1)]],
      updateNote: ['']
    }),
    ios: this._fb.group({
      min: [1, [Validators.required, Validators.min(1)]],
      latest: [1, [Validators.required, Validators.min(1)]],
      updateNote: ['']
    })
  });


  ngOnInit(): void {
    this.loadConfig();
  }


  get ff_android(): FormGroup {
    return this.versionForm.get('android') as FormGroup;
  }

  get ff_ios(): FormGroup {
    return this.versionForm.get('ios') as FormGroup;
  }


  private loadConfig(): void {
    this.isLoading = true;
    this._apiFs.apkVersion.get().subscribe({
      next: (res: IResponse) => {
        this.isLoading = false;
        if (res.code === 'OK' && res.data) {
          this.appVersionId = res.data?._id || null;
          this.history = res.data?.history || [];
          const android = res.data?.android || {};
          const ios = res.data?.ios || {};
          this.versionForm.patchValue({
            android: {
              min: android?.min ?? 1,
              latest: android?.latest ?? 1,
              updateNote: android?.updateNote ?? ''
            },
            ios: {
              min: ios?.min ?? 1,
              latest: ios?.latest ?? 1,
              updateNote: ios?.updateNote ?? ''
            }
          });
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }


  private platformControl(platform: 'android' | 'ios', field: string): AbstractControl | null {
    return this.versionForm.get(`${platform}.${field}`);
  }

  protected getAndroidControl(field: string): AbstractControl | null {
    return this.platformControl('android', field);
  }

  protected getIosControl(field: string): AbstractControl | null {
    return this.platformControl('ios', field);
  }


  protected onSubmit(): void {
    if (this.isReqAlive) return;

    if (this.versionForm.invalid) {
      this.versionForm.markAllAsTouched();
      return;
    }

    const android = this.ff_android.value;
    const ios = this.ff_ios.value;
    if (android.min > android.latest || ios.min > ios.latest) {
      this._coreService.utils.showToaster(EToasterType.Danger, 'Min version cannot be greater than latest version.');
      return;
    }

    this.isReqAlive = true;
    const body = {
      android: {
        min: Number(android.min),
        latest: Number(android.latest),
        updateNote: android.updateNote?.trim?.() ?? ''
      },
      ios: {
        min: Number(ios.min),
        latest: Number(ios.latest),
        updateNote: ios.updateNote?.trim?.() ?? ''
      }
    };

    const funNm = this.appVersionId ? 'update' : 'create';
    this._apiFs.apkVersion[funNm](body).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK' || res.code === 'CREATED') {
          this.appVersionId = res.data?._id || this.appVersionId;
          this.history = res.data?.history || [];
          this._coreService.utils.showToaster(
            EToasterType.Success,
            res.code === 'CREATED' ? 'App version created successfully.' : 'App version updated successfully.'
          );
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        const msg = err?.error?.message || 'Failed to save app version.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }
}