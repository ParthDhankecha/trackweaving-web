import { Component, inject } from '@angular/core';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';
import { Pagination } from '@src/app/shared/components/pagination/pagination';
import { EntriesPerPageSelector } from '@src/app/shared/components/entries-per-page-selector/entries-per-page-selector';
import { UpsertUser } from './upsert-user/upsert-user';


@Component({
  selector: 'app-users',
  imports: [
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


  protected onOpenUpsertUserModal(user: any = null): void {
    this.upsertUserModalData = user;
    this.isUpsertUserModalOpen = true;
  }

  protected onCloseUserModal(): void {
    this.isUpsertUserModalOpen = false;
  }

  protected upsertDesignModalEvent(data: any): void {
    if (data) {
      this.loadList();
    }
    this.onCloseUserModal();
  }
}