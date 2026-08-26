import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { UpsertMaintenanceCategory } from './upsert-maintenance-category/upsert-maintenance-category';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';
import { ROUTES } from '@src/app/constants/app.routes';


@Component({
  selector: 'app-maintenance-category',
  imports: [
    UpsertMaintenanceCategory,
    RouterLink
  ],
  templateUrl: './maintenance-category.html',
  styleUrl: './maintenance-category.scss'
})
export class MaintenanceCategory {
  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly maintenanceEntryRoute = ROUTES.SETTINGS.getFullRoute(ROUTES.SETTINGS.MAINTENANCE_ENTRY);

  protected maintenanceCategoryList: any[] = [];
  protected upsertMaintenanceCategoryModalData: any = null;
  protected isUpsertMaintenanceCategoryModalOpen: boolean = false;
  protected deleteMaintenanceCategoryData: any = null;
  protected isDeleteModalOpen: boolean = false;

  ngOnInit(): void {
    this.loadList();
  }

  private loadList(): void {
    this._apiFs.maintenanceCategory.list().subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.maintenanceCategoryList = res.data || [];
        }
      },
      error: () => { }
    });
  }


  protected get hasCreateAccess(): boolean {
    return this._coreService.utils.can('maintenance_category', 'create');
  }
  protected get hasUpdateAccess(): boolean {
    return this._coreService.utils.can('maintenance_category', 'update');
  }
  protected get hasDeleteAccess(): boolean {
    return this._coreService.utils.can('maintenance_category', 'delete');
  }
  protected get hasHistoryAccess(): boolean {
    return this._coreService.utils.can('maintenance_history', 'read');
  }
  protected get hasAnyActionAccess(): boolean {
    return this.hasUpdateAccess || this.hasDeleteAccess || this.hasHistoryAccess;
  }


  protected onOpenUpsertModal(maintenanceCategory: any = null): void {
    if (!maintenanceCategory ? !this.hasCreateAccess : !this.hasUpdateAccess) return;

    this.upsertMaintenanceCategoryModalData = maintenanceCategory;
    this.isUpsertMaintenanceCategoryModalOpen = true;
  }

  protected onCloseUpsertModal(): void {
    this.isUpsertMaintenanceCategoryModalOpen = false;
    this.upsertMaintenanceCategoryModalData = null;
  }

  protected upsertMaintenanceCategoryModalEvent(data: any): void {
    const index = data ? this.maintenanceCategoryList.findIndex(item => item._id === data._id) : -1;
    if (index > -1) {
      this.maintenanceCategoryList[index] = data;
    } else {
      this.loadList();
    }
    this.onCloseUpsertModal();
  }

  protected isReqAlive = false;

  protected onToggleAlert(maintenanceCategory: any): void {
    if (!this.hasUpdateAccess) return;

    if (this.isReqAlive || !maintenanceCategory?._id) return;

    this.isReqAlive = true;
    const body = {
      isActive: !maintenanceCategory.isActive
    };

    this._apiFs.maintenanceCategory.update(maintenanceCategory._id, body).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          const index = this.maintenanceCategoryList.findIndex((mc) => mc._id === maintenanceCategory._id);
          if (index > -1 && res.data?._id) {
            this.maintenanceCategoryList[index] = res.data;
          }
          this._coreService.utils.showToaster(EToasterType.Success, 'Status updated successfully.');
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        const msg = err?.error?.message || 'Something went wrong, please try again later.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }

  protected onOpenDeleteModal(maintenanceCategory: any): void {
    if (!this.hasDeleteAccess) return;

    this.deleteMaintenanceCategoryData = maintenanceCategory;
    this.isDeleteModalOpen = true;
  }

  protected onCloseDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.deleteMaintenanceCategoryData = null;
  }

  protected onConfirmDelete(): void {
    if (!this.hasDeleteAccess) return;

    const categoryId = this.deleteMaintenanceCategoryData?._id;
    if (this.isReqAlive || !categoryId) return;

    this.isReqAlive = true;
    this._apiFs.maintenanceCategory.delete(categoryId).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this.maintenanceCategoryList = this.maintenanceCategoryList.filter(item => item._id !== categoryId);
          this._coreService.utils.showToaster(EToasterType.Success, 'Maintenance category deleted successfully.');
          this.onCloseDeleteModal();
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