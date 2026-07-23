import { Component, inject, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';

import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { ROUTES } from '@src/app/constants/app.routes';


@Component({
  selector: 'app-manufacturer-overview',
  imports: [DecimalPipe],
  templateUrl: './overview.html',
  styleUrl: './overview.scss'
})
export class ManufacturerOverview implements OnInit {

  protected readonly _apiFs  = inject(ApiFacadeService);
  protected readonly _coreService = inject(CoreFacadeService);
  private readonly _router = inject(Router);

  protected isLoading = true;
  protected overview: any = null;


  ngOnInit(): void {
    this.loadOverview();
  }

  private loadOverview(): void {
    this.isLoading = true;
    this._apiFs.manufacturerPortal.getOverview().subscribe({
      next: (res: IResponse) => {
        this.isLoading = false;
        if (res.code === 'OK') this.overview = res.data;
      },
      error: () => { this.isLoading = false; }
    });
  }

  protected get machineTypeEntries(): { key: string; count: number }[] {
    if (!this.overview?.byMachineType) return [];
    return Object.entries(this.overview.byMachineType).map(([key, count]) => ({ key, count: count as number }));
  }

  protected viewFactoryDashboard(workspaceId: string): void {
    if (!workspaceId) return;

    this._router.navigate(
      [ROUTES.MANUFACTURER.getFullRoute(ROUTES.MANUFACTURER.DASHBOARD)],
      { state: { workspaceId } }
    );
  }
}
