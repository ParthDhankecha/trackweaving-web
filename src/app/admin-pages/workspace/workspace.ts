import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { EntriesPerPageSelector } from '@src/app/shared/components/entries-per-page-selector/entries-per-page-selector';
import { Pagination } from '@src/app/shared/components/pagination/pagination';
import { UpsertWorkspace } from './upsert-workspace/upsert-workspace';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';


@Component({
  selector: 'app-workspace',
  imports: [
    FormsModule,
    Pagination,
    EntriesPerPageSelector,
    UpsertWorkspace
  ],
  templateUrl: './workspace.html',
  styleUrl: './workspace.scss'
})
export class Workspace {

  // Inject services
  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _coreService = inject(CoreFacadeService);


  protected statusFilter: string = '';
  protected currentPage: number = 1;
  protected pageSize: number = 10;
  protected totalEntries: number = 0;

  protected workspaceList: any[] = [];
  protected isUpsertWorkspaceModalOpen: boolean = false;
  protected upsertWorkspaceModalData: any = null; // Data for edit, null for create
  protected deleteConfirmModalConfig: { isOpen: boolean, data: any } = {
    isOpen: false,
    data: null
  };



  ngOnInit(): void {
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
    if (this.statusFilter) {
      Object.assign(payload, { isActive: JSON.parse(this.statusFilter) });
    }

    this._apiFs.workspace.listWithPagination(payload).subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.workspaceList = res.data.list;
          this.totalEntries = res.data.totalCount || 0;
        }
      },
      error: (err) => { }
    });
  }

  protected onApplyFilter(): void {
    this.currentPage = 1; // Reset to first page on filter apply
    this.loadList();
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

  protected isStatusChangeConfirmationModalOpen: boolean = false;
  protected workspaceStatusChangeData: any = null;
  protected onStatusChange(event: any, workspace: any): void {
    this.workspaceStatusChangeData = { ...workspace };
    event?.stopPropagation();
    event?.preventDefault();
    this.isStatusChangeConfirmationModalOpen = true;
  }

  protected closeStatusChangeConfirmationModal(): void {
    this.isStatusChangeConfirmationModalOpen = false;
    this.workspaceStatusChangeData = null;
  }

  protected isReqAlive: boolean = false;
  protected confirmStatusChange(): void {
    if (this.isReqAlive) return;
    const workspaceId = this.workspaceStatusChangeData?._id;
    if (!workspaceId) return;

    const index = this.workspaceList.findIndex(w => w._id === workspaceId);
    if (index === -1) return;

    this.workspaceList[index].isActive = !this.workspaceList[index].isActive;
    this.closeStatusChangeConfirmationModal();

    this.isReqAlive = true;
    this._apiFs.workspace.update(
      workspaceId,
      { isActive: this.workspaceList[index].isActive } as any
    ).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this.workspaceList[index] = res.data;
          this._coreService.utils.showToaster(EToasterType.Success, 'Workspace status updated successfully.');
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        this.workspaceList[index].isActive = !this.workspaceList[index].isActive;
        const msg = err?.error?.message || 'Something went wrong, please try again later.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }


  protected onOpenUpsertWorkspaceModal(workspace: any = null): void {
    this.upsertWorkspaceModalData = workspace;
    this.isUpsertWorkspaceModalOpen = true;
  }

  protected onCloseWorkspaceModal(): void {
    this.isUpsertWorkspaceModalOpen = false;
  }

  protected upsertWorkspaceModalEvent(data: any): void {
    if (data) {
      const index = this.workspaceList.findIndex(w => w._id === data._id);
      if (index > -1) {
        // Update existing workspace in the list
        this.workspaceList[index] = data;
      } else {
        this.loadList();
      }
    }
    this.onCloseWorkspaceModal();
  }


  protected openDeleteConfirmModal(workspace: any): void {
    if (!workspace?._id) return;

    this.deleteConfirmModalConfig = {
      isOpen: true,
      data: workspace
    };
  }

  protected closeDeleteConfirmModal(): void {
    this.deleteConfirmModalConfig = {
      isOpen: false,
      data: null
    };
  }

  protected confirmDeleteWorkspace(): void {
    if (!this.deleteConfirmModalConfig.data?._id) return;

    console.log('Deleting workspace with ID:', this.deleteConfirmModalConfig.data);
    this.closeDeleteConfirmModal();
  }
}