import { Component, inject } from '@angular/core';

import { Pagination } from '@src/app/shared/components/pagination/pagination';
import { EntriesPerPageSelector } from '@src/app/shared/components/entries-per-page-selector/entries-per-page-selector';
import { UpsertOperator } from "./upsert-operator/upsert-operator";

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';


@Component({
  selector: 'app-operators',
  imports: [
    Pagination,
    EntriesPerPageSelector,
    UpsertOperator
  ],
  templateUrl: './operators.html',
  styleUrl: './operators.scss'
})
export class Operators {
  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);

  protected operatorList: any[] = [];
  protected upsertOperatorModalData: any = null;
  protected isUpsertOperatorModalOpen: boolean = false;
  protected deleteOperatorData: any = null;
  protected isDeleteModalOpen: boolean = false;
  protected isReqAlive: boolean = false;

  protected currentPage: number = 1;
  protected pageSize: number = 10;
  protected totalEntries: number = 0;


  ngOnInit(): void {
    this.loadList();
  }


  protected get hasCreateAccess(): boolean {
    return this._coreService.utils.can('operator', 'create');
  }
  protected get hasUpdateAccess(): boolean {
    return this._coreService.utils.can('operator', 'update');
  }
  protected get hasDeleteAccess(): boolean {
    return this._coreService.utils.can('operator', 'delete');
  }
  protected get hasAnyActionAccess(): boolean {
    return this.hasUpdateAccess || this.hasDeleteAccess;
  }


  private formatOperatorCb(operator: any): any {
    return {
      ...operator,
      displayShift: operator?.shift === 1 ? 'Night' : operator?.shift === 0 ? 'Day' : '',
      displayMachines: operator?.machineIds?.map?.((m: any) => m?.machineCode)?.join(', ') || ''
    };
  }

  private loadList(): void {
    const payload: { page?: number; limit?: number } = {};
    if (this.pageSize && this.pageSize > 0) {
      payload.limit = this.pageSize;
    }
    if (this.currentPage && this.currentPage > 0) {
      payload.page = this.currentPage;
    }

    this._apiFs.operator.list(payload).subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          const { list, count } = res.data || {};
          this.operatorList = (Array.isArray(list) ? list : []).map(this.formatOperatorCb);
          this.totalEntries = count ?? this.operatorList.length;
        }
      },
      error: () => { }
    });
  }

  protected onPageChange(page: number): void {
    this.currentPage = page;
    this.loadList();
  }

  protected onEntriesPerPageChange(event: number): void {
    const newSize = event;
    if (newSize && newSize > 0) {
      this.currentPage = 1;
      this.pageSize = newSize;
      this.onPageChange(this.currentPage);
    }
  }


  protected onOpenUpsertModal(operator: any = null): void {
    if (!operator ? !this.hasCreateAccess : !this.hasUpdateAccess) return;

    this.upsertOperatorModalData = operator;
    this.isUpsertOperatorModalOpen = true;
  }

  protected onCloseUpsertModal(): void {
    this.isUpsertOperatorModalOpen = false;
    this.upsertOperatorModalData = null;
  }

  protected upsertOperatorModalEvent(data: any): void {
    const index = data ? this.operatorList.findIndex((item) => item._id === data._id) : -1;
    if (index > -1) {
      this.operatorList[index] = this.formatOperatorCb(data);
    } else {
      this.loadList();
    }
    this.onCloseUpsertModal();
  }


  protected onOpenDeleteModal(operator: any): void {
    if (!this.hasDeleteAccess) return;

    this.deleteOperatorData = operator;
    this.isDeleteModalOpen = true;
  }

  protected onCloseDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.deleteOperatorData = null;
  }

  protected onConfirmDelete(): void {
    if (!this.hasDeleteAccess) return;

    const operatorId = this.deleteOperatorData?._id;
    if (this.isReqAlive || !operatorId) return;

    this.isReqAlive = true;
    this._apiFs.operator.delete(operatorId).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this._coreService.utils.showToaster(EToasterType.Success, 'Operator deleted successfully.');
          this.onCloseDeleteModal();

          if (this.operatorList.length === 1 && this.currentPage > 1) {
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
}