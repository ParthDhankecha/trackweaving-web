import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ROUTES } from '@src/app/constants/app.routes';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { EntriesPerPageSelector } from '@src/app/shared/components/entries-per-page-selector/entries-per-page-selector';
import { Pagination } from '@src/app/shared/components/pagination/pagination';
import { UpsertManufacturer } from './upsert-manufacturer/upsert-manufacturer';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';


@Component({
  selector: 'app-manufacturer',
  imports: [
    FormsModule,
    Pagination,
    EntriesPerPageSelector,
    UpsertManufacturer
  ],
  templateUrl: './manufacturer.html',
  styleUrl: './manufacturer.scss'
})
export class ManufacturerPage {

  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _coreService = inject(CoreFacadeService);
  private readonly _router = inject(Router);

  protected searchTerm: string = '';
  protected statusFilter: string = '';
  protected currentPage: number = 1;
  protected pageSize: number = 10;
  protected totalEntries: number = 0;

  protected manufacturerList: any[] = [];
  protected isUpsertModalOpen: boolean = false;
  protected upsertModalData: any = null;
  protected deleteConfirmConfig: { isOpen: boolean; data: any } = { isOpen: false, data: null };


  ngOnInit(): void {
    this.loadList();
  }


  private loadList(): void {
    const payload: any = { limit: this.pageSize, page: this.currentPage };
    if (this.statusFilter !== '') payload.isActive = JSON.parse(this.statusFilter);
    if (this.searchTerm) payload.companyName = this.searchTerm;

    this._apiFs.manufacturer.listWithPagination(payload).subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.manufacturerList = res.data.list;
          this.totalEntries = res.data.totalCount || 0;
        }
      },
      error: () => { }
    });
  }

  protected onApplyFilter(): void {
    this.currentPage = 1;
    this.loadList();
  }

  protected onSearch(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.currentPage = 1;
      this.loadList();
    }
  }

  protected onPageChange(page: number): void {
    this.currentPage = page;
    this.loadList();
  }

  protected onEntriesPerPageChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadList();
  }

  protected onOpenCreate(): void {
    this.upsertModalData = null;
    this.isUpsertModalOpen = true;
  }

  protected onOpenEdit(item: any): void {
    this.upsertModalData = item;
    this.isUpsertModalOpen = true;
  }

  protected onOpenUsers(item: any): void {
    if (!item?._id) return;

    this._router.navigate(
      [ROUTES.ADMIN.getFullRoute(ROUTES.ADMIN.MANUFACTURER_USER)],
      { state: { manufacturerId: item._id } }
    );
  }

  protected onCloseModal(): void {
    this.isUpsertModalOpen = false;
    this.upsertModalData = null;
  }

  protected onUpserted(): void {
    this.isUpsertModalOpen = false;
    this.upsertModalData = null;
    this.loadList();
  }

  protected onOpenDelete(item: any): void {
    this.deleteConfirmConfig = { isOpen: true, data: item };
  }

  protected onCancelDelete(): void {
    this.deleteConfirmConfig = { isOpen: false, data: null };
  }

  protected onConfirmDelete(): void {
    const id = this.deleteConfirmConfig.data?._id;
    if (!id) return;

    this._apiFs.manufacturer.delete(id).subscribe({
      next: (res: IResponse) => {
        this.deleteConfirmConfig = { isOpen: false, data: null };
        if (res.code === 'OK') {
          this._coreService.utils.showToaster(EToasterType.Success, 'Manufacturer deleted.');
          this.loadList();
        }
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'Delete failed.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }
}