import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

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
export class ApkVersion implements OnInit {

  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _fb = inject(FormBuilder);

  protected readonly platforms = [
    { key: 'android', label: 'Android' },
    { key: 'ios', label: 'iOS' }
  ];
  protected readonly versionFields = [
    { key: 'min', label: 'Min Version' },
    { key: 'latest', label: 'Latest Version' }
  ];

  protected appVersionId: string | null = null;
  protected flavorKeys: string[] = ['base', 'pickwell'];
  protected history: any[] = [];
  protected editingHistoryId: string | null = null;
  protected deleteConfirmConfig: { isOpen: boolean; data: any } = { isOpen: false, data: null };
  protected isFlavorReqAlive: boolean = false;
  protected isHistoryReqAlive: boolean = false;
  protected isLoading: boolean = false;

  protected versionForm: FormGroup = this.buildFlavorForm({});
  protected historyForm: FormGroup = this._fb.group({
    build: [null, [Validators.required, Validators.min(1)]],
    version: ['', [Validators.required]],
    updateNote: ['']
  });


  ngOnInit(): void {
    this.loadConfig();
  }


  private platformGroup(data: any = {}): FormGroup {
    return this._fb.group({
      min: [data?.min ?? 1, [Validators.required, Validators.min(1)]],
      latest: [data?.latest ?? 1, [Validators.required, Validators.min(1)]]
    });
  }

  private flavorGroup(data: any = {}): FormGroup {
    return this._fb.group({
      android: this.platformGroup(data?.android),
      ios: this.platformGroup(data?.ios)
    });
  }

  private buildFlavorForm(flavors: Record<string, any> = {}): FormGroup {
    const keys = Object.keys(flavors || {});
    this.flavorKeys = keys.length ? keys : ['base', 'pickwell'];
    const group: Record<string, FormGroup> = {};
    for (const key of this.flavorKeys) {
      group[key] = this.flavorGroup(flavors[key]);
    }
    return this._fb.group(group);
  }

  private applyConfig(data: any): void {
    this.appVersionId = data?._id || null;
    this.history = data?.history || [];
    this.versionForm = this.buildFlavorForm(data?.flavors || {});
  }

  private loadConfig(): void {
    this.isLoading = true;
    this._apiFs.apkVersion.get().subscribe({
      next: (res: IResponse) => {
        this.isLoading = false;
        if (res.code === 'OK') {
          this.applyConfig(res.data);
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }


  protected isInvalid(form: FormGroup, path: string): boolean {
    const control = form.get(path);
    return !!(control?.touched && control?.invalid);
  }


  protected onSubmitFlavors(): void {
    if (this.isFlavorReqAlive) return;

    if (this.versionForm.invalid) {
      this.versionForm.markAllAsTouched();
      return;
    }

    const flavors: Record<string, any> = {};
    for (const key of this.flavorKeys) {
      const value = this.versionForm.get(key)?.value;
      if (value.android.min > value.android.latest || value.ios.min > value.ios.latest) {
        this._coreService.utils.showToaster(EToasterType.Danger, 'Min version cannot be greater than latest version.');
        return;
      }
      flavors[key] = {
        android: {
          min: Number(value.android.min),
          latest: Number(value.android.latest)
        },
        ios: {
          min: Number(value.ios.min),
          latest: Number(value.ios.latest)
        }
      };
    }

    this.isFlavorReqAlive = true;
    this._apiFs.apkVersion.update({ flavors }).subscribe({
      next: (res: IResponse) => {
        this.isFlavorReqAlive = false;
        if (res.code === 'OK') {
          this.applyConfig(res.data);
          this._coreService.utils.showToaster(EToasterType.Success, 'Flavors updated successfully.');
        }
      },
      error: (err: any) => {
        this.isFlavorReqAlive = false;
        const msg = err?.error?.message || 'Failed to save flavors.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }


  protected startEditHistory(item: any): void {
    this.editingHistoryId = item?._id || null;
    this.historyForm.reset({
      build: item?.build ?? null,
      version: item?.version ?? '',
      updateNote: item?.updateNote ?? ''
    });
  }

  protected cancelEditHistory(): void {
    this.editingHistoryId = null;
    this.historyForm.reset({ build: null, version: '', updateNote: '' });
  }

  protected onSubmitHistory(): void {
    if (this.isHistoryReqAlive || !this.appVersionId) return;

    if (this.historyForm.invalid) {
      this.historyForm.markAllAsTouched();
      return;
    }

    const body = {
      build: Number(this.historyForm.value.build),
      version: this.historyForm.value.version?.trim?.() ?? '',
      updateNote: this.historyForm.value.updateNote?.trim?.() ?? ''
    };

    const isEdit = !!this.editingHistoryId;
    this.isHistoryReqAlive = true;
    (isEdit ? this._apiFs.apkVersion.updateHistory(this.editingHistoryId as string, body)
      : this._apiFs.apkVersion.addHistory(body)
    ).subscribe({
      next: (res: IResponse) => {
        this.isHistoryReqAlive = false;
        if (res.code === 'OK' || res.code === 'CREATED') {
          this.applyConfig(res.data);
          this.cancelEditHistory();
          this._coreService.utils.showToaster(
            EToasterType.Success,
            isEdit ? 'History updated successfully.' : 'History added successfully.'
          );
        }
      },
      error: (err: any) => {
        this.isHistoryReqAlive = false;
        const msg = err?.error?.message || 'Failed to save history.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }


  protected openDeleteHistory(item: any): void {
    this.deleteConfirmConfig = { isOpen: true, data: item };
  }

  protected closeDeleteHistory(): void {
    this.deleteConfirmConfig = { isOpen: false, data: null };
  }

  protected confirmDeleteHistory(): void {
    const historyId = this.deleteConfirmConfig.data?._id;
    if (!historyId || this.isHistoryReqAlive) return;

    this.isHistoryReqAlive = true;
    this._apiFs.apkVersion.deleteHistory(historyId).subscribe({
      next: (res: IResponse) => {
        this.isHistoryReqAlive = false;
        if (res.code === 'OK') {
          this.applyConfig(res.data);
          if (this.editingHistoryId === historyId) {
            this.cancelEditHistory();
          }
          this.closeDeleteHistory();
          this._coreService.utils.showToaster(EToasterType.Success, 'History deleted successfully.');
        }
      },
      error: (err: any) => {
        this.isHistoryReqAlive = false;
        const msg = err?.error?.message || 'Failed to delete history.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }
}