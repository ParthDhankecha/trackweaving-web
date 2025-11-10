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
  protected filteredPartChangeList: any[] = [];
  protected machineList: any[] = [];

  protected upsertPartsChangeEntryModalData: any;
  protected isUpsertPartsChangeEntryModalOpen: boolean = false;

  protected toggleFilterPopup: boolean = false;
  protected cacheSearchTerm: string = '';


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
    const payload = {};
    if (this.pageSize && this.pageSize > 0) {
      Object.assign(payload, { limit: this.pageSize });
    }
    if (this.currentPage && this.currentPage > 0) {
      Object.assign(payload, { page: this.currentPage });
    }

    this._apiFs.partsChangeEntry.listPagination(payload).subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.partChangeList = res.data.partChangeLogs;
          this.filteredPartChangeList = [...this.partChangeList];
          this.totalEntries = res.data.totalCount ?? 0;

          // Reset filter states
          this.filterPartChangeList = [];
          this.filteredFilterPartChangeList = [];
          this.cacheFilterPartChangeList = [];
          this.isAllFilterSelected = false;
          this.cacheSearchTerm = '';
        }
      },
      error: (err) => { }
    });
  }


  protected onOpenUpsertPartChangeModal(pce: any = null): void {
    this.upsertPartsChangeEntryModalData = pce;
    this.isUpsertPartsChangeEntryModalOpen = true;
  }

  protected onClosePartChangeModal(): void {
    this.isUpsertPartsChangeEntryModalOpen = false;
  }

  protected upsertPartChangeModalEvent(data: any): void {
    this.loadList();
    this.onClosePartChangeModal();
  }


  protected filterPartChangeList: any[] = [];
  protected filteredFilterPartChangeList: any[] = [];
  protected cacheFilterPartChangeList: any[] = [];
  protected isAllFilterSelected: boolean = false;
  protected onSearchTerms(event: string): void {
    this.cacheSearchTerm = event;
    event = event?.trim()?.toLowerCase() || '';
    this.filteredFilterPartChangeList = this.filterPartChangeList.filter((item: any) => {
      const machineName = item.machineName?.trim()?.toLowerCase() || '';
      const machineCode = item.machineCode?.trim()?.toLowerCase() || '';
      return machineCode.includes(event) || machineName.includes(event);
    });
    this.updateAllSelectedFlag();
  }

  protected onOpenFilterPopup(): void {
    const filterPartChangeList = new Map<string, any>();
    this.partChangeList.forEach(({ machineId }: any) => {
      if (machineId) {
        const key = `${machineId.machineName}-${machineId.machineCode}`;
        if (key !== '-' && !filterPartChangeList.has(key)) filterPartChangeList.set(key, machineId);
      }
    });
    if (!this.filterPartChangeList.length && this.filterPartChangeList.length !== filterPartChangeList.size) {
      this.filterPartChangeList = Array.from(filterPartChangeList.values());
      this.filteredFilterPartChangeList = this.filterPartChangeList;
    }
    this.cacheFilterPartChangeList = JSON.parse(JSON.stringify(this.filterPartChangeList));
    this.toggleFilterPopup = true;
  }

  protected onToggleSelectAllFilters(): void {
    this.isAllFilterSelected = !this.isAllFilterSelected;
    this.filteredFilterPartChangeList.forEach((item: any) => {
      item.selected = this.isAllFilterSelected;
    });
  }

  protected updateAllSelectedFlag(): void {
    this.isAllFilterSelected = this.filteredFilterPartChangeList.length > 0 && this.filteredFilterPartChangeList.every((item: any) => item.selected);
  }

  protected onFilterSelectionChange(): void {
    this.updateAllSelectedFlag();
  }

  protected onApplyFilterPopup(): void {
    this.toggleFilterPopup = false;
    const selectedIds = new Set(this.filterPartChangeList.filter(i => i.selected).map(i => i._id));
    this.filteredPartChangeList = selectedIds.size ? this.partChangeList.filter((item: any) => selectedIds.has(item?.machineId?._id)) : [...this.partChangeList];
  }

  protected onCloseOrCancelFilterPopup(): void {
    this.toggleFilterPopup = false;
    this.filterPartChangeList = JSON.parse(JSON.stringify(this.cacheFilterPartChangeList));
    this.onSearchTerms('');
  }
}