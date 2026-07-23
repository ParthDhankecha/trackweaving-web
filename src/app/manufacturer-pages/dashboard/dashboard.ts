import { NgClass, NgTemplateOutlet } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { interval, of } from 'rxjs';

import { Header } from '@src/app/layouts/header/header';
import { Footer } from '@src/app/layouts/footer/footer';
import { ModalLayer } from '@src/app/shared/components/modal-layer/modal-layer';
import { RegisterModalLayer } from '@src/app/shared/directives/register-modal-layer';

import { Dashboard } from '@src/app/pages/dashboard/dashboard';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { IMachineLog } from '@src/app/models/machine.model';


interface IManufacturerDashboardNavState {
  workspaceId?: string;
}


@Component({
  selector: 'app-manufacturer-dashboard',
  imports: [
    FormsModule,
    NgClass,
    NgTemplateOutlet,
    Header,
    Footer,
    ModalLayer,
    RegisterModalLayer
  ],
  templateUrl: '../../pages/dashboard/dashboard.html',
  styleUrl: '../../pages/dashboard/dashboard.scss'
})
export class ManufacturerDashboard extends Dashboard implements OnInit, OnDestroy {

  private readonly navState: IManufacturerDashboardNavState | null;

  constructor(
    apiFs: ApiFacadeService,
    router: Router,
    coreService: CoreFacadeService
  ) {
    super(apiFs, router, coreService);
    this.navState = (router.currentNavigation()?.extras?.state as IManufacturerDashboardNavState | undefined)
      ?? (history.state as IManufacturerDashboardNavState | null) ?? null;
    this.dashboardHeaderMode = 'manufacturer-dashboard';
    this.footerContentOnly = true;
    this.showFactoryFilter = true;

    const workspaceId = this.navState?.workspaceId;
    if (workspaceId) this.selectedWorkspaceId = workspaceId;
  }

  override ngOnInit(): void {
    this.loadWorkspaceOptions();
    this.loadMachineGroups();
    this.getMachineLogs();
    this.refreshSub = interval(this.config.refreshInterval * 1000).subscribe(() => {
      this.getMachineLogs();
    });
  }

  private loadWorkspaceOptions(): void {
    this._apiFs.manufacturerPortal.getWorkspaceOptions().subscribe({
      next: (res: IResponse) => {
        if (res.code !== 'OK') return;

        this.workspaceOptions = res.data || [];
        if (!this.selectedWorkspaceId && this.workspaceOptions.length) {
          this.selectedWorkspaceId = this.workspaceOptions[0]._id;
          this.loadMachineGroups();
          this.getMachineLogs();
        }
      },
      error: () => { }
    });
  }

  protected override fetchMachineLogs(payload: any) {
    return this._apiFs.manufacturerPortal.getMachineLogList({
      workspaceId: this.selectedWorkspaceId,
      status: payload.status,
      page: payload.page,
      limit: payload.limit,
      ...(this.selectedMachineType && { machineType: this.selectedMachineType })
    });
  }

  protected override fetchMachineGroups() {
    if (!this.selectedWorkspaceId) {
      return of({ code: 'OK', data: [] } as IResponse);
    }

    return this._apiFs.manufacturerPortal.getMachineGroupOptions(this.selectedWorkspaceId);
  }

  protected override onTotalStopsClick(_machineLog: IMachineLog): void {
    // Manufacturer portal has no workspace report route.
  }
}