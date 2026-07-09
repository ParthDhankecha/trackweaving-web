import { Component, inject, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';


@Component({
  selector: 'app-manufacturer-analytics',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss'
})
export class ManufacturerAnalytics implements OnInit {

  protected readonly _apiFs = inject(ApiFacadeService);

  protected isLoading = false;
  protected analytics: any = null;

  protected workspaceOptions: any[] = [];
  protected filterWorkspace = '';
  protected filterType = '';

  readonly machineTypes = ['rapier', 'airjet', 'waterjet', 'circular'];


  ngOnInit(): void {
    this._apiFs.manufacturerPortal.getWorkspaceOptions().subscribe({
      next: (res: IResponse) => { if (res.code === 'OK') this.workspaceOptions = res.data || []; },
      error: () => {}
    });
    this.loadAnalytics();
  }

  protected loadAnalytics(): void {
    this.isLoading = true;
    const payload: any = {};
    if (this.filterWorkspace) payload.workspaceId = this.filterWorkspace;
    if (this.filterType)      payload.machineType = this.filterType;

    this._apiFs.manufacturerPortal.getAnalytics(payload).subscribe({
      next: (res: IResponse) => {
        this.isLoading = false;
        if (res.code === 'OK') this.analytics = res.data;
      },
      error: () => { this.isLoading = false; }
    });
  }

  protected onFilter(): void { this.loadAnalytics(); }

  protected get maxStopCount(): number {
    if (!this.analytics?.topStops?.length) return 1;
    return Math.max(...this.analytics.topStops.map((s: any) => s.count), 1);
  }

  protected stopBarWidth(count: number): number {
    return Math.round((count / this.maxStopCount) * 100);
  }

  protected formatDuration(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
}
