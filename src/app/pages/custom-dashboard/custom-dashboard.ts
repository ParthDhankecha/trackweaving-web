import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription, interval } from 'rxjs';

import { TrackWeavingLogo } from '@src/app/shared/components/track-weaving-logo/track-weaving-logo';
import { SectionSelector } from './components/section-selector/section-selector';
import { LineEfficiencyBar } from './components/line-efficiency-bar/line-efficiency-bar';
import { StoppedMachineCard } from './components/stopped-machine-card/stopped-machine-card';

import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { CustomDashboardResponse, EfficiencyLine, SectionKey, StoppedMachine, parseStopTimeToSeconds } from '@src/app/models/custom-dashboard.model';
import { StoppedMachineRotator } from './stopped-machine-rotator';
import StorageKeys from '@src/app/constants/storage-keys';

/** How often the live dashboard snapshot is re-fetched from the server. */
const API_REFRESH_INTERVAL_MS = 10_000;
/** How often the stopped-machine carousel advances to its next pair. */
const ROTATION_INTERVAL_MS = 4_000;
/** Stopped machines shown per carousel page. */
const STOPPED_MACHINES_PER_PAGE = 2;

@Component({
  selector: 'app-custom-dashboard',
  imports: [TrackWeavingLogo, SectionSelector, LineEfficiencyBar, StoppedMachineCard],
  templateUrl: './custom-dashboard.html',
  styleUrl: './custom-dashboard.scss'
})
export class CustomDashboard implements OnInit, OnDestroy {

  private readonly _apiFs = inject(ApiFacadeService);

  private readonly _rotator = new StoppedMachineRotator<StoppedMachine>(STOPPED_MACHINES_PER_PAGE);
  private _apiSub?: Subscription;
  private _refreshSub?: Subscription;
  private _rotationSub?: Subscription;

  protected selectedSection: SectionKey | null = null;
  protected showSectionSelector: boolean = false;
  protected isChangeSectionOverlay: boolean = false;

  protected loading: boolean = false;
  protected connectionInterrupted: boolean = false;
  protected isFullscreen: boolean = false;
  protected data: CustomDashboardResponse | null = null;
  protected currentStoppedPair: StoppedMachine[] = [];

  ngOnInit(): void {
    this.isFullscreen = !!document.fullscreenElement;
    const storedSection = this.readStoredSection();
    if (storedSection) {
      this.selectedSection = storedSection;
      this.startLiveDashboard();
    } else {
      this.showSectionSelector = true;
    }
  }

  ngOnDestroy(): void {
    this._apiSub?.unsubscribe();
    this._refreshSub?.unsubscribe();
    this._rotationSub?.unsubscribe();
  }

  // ===== Section selection =====

  protected onInitialSectionSelected(section: SectionKey): void {
    this.selectedSection = section;
    this.persistSection(section);
    this.showSectionSelector = false;
    this.startLiveDashboard();
  }

  protected openChangeSectionOverlay(): void {
    this.isChangeSectionOverlay = true;
  }

  protected closeChangeSectionOverlay(): void {
    this.isChangeSectionOverlay = false;
  }

  @HostListener('document:fullscreenchange')
  protected onFullscreenChange(): void {
    this.isFullscreen = !!document.fullscreenElement;
  }

  protected toggleFullscreen(): void {
    if (this.isFullscreen) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }

  private enterFullscreen(): void {
    const elem = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    }
  }

  private exitFullscreen(): void {
    const doc = document as Document & { webkitExitFullscreen?: () => void };
    if (doc.exitFullscreen) {
      doc.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
    }
  }

  protected onSectionChanged(section: SectionKey): void {
    this.isChangeSectionOverlay = false;
    if (section === this.selectedSection) return;

    this.selectedSection = section;
    this.persistSection(section);
    this.data = null;
    this.loading = true;
    this.connectionInterrupted = false;
    this._rotator.reset();
    this.currentStoppedPair = [];

    // Restart the refresh cycle so it doesn't fire again right on top of this manual fetch.
    this._refreshSub?.unsubscribe();
    this.fetchDashboardData();
    this._refreshSub = interval(API_REFRESH_INTERVAL_MS).subscribe(() => this.fetchDashboardData());
  }

  private readStoredSection(): SectionKey | null {
    try {
      const stored = localStorage.getItem(StorageKeys.CUSTOM_DASHBOARD_SECTION);
      return stored === 'A' || stored === 'B' ? stored : null;
    } catch {
      return null;
    }
  }

  private persistSection(section: SectionKey): void {
    try {
      localStorage.setItem(StorageKeys.CUSTOM_DASHBOARD_SECTION, section);
    } catch { /* ignore */ }
  }

  // ===== Live data =====

  private startLiveDashboard(): void {
    this.loading = true;
    this.fetchDashboardData();

    this._refreshSub = interval(API_REFRESH_INTERVAL_MS).subscribe(() => this.fetchDashboardData());
    this._rotationSub = interval(ROTATION_INTERVAL_MS).subscribe(() => this.advanceRotation());
  }

  private fetchDashboardData(): void {
    if (!this.selectedSection) return;

    this._apiSub?.unsubscribe();
    this._apiSub = this._apiFs.dashboard.getCustom({ section: this.selectedSection }).subscribe({
      next: (res: IResponse) => {
        if (res.code !== 'OK') return;

        this.data = res.data;
        this.data!.stoppedMachineList = [
          { "machineCode": "M1", "lineKey": "Line 1", "stopTime": "00:00:42", "efficiency": 78, "stopReason": "feeler" },
          { "machineCode": "M2", "lineKey": "Line 1", "stopTime": "00:01:18", "efficiency": 81, "stopReason": "warp" },
          { "machineCode": "M3", "lineKey": "Line 2", "stopTime": "00:00:19", "efficiency": 69, "stopReason": "packageSensor" },
          { "machineCode": "M4", "lineKey": "Line 2", "stopTime": "00:02:05", "efficiency": 74, "stopReason": "leno" },
          { "machineCode": "M5", "lineKey": "Line 3", "stopTime": "00:01:01", "efficiency": 86, "stopReason": "warp" },
          { "machineCode": "M6", "lineKey": "Line 3", "stopTime": "00:00:08", "efficiency": 91, "stopReason": "feeler" },
          { "machineCode": "M7", "lineKey": "Line 4", "stopTime": "00:02:21", "efficiency": 62, "stopReason": "leno" },
          { "machineCode": "M8", "lineKey": "Line 4", "stopTime": "00:00:55", "efficiency": 83, "stopReason": "packageSensor" },
          { "machineCode": "M9", "lineKey": "Line 5", "stopTime": "00:01:44", "efficiency": 71, "stopReason": "warp" },
          { "machineCode": "M10", "lineKey": "Line 5", "stopTime": "01:02:05", "efficiency": 88, "stopReason": "feeler" }
        ];
        this.connectionInterrupted = false;
        this.loading = false;
        // this.applyStoppedMachines(res.data?.stoppedMachineList || []);
        this.applyStoppedMachines([
          { "machineCode": "M1", "lineKey": "Line 1", "stopTime": "00:00:42", "efficiency": 78, "stopReason": "feeler" },
          { "machineCode": "M2", "lineKey": "Line 1", "stopTime": "00:01:18", "efficiency": 81, "stopReason": "warp" },
          { "machineCode": "M3", "lineKey": "Line 2", "stopTime": "00:00:19", "efficiency": 69, "stopReason": "packageSensor" },
          { "machineCode": "M4", "lineKey": "Line 2", "stopTime": "00:02:05", "efficiency": 74, "stopReason": "leno" },
          { "machineCode": "M5", "lineKey": "Line 3", "stopTime": "00:01:01", "efficiency": 86, "stopReason": "warp" },
          { "machineCode": "M6", "lineKey": "Line 3", "stopTime": "00:00:08", "efficiency": 91, "stopReason": "feeler" },
          { "machineCode": "M7", "lineKey": "Line 4", "stopTime": "00:02:21", "efficiency": 62, "stopReason": "leno" },
          { "machineCode": "M8", "lineKey": "Line 4", "stopTime": "00:00:55", "efficiency": 83, "stopReason": "packageSensor" },
          { "machineCode": "M9", "lineKey": "Line 5", "stopTime": "00:01:44", "efficiency": 71, "stopReason": "warp" },
          { "machineCode": "M10", "lineKey": "Line 5", "stopTime": "01:02:05", "efficiency": 88, "stopReason": "feeler" }
        ]
    );
      },
      error: () => {
        // Keep showing the last known-good data; just flag the connection as unstable.
        this.connectionInterrupted = true;
        this.loading = false;
      }
    });
  }

  private applyStoppedMachines(list: StoppedMachine[]): void {
    const sorted = [...list].sort((a, b) => this.stopSeconds(b) - this.stopSeconds(a));
    this._rotator.setItems(sorted);
    this.currentStoppedPair = this._rotator.currentPage;
  }

  private stopSeconds(machine: StoppedMachine): number {
    return typeof machine.stopSeconds === 'number' ? machine.stopSeconds : parseStopTimeToSeconds(machine.stopTime);
  }

  private advanceRotation(): void {
    if (!this._rotator.pageCount) {
      this.currentStoppedPair = [];
      return;
    }
    this.currentStoppedPair = this._rotator.next();
  }

  // ===== Template helpers =====

  protected isTopLine(line: EfficiencyLine): boolean {
    if (!this.data?.efficiencyChartList.length) return false;
    const max = Math.max(...this.data.efficiencyChartList.map(l => l.efficiency));
    return line.efficiency === max;
  }
}
