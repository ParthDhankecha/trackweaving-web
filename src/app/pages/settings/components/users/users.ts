import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { UpsertUser } from './upsert-user/upsert-user';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';

import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';


@Component({
  selector: 'app-users',
  imports: [
    FormsModule,
    UpsertUser
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class Users {

  // Inject services
  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _coreService = inject(CoreFacadeService);


  protected userList: any[] = [];
  protected isUpsertUserModalOpen: boolean = false;
  protected upsertUserModalData: any = null; // Data for edit, null for create


  ngOnInit(): void {
    this.loadList();
  }


  private loadList(): void {
    this._apiFs.users.list().subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          const userData = this._coreService.utils.decodeToken?.user ?? {};
          this.userList = (res.data || []).map((u: any) => {
            return {
              ...u,
              isCurrentUser: userData?.id === u._id,
            };
          });
        }
      },
      error: (err) => { }
    });
  }

  protected isStatusChangeConfirmationModalOpen: boolean = false;
  protected userStatusChangeData: any = null;
  protected onStatusChange(event: any, user: any): void {
    event?.stopPropagation();
    event?.preventDefault();
    if (user?.isCurrentUser) return;

    this.userStatusChangeData = { ...user };
    this.isStatusChangeConfirmationModalOpen = true;
  }

  protected closeStatusChangeConfirmationModal(): void {
    this.isStatusChangeConfirmationModalOpen = false;
    this.userStatusChangeData = null;
  }

  protected isReqAlive: boolean = false;
  protected confirmStatusChange(): void {
    if (this.isReqAlive || this.upsertUserModalData?.isCurrentUser) return;
    const userId = this.userStatusChangeData?._id;
    if (!userId) return;

    const index = this.userList.findIndex(w => w._id === userId);
    if (index === -1) return;

    this.userList[index].isActive = !this.userList[index].isActive;
    this.closeStatusChangeConfirmationModal();

    this.isReqAlive = true;
    this._apiFs.users.update(
      userId, { isActive: this.userList[index].isActive } as any
    ).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this._coreService.utils.showToaster(EToasterType.Success, 'User status updated successfully.');
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        this.userList[index].isActive = !this.userList[index].isActive;
        const msg = err?.error?.message || 'Something went wrong, please try again later.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }


  protected onOpenUpsertUserModal(user: any = null): void {
    this.upsertUserModalData = user;
    this.isUpsertUserModalOpen = true;
  }

  protected onCloseUserModal(): void {
    this.isUpsertUserModalOpen = false;
    this.upsertUserModalData = null;
  }

  protected upsertUserModalEvent(data: any): void {
    if (!data?._id) {
      this.loadList();
    } else {
      const index = this.userList.findIndex(u => u._id === data._id);
      if (index !== -1) {
        this.userList[index] = {
          ...this.userList[index],
          ...data
        };
      }
    }
    this.onCloseUserModal();
  }
}