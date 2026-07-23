import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';
import { AlertFlags } from '@src/app/services/alert-config/alert-config';
import { ROUTES } from '@src/app/constants/app.routes';


type AlertKey = keyof Required<AlertFlags>;

@Component({
  selector: 'app-alert-config',
  imports: [],
  templateUrl: './alert-config.html',
  styleUrl: './alert-config.scss'
})
export class AlertConfigPage implements OnInit {

  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _coreService = inject(CoreFacadeService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);

  protected readonly alertKeys: { key: AlertKey; label: string }[] = [
    { key: 'pickChange', label: 'Pick Change' },
    { key: 'maxSpeed', label: 'Max Speed' },
    { key: 'lowSpeed', label: 'Low Speed' },
    { key: 'beamLeft', label: 'Beam Left' }
  ];

  protected workspaceId: string | null = null;
  protected workspaceName: string = '';

  protected workspaceAlerts: Required<AlertFlags> = {
    pickChange: true,
    maxSpeed: true,
    lowSpeed: true,
    beamLeft: true
  };
  protected userConfigs: any[] = [];

  protected isLoading: boolean = false;
  protected isReqAlive: boolean = false;
  protected missingWorkspaceId: boolean = false;

  protected resetConfirmModal: { isOpen: boolean; data: any } = {
    isOpen: false,
    data: null
  };


  ngOnInit(): void {
    this.workspaceId = this._route.snapshot.paramMap.get('workspaceId');
    if (!this.workspaceId) {
      this.missingWorkspaceId = true;
      return;
    }
    this.loadAlertConfig(this.workspaceId);
  }

  protected goBackToWorkspaces(): void {
    this._router.navigate([ROUTES.ADMIN.getFullRoute(ROUTES.ADMIN.WORKSPACE)]);
  }

  private loadAlertConfig(workspaceId: string, showLoader: boolean = true): void {
    if (showLoader) this.isLoading = true;
    this._apiFs.alertConfig.getByWorkspace(workspaceId).subscribe({
      next: (res: IResponse) => {
        this.isLoading = false;
        if (res.code === 'OK') {
          this.workspaceName = res.data?.workspace?.firmName || '';
          this.workspaceAlerts = {
            pickChange: true,
            maxSpeed: true,
            lowSpeed: true,
            beamLeft: true,
            ...(res.data?.workspaceConfig?.alerts || {})
          };
          this.userConfigs = res.data?.userConfigs || [];
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.userConfigs = [];
        const msg = err?.error?.message || 'Failed to load alert configuration.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }

  protected onWorkspaceAlertToggle(event: Event, key: AlertKey): void {
    if (this.isReqAlive || !this.workspaceId) return;

    event?.stopPropagation();
    event?.preventDefault();

    const previousValue = !!this.workspaceAlerts[key];
    const nextValue = !previousValue;
    this.workspaceAlerts = { ...this.workspaceAlerts, [key]: nextValue };

    this.isReqAlive = true;
    this._apiFs.alertConfig.upsertWorkspace(this.workspaceId, { [key]: nextValue }).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this.workspaceAlerts = {
            ...this.workspaceAlerts,
            ...(res.data?.alerts || {})
          };
          this.loadAlertConfig(this.workspaceId!, false);
          this._coreService.utils.showToaster(
            EToasterType.Success,
            `Workspace ${this.alertLabel(key)} alert ${nextValue ? 'enabled' : 'disabled'}.`
          );
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        this.workspaceAlerts = { ...this.workspaceAlerts, [key]: previousValue };
        const msg = err?.error?.message || 'Something went wrong, please try again later.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }

  protected onUserAlertToggle(event: Event, row: any, key: AlertKey): void {
    if (this.isReqAlive || !row?.user?._id) return;

    event?.stopPropagation();
    event?.preventDefault();

    const index = this.userConfigs.findIndex(u => u.user?._id === row.user._id);
    if (index === -1) return;

    const previousValue = !!this.userConfigs[index].alerts?.[key];
    const nextValue = !previousValue;
    this.userConfigs[index] = {
      ...this.userConfigs[index],
      alerts: {
        ...this.userConfigs[index].alerts,
        [key]: nextValue
      },
      hasOverride: true
    };

    this.isReqAlive = true;
    this._apiFs.alertConfig.upsertUser(row.user._id, { [key]: nextValue }).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this.userConfigs[index] = {
            ...this.userConfigs[index],
            hasOverride: true,
            alerts: {
              ...this.userConfigs[index].alerts,
              ...(res.data?.alerts || {})
            },
            overrideAlerts: res.data?.alerts || this.userConfigs[index].alerts,
            configId: res.data?._id || this.userConfigs[index].configId
          };
          this._coreService.utils.showToaster(
            EToasterType.Success,
            `${this.alertLabel(key)} alert ${nextValue ? 'enabled' : 'disabled'} for ${row.user?.userName || row.user?.fullname}.`
          );
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        this.userConfigs[index] = {
          ...this.userConfigs[index],
          alerts: {
            ...this.userConfigs[index].alerts,
            [key]: previousValue
          }
        };
        const msg = err?.error?.message || 'Something went wrong, please try again later.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }

  protected onOpenResetConfirm(row: any): void {
    if (!row?.hasOverride) return;
    this.resetConfirmModal = { isOpen: true, data: row };
  }

  protected closeResetConfirm(): void {
    this.resetConfirmModal = { isOpen: false, data: null };
  }

  protected confirmResetOverride(): void {
    if (this.isReqAlive) return;
    const row = this.resetConfirmModal.data;
    const userId = row?.user?._id;
    if (!userId) return;

    this.isReqAlive = true;
    this._apiFs.alertConfig.resetUserOverride(userId).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this._coreService.utils.showToaster(
            EToasterType.Success,
            `Alert override reset for ${row.user?.userName || row.user?.fullname}.`
          );
          this.closeResetConfirm();
          if (this.workspaceId) {
            this.loadAlertConfig(this.workspaceId);
          }
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        const msg = err?.error?.message || 'Failed to reset override.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }

  protected alertLabel(key: AlertKey): string {
    return this.alertKeys.find(a => a.key === key)?.label || key;
  }
}
