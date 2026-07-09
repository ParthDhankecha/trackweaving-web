import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { DecimalPipe, NgClass, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';

import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';


@Component({
  selector: 'app-manufacturer-machines',
  imports: [FormsModule, DecimalPipe, NgClass, TitleCasePipe],
  templateUrl: './machines.html',
  styleUrl: './machines.scss'
})
export class ManufacturerMachines implements OnInit, OnDestroy {

  protected readonly _apiFs = inject(ApiFacadeService);

  protected isLoading = false;
  protected machineList: any[] = [];
  protected totalCount = 0;

  protected workspaceOptions: any[] = [];
  protected filterWorkspace = '';
  protected filterType = '';
  protected searchTerm = '';
  protected currentPage = 1;
  protected pageSize = 20;

  readonly machineTypes = ['rapier', 'airjet', 'waterjet', 'circular'];

  // Live view
  protected viewMode: 'table' | 'live' = 'table';
  private refreshSub?: Subscription;
  protected readonly REFRESH_INTERVAL_SEC = 30;
  protected refreshCountdown = this.REFRESH_INTERVAL_SEC;
  private countdownSub?: Subscription;


  ngOnInit(): void {
    // Use manufacturer-scoped workspace options (not admin endpoint)
    this._apiFs.manufacturerPortal.getWorkspaceOptions().subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') this.workspaceOptions = res.data || [];
      },
      error: () => {}
    });
    this.loadList();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  loadList(): void {
    this.isLoading = true;
    const payload: any = { page: this.currentPage, limit: this.pageSize };
    if (this.filterWorkspace) payload.workspaceId = this.filterWorkspace;
    if (this.filterType)      payload.machineType = this.filterType;
    if (this.searchTerm)      payload.search = this.searchTerm;

    this._apiFs.manufacturerPortal.getMachineList(payload).subscribe({
      next: (res: IResponse) => {
        this.isLoading = false;
        if (res.code === 'OK') {
          this.machineList = res.data.list || [];
          this.totalCount = res.data.totalCount || 0;
        }
      },
      error: () => { this.isLoading = false; }
    });
  }

  protected onFilter(): void {
    this.currentPage = 1;
    if (this.viewMode === 'live') this.loadAllForLive();
    else this.loadList();
  }

  protected onSearch(event: KeyboardEvent): void {
    if (event.key === 'Enter') { this.currentPage = 1; this.loadList(); }
  }

  protected get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  protected prevPage(): void {
    if (this.currentPage > 1) { this.currentPage--; this.loadList(); }
  }

  protected nextPage(): void {
    if (this.currentPage < this.totalPages) { this.currentPage++; this.loadList(); }
  }

  // ── Live view ──────────────────────────────────────────────────────────────

  protected loadAllForLive(): void {
    this.isLoading = true;
    const payload: any = { page: 1, limit: 200 };
    if (this.filterWorkspace) payload.workspaceId = this.filterWorkspace;
    if (this.filterType)      payload.machineType = this.filterType;

    this._apiFs.manufacturerPortal.getMachineList(payload).subscribe({
      next: (res: IResponse) => {
        this.isLoading = false;
        if (res.code === 'OK') {
          this.machineList = res.data.list || [];
          this.totalCount  = res.data.totalCount || 0;
        }
      },
      error: () => { this.isLoading = false; }
    });
  }

  protected setViewMode(mode: 'table' | 'live'): void {
    if (this.viewMode === mode) return;
    this.viewMode = mode;

    if (mode === 'live') {
      this.currentPage = 1;
      this.loadAllForLive();
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
      this.loadList();
    }
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.refreshCountdown = this.REFRESH_INTERVAL_SEC;

    this.countdownSub = interval(1000).subscribe(() => {
      this.refreshCountdown--;
      if (this.refreshCountdown <= 0) this.refreshCountdown = this.REFRESH_INTERVAL_SEC;
    });

    this.refreshSub = interval(this.REFRESH_INTERVAL_SEC * 1000).subscribe(() => {
      this.loadAllForLive();
    });
  }

  private stopAutoRefresh(): void {
    this.refreshSub?.unsubscribe();
    this.countdownSub?.unsubscribe();
    this.refreshSub = undefined;
    this.countdownSub = undefined;
    this.refreshCountdown = this.REFRESH_INTERVAL_SEC;
  }

  protected get runningCount(): number {
    return this.machineList.filter(m => m.isRunning).length;
  }

  protected get stoppedCount(): number {
    return this.machineList.filter(m => !m.isRunning).length;
  }

  protected efficiencyClass(pct: number): string {
    if (pct >= 80) return 'eff-high';
    if (pct >= 50) return 'eff-mid';
    return 'eff-low';
  }
}
