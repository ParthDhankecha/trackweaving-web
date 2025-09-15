import { Component, inject } from '@angular/core';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';
import { Pagination } from '@src/app/shared/components/pagination/pagination';
import { EntriesPerPageSelector } from '@src/app/shared/components/entries-per-page-selector/entries-per-page-selector';
import { UpsertUser } from './upsert-user/upsert-user';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-users',
  imports: [
    FormsModule,
    Pagination,
    EntriesPerPageSelector,
    UpsertUser
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class Users {

  // Inject services
  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _coreService = inject(CoreFacadeService);


  protected currentPage: number = 1;
  protected pageSize: number = 10;
  protected totalEntries: number = 0;

  protected userList: any[] = [];
  protected isUpsertUserModalOpen: boolean = false;
  protected upsertUserModalData: any = null; // Data for edit, null for create
  protected deleteConfirmModalConfig: { isOpen: boolean, data: any } = {
    isOpen: false,
    data: null
  };

  protected workspaceList: { _id: string, firmName: string }[] = [];


  ngOnInit(): void {
    this.loadWorkspaceList();
    this.loadList();
  }


  private loadList(): void {
    const payload = {};
    if (this.pageSize && this.pageSize > 0) {
      Object.assign(payload, { limit: this.pageSize });
    }
    if (this.currentPage && this.currentPage > 0) {
      Object.assign(payload, { page: this.currentPage });
    }
    if (this.userSearchTerms.trim()) {
      const search = {
        fullname: this.userSearchTerms.trim(),
        userName: this.userSearchTerms.trim(),
        uid: this.userSearchTerms.trim()
      };
      Object.assign(payload, { search: search });
    }

    this._apiFs.users.listWithPagination(payload).subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.userList = res.data.list;
          this.totalEntries = res.data.totalCount || 0;
        }
      },
      error: (err) => { }
    });
  }

  private loadWorkspaceList(): void {
    this._apiFs.workspace.optionList().subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK' && res.data && Array.isArray(res.data)) {
          this.workspaceList = res.data;
        }
      },
      error: (err) => { }
    });
  }

  protected onPageChange(page: number): void {
    this.currentPage = page;
    this.loadList();
  }

  protected onEntriesPerPageChange(event: number): void {
    const newSize = event;
    if (newSize && newSize > 0) {
      this.currentPage = 1; // Reset to first page
      this.pageSize = newSize;
      this.onPageChange(this.currentPage);
    }
  }

  protected userSearchTerms: string = '';
  protected onUserSearch(event: Event): void {
    event.stopPropagation();
    this.currentPage = 1; // Reset to first page on search
    this.loadList();
  }

  protected isStatusChangeConfirmationModalOpen: boolean = false;
  protected userStatusChangeData: any = null;
  protected onStatusChange(event: any, workspace: any): void {
    this.userStatusChangeData = { ...workspace };
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
    if (!userId) return;

    const index = this.userList.findIndex(w => w._id === userId);
    if (index === -1) return;

    this.userList[index].isActive = !this.userList[index].isActive;
    this.closeStatusChangeConfirmationModal();

    this.isReqAlive = true;
    this._apiFs.users.update(
      userId,
      { isActive: this.userList[index].isActive } as any
    ).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this.userList[index] = res.data;
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
    if (data) {
      if (!data?._id) {
        this.loadList();
      } else {
        const index = this.userList.findIndex(u => u._id === data._id);
        if (index !== -1) {
          this.userList[index] = data;
        }
      }
    }
    this.onCloseUserModal();
  }


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

  protected confirmDeleteUser(): void {
    if (this.isReqAlive) return;
    const userId = this.deleteConfirmModalConfig.data?._id;
    if (!userId) return;

    const index = this.userList.findIndex(u => u._id === userId);
    if (index === -1) return;

    this.isReqAlive = true;
    this._apiFs.users.delete(userId).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this._coreService.utils.showToaster(EToasterType.Success, 'User deleted successfully.');
          this.closeDeleteConfirmModal();
          this.loadList();
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