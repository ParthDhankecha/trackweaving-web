import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { Pagination } from '@src/app/shared/components/pagination/pagination';
import { EntriesPerPageSelector } from '@src/app/shared/components/entries-per-page-selector/entries-per-page-selector';
import { UpsertPartsChangeEntry } from './upsert-parts-change-entry/upsert-parts-change-entry';
import { SearchInput } from '@src/app/shared/components/search-input/search-input';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';

import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';


@Component({
  selector: 'app-parts-change-entry',
  imports: [
    DatePipe,
    FormsModule,
    EntriesPerPageSelector,
    Pagination,
    SearchInput,
    UpsertPartsChangeEntry
  ],
  templateUrl: './parts-change-entry.html',
  styleUrl: './parts-change-entry.scss'
})
export class PartsChangeEntry {

  // Inject services
  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);

  protected readonly _fb = inject(FormBuilder);


  protected partsNameList: any[] = [];
  protected partChangeList: any[] = [];
  protected machineList: any[] = [];
  protected selectedMachineIds: string[] = [];

  protected upsertPartsChangeEntryModalData: any;
  protected isUpsertPartsChangeEntryModalOpen: boolean = false;
  protected deletePartChangeData: any = null;
  protected isDeleteModalOpen: boolean = false;
  protected isReqAlive: boolean = false;

  protected toggleFilterPopup: boolean = false;
  protected cacheSearchTerm: string = '';
  protected filterMachineList: any[] = [];
  protected filteredFilterMachineList: any[] = [];
  protected cacheFilterMachineList: any[] = [];
  protected isAllFilterSelected: boolean = false;


  protected get hasCreateAccess(): boolean {
    return this._coreService.utils.can('part_change_entry', 'create');
  }
  protected get hasUpdateAccess(): boolean {
    return this._coreService.utils.can('part_change_entry', 'update');
  }
  protected get hasDeleteAccess(): boolean {
    return this._coreService.utils.can('part_change_entry', 'delete');
  }
  protected get hasAnyActionAccess(): boolean {
    return this.hasUpdateAccess || this.hasDeleteAccess;
  }


  ngOnInit(): void {
    this.loadPartsNameList();
    this.loadMachineList();
    this.loadList();
  }


  private loadPartsNameList(): void {
    this._apiFs.partsChangeEntry.partsList().subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.partsNameList = res.data || [];
        }
      },
      error: (error: any) => {
        console.error('Error fetching parts name list:', error);
      }
    });
  }
  private loadMachineList(): void {
    this._apiFs.machineConfigure.optionList().subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.machineList = res.data || [];
        }
      },
      error: (error: any) => {
        console.error('Error fetching machine list:', error);
      }
    });
  }


  protected currentPage: number = 1;
  protected pageSize: number = 10;
  protected totalEntries: number = 0;
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


  private loadList(): void {
    const payload: { page?: number; limit?: number; machineIds?: string[] } = {};
    if (this.pageSize && this.pageSize > 0) {
      payload.limit = this.pageSize;
    }
    if (this.currentPage && this.currentPage > 0) {
      payload.page = this.currentPage;
    }
    if (this.selectedMachineIds.length) {
      payload.machineIds = this.selectedMachineIds;
    }

    this._apiFs.partsChangeEntry.listPagination(payload).subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          const { list, count } = res.data;
          if (Array.isArray(list)) {
            this.partChangeList = list;
            this.totalEntries = count ?? list.length;
          }
        }
      },
      error: (err) => { }
    });
  }


  protected onOpenUpsertPartChangeModal(pce: any = null): void {
    if (pce ? !this.hasUpdateAccess : !this.hasCreateAccess) return;

    this.upsertPartsChangeEntryModalData = pce;
    this.isUpsertPartsChangeEntryModalOpen = true;
  }

  protected onClosePartChangeModal(): void {
    this.isUpsertPartsChangeEntryModalOpen = false;
  }

  protected upsertPartChangeModalEvent(data: any): void {
    this.onClosePartChangeModal();
    const index = this.partChangeList.findIndex((item: any) => item._id === data?._id);
    if (index !== -1) {
      this.partChangeList[index] = data;
    } else {
      this.loadList();
    }
  }


  protected onOpenDeleteModal(pce: any): void {
    if (!this.hasDeleteAccess) return;

    this.deletePartChangeData = pce;
    this.isDeleteModalOpen = true;
  }

  protected onCloseDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.deletePartChangeData = null;
  }

  protected onConfirmDelete(): void {
    if (!this.hasDeleteAccess) return;

    const pceId = this.deletePartChangeData?._id;
    if (this.isReqAlive || !pceId) return;

    this.isReqAlive = true;
    this._apiFs.partsChangeEntry.delete(pceId).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this._coreService.utils.showToaster(EToasterType.Success, 'Parts change entry deleted successfully.');
          this.onCloseDeleteModal();

          if (this.partChangeList.length === 1 && this.currentPage > 1) {
            this.currentPage--;
          }
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


  protected get hasActiveFilters(): boolean {
    return this.selectedMachineIds.length > 0;
  }

  protected onSearchTerms(event: string): void {
    this.cacheSearchTerm = event;
    event = event?.trim()?.toLowerCase() || '';
    this.filteredFilterMachineList = this.filterMachineList.filter((item: any) => {
      const machineName = item.machineName?.trim()?.toLowerCase() || '';
      const machineCode = item.machineCode?.trim()?.toLowerCase() || '';
      return machineCode.includes(event) || machineName.includes(event);
    });
    this.updateAllSelectedFlag();
  }

  protected onOpenFilterPopup(): void {
    const selectedIds = new Set(this.selectedMachineIds);
    this.filterMachineList = this.machineList.map((machine: any) => ({
      ...machine,
      selected: selectedIds.has(machine._id)
    }));
    this.filteredFilterMachineList = [...this.filterMachineList];
    this.cacheFilterMachineList = JSON.parse(JSON.stringify(this.filterMachineList));
    this.cacheSearchTerm = '';
    this.updateAllSelectedFlag();
    this.toggleFilterPopup = true;
  }

  protected onToggleSelectAllFilters(): void {
    this.isAllFilterSelected = !this.isAllFilterSelected;
    const visibleIds = new Set(this.filteredFilterMachineList.map((item: any) => item._id));
    this.filterMachineList.forEach((item: any) => {
      if (visibleIds.has(item._id)) {
        item.selected = this.isAllFilterSelected;
      }
    });
    this.filteredFilterMachineList.forEach((item: any) => {
      item.selected = this.isAllFilterSelected;
    });
  }

  protected updateAllSelectedFlag(): void {
    this.isAllFilterSelected = this.filteredFilterMachineList.length > 0
      && this.filteredFilterMachineList.every((item: any) => item.selected);
  }

  protected onFilterSelectionChange(changedMachine: any): void {
    const sourceMachine = this.filterMachineList.find((item: any) => item._id === changedMachine._id);
    if (sourceMachine) {
      sourceMachine.selected = changedMachine.selected;
    }
    this.updateAllSelectedFlag();
  }

  protected onApplyFilterPopup(): void {
    this.toggleFilterPopup = false;
    this.selectedMachineIds = this.filterMachineList
      .filter((item: any) => item.selected)
      .map((item: any) => item._id);
    this.currentPage = 1;
    this.loadList();
  }

  protected onClearFilters(): void {
    this.selectedMachineIds = [];
    this.filterMachineList.forEach((item: any) => item.selected = false);
    this.filteredFilterMachineList.forEach((item: any) => item.selected = false);
    this.isAllFilterSelected = false;
    this.currentPage = 1;
    this.loadList();
  }

  protected onCloseOrCancelFilterPopup(): void {
    this.toggleFilterPopup = false;
    this.filterMachineList = JSON.parse(JSON.stringify(this.cacheFilterMachineList));
    this.filteredFilterMachineList = [...this.filterMachineList];
    this.onSearchTerms('');
  }
}