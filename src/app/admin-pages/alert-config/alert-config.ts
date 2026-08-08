import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';
import {
  AlertChannelKey,
  AlertFlags,
  AlertKey
} from '@src/app/services/alert-config/alert-config';
import { ROUTES } from '@src/app/constants/app.routes';


type AlertItem = {
  key: AlertKey;
  label: string;
  configField?: 'thresholds' | 'minutes';
  configLabel?: string;
};

@Component({
  selector: 'app-alert-config',
  imports: [FormsModule],
  templateUrl: './alert-config.html',
  styleUrl: './alert-config.scss'
})
export class AlertConfigPage implements OnInit {

  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _coreService = inject(CoreFacadeService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);

  protected readonly channelKeys: { key: AlertChannelKey; label: string }[] = [
    { key: 'notification', label: 'App' },
    { key: 'whatsapp', label: 'WhatsApp' }
  ];

  protected readonly alertKeys: AlertItem[] = [
    { key: 'pickChange', label: 'Pick Change' },
    { key: 'maxSpeed', label: 'Max Speed' },
    { key: 'lowSpeed', label: 'Low Speed' },
    {
      key: 'beamLeft',
      label: 'Beam Left',
      configField: 'thresholds',
      configLabel: 'Beam thresholds (meters, comma separated)'
    },
    {
      key: 'machineStopped',
      label: 'Machine Stopped',
      configField: 'minutes',
      configLabel: 'Stop alert minutes (comma separated)'
    }
  ];

  protected workspaceId: string | null = null;
  protected workspaceName: string = '';

  protected workspaceAlerts!: Required<AlertFlags>;
  protected defaultAlerts!: Required<AlertFlags>;
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

  private mergeAlerts(source: Partial<AlertFlags> = {}): Required<AlertFlags> {
    const defaults = this.defaultAlerts;
    const merged = { ...defaults };

    for (const item of this.alertKeys) {
      merged[item.key] = {
        ...defaults[item.key],
        ...(source[item.key] || {})
      };
    }

    return merged;
  }

  protected getConfigPlaceholder(item: AlertItem): string {
    if (item.configField === 'thresholds') {
      return this.defaultAlerts?.beamLeft?.thresholds || '';
    }
    if (item.configField === 'minutes') {
      return this.defaultAlerts?.machineStopped?.minutes || '';
    }
    return '';
  }

  private loadAlertConfig(workspaceId: string, showLoader: boolean = true): void {
    if (showLoader) this.isLoading = true;
    this._apiFs.alertConfig.getByWorkspace(workspaceId).subscribe({
      next: (res: IResponse) => {
        this.isLoading = false;
        if (res.code === 'OK') {
          this.defaultAlerts = res.data?.defaultAlerts;
          this.workspaceName = res.data?.workspace?.firmName || '';
          this.workspaceAlerts = this.mergeAlerts(res.data?.workspaceConfig?.alerts);
          this.userConfigs = (res.data?.userConfigs || []).map((row: any) => ({
            ...row,
            alerts: this.mergeAlerts(row.alerts)
          }));
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

  protected onWorkspaceChannelToggle(event: Event, key: AlertKey, channel: AlertChannelKey): void {
    if (this.isReqAlive || !this.workspaceId) return;

    event?.stopPropagation();
    event?.preventDefault();

    const previousValue = !!this.workspaceAlerts[key]?.[channel];
    const nextValue = !previousValue;
    this.workspaceAlerts = {
      ...this.workspaceAlerts,
      [key]: {
        ...this.workspaceAlerts[key],
        [channel]: nextValue
      }
    };

    this.saveWorkspaceAlert(key, channel, nextValue, previousValue);
  }

  protected getWorkspaceConfigValue(key: AlertKey, field: 'thresholds' | 'minutes'): string {
    if (field === 'thresholds') {
      return this.workspaceAlerts.beamLeft?.thresholds || '';
    }
    return this.workspaceAlerts.machineStopped?.minutes || '';
  }

  protected setWorkspaceConfigValue(key: AlertKey, field: 'thresholds' | 'minutes', value: string): void {
    if (field === 'thresholds') {
      this.workspaceAlerts = {
        ...this.workspaceAlerts,
        beamLeft: {
          ...this.workspaceAlerts.beamLeft,
          thresholds: value
        }
      };
      return;
    }

    this.workspaceAlerts = {
      ...this.workspaceAlerts,
      machineStopped: {
        ...this.workspaceAlerts.machineStopped,
        minutes: value
      }
    };
  }

  protected onWorkspaceConfigEnter(key: AlertKey, field: 'thresholds' | 'minutes'): void {
    if (this.isReqAlive || !this.workspaceId) return;

    this.isReqAlive = true;
    this._apiFs.alertConfig.upsertWorkspace(this.workspaceId, {
      [key]: { ...this.workspaceAlerts[key] }
    }).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this.workspaceAlerts = this.mergeAlerts(res.data?.alerts);
          this.loadAlertConfig(this.workspaceId!, false);
          this._coreService.utils.showToaster(
            EToasterType.Success,
            `${this.alertLabel(key)} ${field} updated.`
          );
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        const msg = err?.error?.message || 'Something went wrong, please try again later.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }

  private saveWorkspaceAlert(
    key: AlertKey,
    channel: AlertChannelKey,
    nextValue: boolean,
    previousValue: boolean
  ): void {
    if (!this.workspaceId) return;

    this.isReqAlive = true;
    this._apiFs.alertConfig.upsertWorkspace(this.workspaceId, {
      [key]: { ...this.workspaceAlerts[key] }
    }).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this.workspaceAlerts = this.mergeAlerts(res.data?.alerts);
          this.loadAlertConfig(this.workspaceId!, false);
          this._coreService.utils.showToaster(
            EToasterType.Success,
            `Workspace ${this.alertLabel(key)} ${this.channelLabel(channel)} alert ${nextValue ? 'enabled' : 'disabled'}.`
          );
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        this.workspaceAlerts = {
          ...this.workspaceAlerts,
          [key]: {
            ...this.workspaceAlerts[key],
            [channel]: previousValue
          }
        };
        const msg = err?.error?.message || 'Something went wrong, please try again later.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }

  protected getUserConfigValue(row: any, key: AlertKey, field: 'thresholds' | 'minutes'): string {
    if (field === 'thresholds') {
      return row?.alerts?.beamLeft?.thresholds || '';
    }
    return row?.alerts?.machineStopped?.minutes || '';
  }

  protected setUserConfigValue(row: any, key: AlertKey, field: 'thresholds' | 'minutes', value: string): void {
    const index = this.userConfigs.findIndex(u => u.user?._id === row?.user?._id);
    if (index === -1) return;

    if (field === 'thresholds') {
      this.userConfigs[index] = {
        ...this.userConfigs[index],
        hasOverride: true,
        alerts: {
          ...this.userConfigs[index].alerts,
          beamLeft: {
            ...this.userConfigs[index].alerts.beamLeft,
            thresholds: value
          }
        }
      };
      return;
    }

    this.userConfigs[index] = {
      ...this.userConfigs[index],
      hasOverride: true,
      alerts: {
        ...this.userConfigs[index].alerts,
        machineStopped: {
          ...this.userConfigs[index].alerts.machineStopped,
          minutes: value
        }
      }
    };
  }

  protected onUserConfigEnter(row: any, key: AlertKey, field: 'thresholds' | 'minutes'): void {
    if (this.isReqAlive || !row?.user?._id) return;

    const index = this.userConfigs.findIndex(u => u.user?._id === row.user._id);
    if (index === -1) return;

    this.isReqAlive = true;
    this._apiFs.alertConfig.upsertUser(row.user._id, {
      [key]: { ...this.userConfigs[index].alerts[key] }
    }).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this.loadAlertConfig(this.workspaceId!, false);
          this._coreService.utils.showToaster(
            EToasterType.Success,
            `${this.alertLabel(key)} ${field} updated for ${row.user?.userName || row.user?.fullname}.`
          );
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        const msg = err?.error?.message || 'Something went wrong, please try again later.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }

  protected onUserChannelToggle(event: Event, row: any, key: AlertKey, channel: AlertChannelKey): void {
    if (this.isReqAlive || !row?.user?._id) return;

    event?.stopPropagation();
    event?.preventDefault();

    const index = this.userConfigs.findIndex(u => u.user?._id === row.user._id);
    if (index === -1) return;

    const previousValue = !!this.userConfigs[index].alerts?.[key]?.[channel];
    const nextValue = !previousValue;
    this.userConfigs[index] = {
      ...this.userConfigs[index],
      alerts: {
        ...this.userConfigs[index].alerts,
        [key]: {
          ...this.userConfigs[index].alerts[key],
          [channel]: nextValue
        }
      },
      hasOverride: true
    };

    this.isReqAlive = true;
    this._apiFs.alertConfig.upsertUser(row.user._id, {
      [key]: { ...this.userConfigs[index].alerts[key] }
    }).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this.loadAlertConfig(this.workspaceId!, false);
          this._coreService.utils.showToaster(
            EToasterType.Success,
            `${this.alertLabel(key)} ${this.channelLabel(channel)} alert ${nextValue ? 'enabled' : 'disabled'} for ${row.user?.userName || row.user?.fullname}.`
          );
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        this.userConfigs[index] = {
          ...this.userConfigs[index],
          alerts: {
            ...this.userConfigs[index].alerts,
            [key]: {
              ...this.userConfigs[index].alerts[key],
              [channel]: previousValue
            }
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

  protected channelLabel(channel: AlertChannelKey): string {
    return this.channelKeys.find(c => c.key === channel)?.label || channel;
  }
}