import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { Observable } from 'rxjs';

import { Reports } from '@src/app/pages/reports/reports';
import { CommonDropdown } from '@src/app/shared/components/common-dropdown/common-dropdown';
import { IResponse } from '@src/app/models/http-response.model';


interface IManufacturerReportNavState {
  workspaceId?: string;
  reportType?: string;
  machineCode?: string;
  machineGroupId?: string;
}


@Component({
  selector: 'app-manufacturer-reports',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    DecimalPipe,
    DatePipe,
    NgTemplateOutlet,
    CommonDropdown
  ],
  templateUrl: '../../pages/reports/reports.html',
  styleUrl: '../../pages/reports/reports.scss'
})
export class ManufacturerReports extends Reports implements OnInit {

  override ngOnInit(): void {
    this.showFactoryFilter = true;

    const state = history.state as IManufacturerReportNavState | null;
    if (state?.workspaceId) this.selectedWorkspaceId = state.workspaceId;

    this._apiFs.manufacturerPortal.getWorkspaceOptions().subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.workspaceOptions = res.data || [];
          if (!this.selectedWorkspaceId && this.workspaceOptions.length) {
            this.selectedWorkspaceId = this.workspaceOptions[0]._id;
          }
        }
        this.initReportsPage();
      },
      error: () => this.initReportsPage()
    });
  }


  private initReportsPage(): void {
    this.syncReportTypeValidators();
    this.loadMachineList();
    this.loadMachineGroupList();
    this.loadQualityList();
    this.setSubscriptions();
  }


  protected override fetchMachineOptions(): Observable<IResponse> {
    return this._apiFs.manufacturerPortal.getReportMachines(this.selectedWorkspaceId);
  }

  protected override fetchQualities() {
    return this._apiFs.manufacturerPortal.getReportQualities(this.selectedWorkspaceId);
  }

  protected override fetchMachineGroups() {
    return this._apiFs.manufacturerPortal.getMachineGroupOptions(this.selectedWorkspaceId);
  }

  protected override fetchGenerateReport(payload: any) {
    return this._apiFs.manufacturerPortal.generateReport(payload);
  }
}