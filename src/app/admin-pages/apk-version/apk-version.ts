import { Component, inject } from '@angular/core';

import { UpsertApkVersion } from './upsert-apk-version/upsert-apk-version';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';


@Component({
  selector: 'app-apk-version',
  imports: [
    UpsertApkVersion
  ],
  templateUrl: './apk-version.html',
  styleUrl: './apk-version.scss'
})
export class ApkVersion {

  // Inject services
  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _coreService = inject(CoreFacadeService);


  protected readonly appTypeList: ('android' | 'ios')[] = ['android', 'ios'];
  protected selectedAppType: 'android' | 'ios' = 'android';

  protected apkVersionList: any[] = [];
  protected isUpsertModalOpen: boolean = false;
  protected upsertModalData: any = null; // Data for edit, null for create


  ngOnInit(): void {
    this.loadList();
  }

  private loadList(): void {
    this._apiFs.apkVersion.list(this.selectedAppType).subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.apkVersionList = res.data;
        }
      },
      error: (err) => { }
    });
  }

  protected onTabChange(appType: 'android' | 'ios'): void {
    if (this.selectedAppType !== appType) {
      this.selectedAppType = appType;
      this.loadList();
    }
  }


  protected isStatusChangeConfirmationModalOpen: boolean = false;
  protected userStatusChangeData: any = null;
  protected onStatusChange(event: any, user: any, key: string): void {
    this.userStatusChangeData = { ...user, keyToChange: key };
    event?.stopPropagation();
    event?.preventDefault();
    this.isStatusChangeConfirmationModalOpen = true;
  }

  protected closeStatusChangeConfirmationModal(): void {
    this.isStatusChangeConfirmationModalOpen = false;
    this.userStatusChangeData = null;
  }

  protected isReqAlive: boolean = false;
  protected confirmStatusChange(): void {
    if (this.isReqAlive) return;
    const userId = this.userStatusChangeData?._id;
    if (!userId || !this.userStatusChangeData?.keyToChange) return;

    const index = this.apkVersionList.findIndex(w => w._id === userId);
    if (index === -1) return;

    const keyToChange = this.userStatusChangeData?.keyToChange;
    this.apkVersionList[index][keyToChange] = !this.apkVersionList[index][keyToChange];
    this.closeStatusChangeConfirmationModal();

    this.isReqAlive = true;
    this._apiFs.apkVersion.update(
      userId,
      { [keyToChange]: this.apkVersionList[index][keyToChange] }
    ).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this.apkVersionList[index] = res.data;
          this._coreService.utils.showToaster(EToasterType.Success, 'APK Version updated successfully.');
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        this.apkVersionList[index][keyToChange] = !this.apkVersionList[index][keyToChange];
        const msg = err?.error?.message || 'Something went wrong, please try again later.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }


  protected onOpenUpsertUserModal(user: any = null): void {
    this.upsertModalData = user;
    this.isUpsertModalOpen = true;
  }

  protected onCloseOrCancelModal(): void {
    this.isUpsertModalOpen = false;
    this.upsertModalData = null;
  }

  protected upsertModalEvent(data: any): void {
    if (data) {
      if (!data?._id) {
        this.loadList();
      } else {
        const index = this.apkVersionList.findIndex(u => u._id === data._id);
        if (index !== -1) {
          this.apkVersionList[index] = data;
        }
      }
    }
    this.onCloseOrCancelModal();
  }


  protected deleteConfirmModalConfig: { isOpen: boolean, data: any } = {
    isOpen: false,
    data: null
  };

  protected onOpenDeleteConfirmModal(user: any): void {
    this.deleteConfirmModalConfig = {
      isOpen: true,
      data: user
    };
  }

  protected closeDeleteConfirmModal(): void {
    this.deleteConfirmModalConfig = {
      isOpen: false,
      data: null
    };
  }

  protected confirmDelete(): void {
    if (this.isReqAlive) return;
    const apkId = this.deleteConfirmModalConfig.data?._id;
    if (!apkId) return;

    const index = this.apkVersionList.findIndex(apk => apk._id === apkId);
    if (index === -1) return;

    this.isReqAlive = true;
    this._apiFs.apkVersion.delete(apkId).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this._coreService.utils.showToaster(EToasterType.Success, 'APK Version deleted successfully.');
          this.closeDeleteConfirmModal();
          this.loadList();
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        const msg = err?.error?.message || 'Failed to delete APK Version';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }

}