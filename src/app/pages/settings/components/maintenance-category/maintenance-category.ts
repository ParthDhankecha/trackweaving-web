import { Component, inject } from '@angular/core';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';


@Component({
  selector: 'app-maintenance-category',
  imports: [],
  templateUrl: './maintenance-category.html',
  styleUrl: './maintenance-category.scss'
})
export class MaintenanceCategory {
  // Inject Services
  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);


  ngOnInit(): void {
    this.loadList();
  }


  protected maintenanceCategoryList: any[] = [];
  private loadList(): void {
    this._apiFs.maintenanceCategory.list().subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.maintenanceCategoryList = res.data || [];
        }
      },
      error: (err: any) => { }
    });
  }


  protected isReqAlive: boolean = false;
  protected onToggleAlert(maintenanceCategory: any): void {
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
          this._coreService.utils.showToaster(EToasterType.Success, 'Alert updated successfully.');
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