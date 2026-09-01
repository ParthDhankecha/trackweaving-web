import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';
import { AlertFlags, AlertKey } from '@src/app/services/alert-config/alert-config';


type ConfigField = 'thresholds' | 'minutes';

type AlertItem = {
  key: AlertKey;
  label: string;
  configField?: ConfigField;
  configLabel?: string;
};


@Component({
  selector: 'app-client-alert-config',
  imports: [FormsModule],
  templateUrl: './alert-config.html',
  styleUrl: './alert-config.scss'
})
export class AlertConfig implements OnInit {

  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _coreService = inject(CoreFacadeService);

  protected readonly alertList: AlertItem[] = [
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

  protected workspaceName: string = '';
  protected workspaceAlerts!: Required<AlertFlags>;
  protected defaultAlerts!: Required<AlertFlags>;
  protected userConfigs: any[] = [];

  protected isLoading: boolean = false;
  protected isReqAlive: boolean = false;

  protected resetConfirmModal: { isOpen: boolean; data: any } = {
    isOpen: false,
    data: null
  };


  ngOnInit(): void {
    this.loadAlertConfig();
  }


  private mergeAlerts(source: Partial<AlertFlags> = {}): Required<AlertFlags> {
    const merged = { ...this.defaultAlerts };
    for (const item of this.alertList) {
      merged[item.key] = {
        ...this.defaultAlerts[item.key],
        ...(source[item.key] || {})
      };
    }
    return merged;
  }

  private loadAlertConfig(showLoader: boolean = true): void {
    if (showLoader) this.isLoading = true;

    this._apiFs.alertConfig.getDetails().subscribe({
      next: (res: IResponse) => {
        this.isLoading = false;
        if (res.code === 'OK') {
          this.defaultAlerts = res.data?.defaultAlerts;
          this.workspaceName = res.data?.workspaceName || '';
          this.workspaceAlerts = this.mergeAlerts(res.data?.workspaceAlerts);
          this.userConfigs = (res.data?.userConfigs || []).map((row: any) => ({
            ...row,
            alerts: this.mergeAlerts(row.alerts)
          }));
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.userConfigs = [];
        this._coreService.utils.showToaster(
          EToasterType.Danger,
          err?.error?.message || 'Failed to load alert configuration.'
        );
      }
    });
  }


  private clientEntry(entry: Record<string, any> = {}): Record<string, any> {
    const payload: Record<string, any> = { notification: !!entry['notification'] };
    if (typeof entry['thresholds'] === 'string') payload['thresholds'] = entry['thresholds'];
    if (typeof entry['minutes'] === 'string') payload['minutes'] = entry['minutes'];
    return payload;
  }

  private run(request: Observable<IResponse>, callbacks: { onError?: () => void, onSuccess?: () => void } = {}): void {
    this.isReqAlive = true;
    request.subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this.loadAlertConfig(false);
          callbacks?.onSuccess?.();
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        callbacks?.onError?.();
        this._coreService.utils.showToaster(
          EToasterType.Danger,
          err?.error?.message || 'Something went wrong, please try again later.'
        );
      }
    });
  }

  protected configValue(alerts: Required<AlertFlags> | null | undefined, field?: ConfigField): string {
    if (!alerts || !field) return '';
    switch (field) {
      case 'thresholds': return alerts?.beamLeft?.thresholds || '';
      case 'minutes': return alerts?.machineStopped?.minutes || '';
      default: return '';
    }
  }

  protected setConfigValue(alerts: any, parent: string, field: ConfigField, value: string): any {
    if (alerts?.[parent]?.hasOwnProperty(field)) {
      alerts[parent] = {
        ...alerts[parent],
        [field]: value
      };
      return alerts;
    }
    return { ...alerts };
  }

  protected onWorkspaceToggle(event: Event, key: AlertKey): void {
    if (this.isReqAlive) return;
    event?.preventDefault();

    const previous = !!this.workspaceAlerts[key]?.notification;
    this.workspaceAlerts = {
      ...this.workspaceAlerts,
      [key]: { ...this.workspaceAlerts[key], notification: !previous }
    };

    this.run(
      this._apiFs.alertConfig.saveWorkspace({
        [key]: this.clientEntry(this.workspaceAlerts[key])
      }), {
      onError: () => {
        this.workspaceAlerts = {
          ...this.workspaceAlerts,
          [key]: { ...this.workspaceAlerts[key], notification: previous }
        };
      },
      onSuccess: () => {
        this._coreService.utils.showToaster(EToasterType.Success, 'Workspace alert updated successfully.');
      }
    });
  }

  protected onWorkspaceConfigEnter(key: AlertKey): void {
    if (this.isReqAlive) return;
    this.run(this._apiFs.alertConfig.saveWorkspace({
      [key]: this.clientEntry(this.workspaceAlerts[key])
    }), {
      onSuccess: () => {
        this._coreService.utils.showToaster(EToasterType.Success, 'Custom workspace alert updated successfully.');
      }
    });
  }

  protected setWorkspaceConfig(parent: string, field: ConfigField, value: string): void {
    this.workspaceAlerts = this.setConfigValue(this.workspaceAlerts, parent, field, value);
  }


  protected onUserToggle(event: Event, row: any, key: AlertKey): void {
    if (this.isReqAlive || !row?.user?._id) return;
    event?.preventDefault();

    if (!this.workspaceAlerts[key]?.notification) {
      event?.stopPropagation();
      this._coreService.utils.showToaster(
        EToasterType.Warning,
        'Workspace alerts are disabled, please enable them to set user alerts.'
      );
      return;
    }

    const index = this.userConfigs.findIndex(u => u.user?._id === row.user._id);
    if (index === -1) return;

    const previous = !!this.userConfigs[index].alerts?.[key]?.notification;
    this.userConfigs[index] = {
      ...this.userConfigs[index],
      hasOverride: true,
      alerts: {
        ...this.userConfigs[index].alerts,
        [key]: { ...this.userConfigs[index].alerts[key], notification: !previous }
      }
    };
    this.run(
      this._apiFs.alertConfig.saveUser(row.user._id, {
        [key]: this.clientEntry(this.userConfigs[index].alerts[key])
      }), {
      onError: () => {
        this.userConfigs[index] = {
          ...this.userConfigs[index],
          alerts: {
            ...this.userConfigs[index].alerts,
            [key]: { ...this.userConfigs[index].alerts[key], notification: previous }
          }
        };
      },
      onSuccess: () => {
        this._coreService.utils.showToaster(EToasterType.Success, 'User alert updated successfully.');
      }
    });
  }

  protected onUserConfigEnter(row: any, key: AlertKey): void {
    if (this.isReqAlive || !row?.user?._id) return;
    const index = this.userConfigs.findIndex(u => u.user?._id === row.user._id);
    if (index === -1) return;

    this.run(this._apiFs.alertConfig.saveUser(row.user._id, {
      [key]: this.clientEntry(this.userConfigs[index].alerts[key])
    }), {
      onSuccess: () => {
        this._coreService.utils.showToaster(EToasterType.Success, 'Custom user alert updated successfully.');
      }
    });
  }

  protected setUserConfig(row: any, parent: string, field: ConfigField, value: string): void {
    const index = this.userConfigs.findIndex(u => u.user?._id === row?.user?._id);
    if (index === -1) return;

    this.userConfigs[index] = {
      ...this.userConfigs[index],
      hasOverride: true,
      alerts: this.setConfigValue(this.userConfigs[index].alerts, parent, field, value)
    };
  }


  protected onOpenResetConfirm(row: any): void {
    if (!row?.hasOverride) return;
    this.resetConfirmModal = { isOpen: true, data: row };
  }

  protected closeResetConfirm(): void {
    this.resetConfirmModal = { isOpen: false, data: null };
  }

  protected confirmResetOverride(): void {
    const userId = this.resetConfirmModal.data?.user?._id;
    if (this.isReqAlive || !userId) return;

    this.isReqAlive = true;
    this._apiFs.alertConfig.resetUser(userId).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this.closeResetConfirm();
          this.loadAlertConfig();
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        this._coreService.utils.showToaster(
          EToasterType.Danger,
          err?.error?.message || 'Failed to reset override.'
        );
      }
    });
  }
}