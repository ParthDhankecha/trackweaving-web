import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { EntriesPerPageSelector } from '@src/app/shared/components/entries-per-page-selector/entries-per-page-selector';
import { Pagination } from '@src/app/shared/components/pagination/pagination';
import { UpsertMachine } from './upsert-machine/upsert-machine';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';


@Component({
  selector: 'app-machine',
  imports: [
    FormsModule,
    Pagination,
    EntriesPerPageSelector,
    UpsertMachine
  ],
  templateUrl: './machine.html',
  styleUrl: './machine.scss'
})
export class Machine {

  // Inject services
  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _coreService = inject(CoreFacadeService);


  protected statusFilter: string = '';
  protected currentPage: number = 1;
  protected pageSize: number = 10;
  protected totalEntries: number = 0;

  protected machineList: any[] = [];
  protected isUpsertMachineModalOpen: boolean = false;
  protected upsertMachineModalData: any = null; // Data for edit, null for create
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
    if (this.statusFilter) {
      Object.assign(payload, { machineName: this.statusFilter });
    }
    if (this.machineSearchTerms.trim()) {
      Object.assign(payload, {
        machineCode: this.machineSearchTerms.trim(),
        ip: this.machineSearchTerms.trim()
      });
    }

    this._apiFs.machine.listWithPagination(payload).subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.machineList = res.data.list;
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


  protected onApplyFilter(): void {
    this.currentPage = 1; // Reset to first page on filter apply
    this.loadList();
  }

  protected machineSearchTerms: string = '';
  protected onMachineSearch(event: Event): void {
    event.stopPropagation();
    this.currentPage = 1; // Reset to first page on search
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


  protected onOpenUpsertMachineModal(workspace: any = null): void {
    this.upsertMachineModalData = workspace;
    this.isUpsertMachineModalOpen = true;
  }

  protected onCloseMachineModal(): void {
    this.isUpsertMachineModalOpen = false;
  }

  protected upsertMAchineModalEvent(data: any): void {
    if (data) {
      const index = this.machineList.findIndex(w => w._id === data._id);
      if (index > -1) {
        // Update existing workspace in the list
        this.machineList[index] = data;
      } else {
        this.loadList();
      }
    }
    this.onCloseMachineModal();
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

  protected confirmDeleteMachine(): void {
    if (!this.deleteConfirmModalConfig.data?._id) return;

    this.closeDeleteConfirmModal();
  }
}