import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';
import { AlertConfigSchema } from '@src/app/services/alert-config/alert-config';
import { ROUTES } from '@src/app/constants/app.routes';


type AlertField = { key: string; title: string; placeholder: string };
type AlertItem = { key: string; title: string; fields: AlertField[]; colClass: string };
type AlertChannel = { key: string; title: string };


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


  protected channelKeys: AlertChannel[] = [];
  protected alertItems: AlertItem[] = [];
  protected workspaceId: string | null = null;
  protected workspaceName: string = '';
  protected workspaceAlerts: Record<string, any> = {};
  protected userConfigs: any[] = [];
  protected isLoading: boolean = false;
  protected isReqAlive: boolean = false;
  protected missingWorkspaceId: boolean = false;
  protected resetConfirmModal: { isOpen: boolean; data: any } = { isOpen: false, data: null };


  ngOnInit(): void {
    this.workspaceId = this._route.snapshot.paramMap.get('workspaceId');
    if (!this.workspaceId) {
      this.missingWorkspaceId = true;
      return;
    }
    this.load();
  }

  protected goBackToWorkspaces(): void {
    this._router.navigate([ROUTES.ADMIN.getFullRoute(ROUTES.ADMIN.WORKSPACE)]);
  }


  private toast(type: EToasterType, message: string): void {
    this._coreService.utils.showToaster(type, message);
  }


  private payload(item: AlertItem, entry: Record<string, any> = {}): Record<string, any> {
    const body: Record<string, any> = {};

    for (const channel of this.channelKeys) {
      if (typeof entry[channel.key] === 'boolean') body[channel.key] = entry[channel.key];
    }
    for (const field of item.fields) {
      if (typeof entry[field.key] === 'string') body[field.key] = entry[field.key];
    }
    return { [item.key]: body };
  }

  private setChannels(channels: Record<string, { title: string }> = {}): void {
    this.channelKeys = Object.entries(channels).map(([key, item]) => ({
      key,
      title: item.title
    }));
  }

  private setSchema(schema: AlertConfigSchema = {}): void {
    this.alertItems = Object.entries(schema).map(([key, item]) => {
      const fields = Object.entries(item.fields || {}).map(([fieldKey, field]) => ({
        key: fieldKey,
        title: field.title,
        placeholder: field.placeholder || ''
      }));

      const count = fields.length;
      return {
        key,
        title: item.title,
        fields,
        colClass: count <= 1 ? 'col-12' : count === 2 ? 'col-12 col-md-6' : 'col-12 col-sm-6 col-xl-4'
      };
    });
  }

  private load(showLoader = true): void {
    if (!this.workspaceId) return;
    if (showLoader) this.isLoading = true;

    this._apiFs.alertConfig.getByWorkspace(this.workspaceId).subscribe({
      next: (res: IResponse) => {
        this.isLoading = false;
        if (res.code !== 'OK') return;

        const data = res.data;
        this.setSchema(data?.schema);
        this.setChannels(data?.channelKeys);
        this.workspaceName = data?.workspace?.firmName || '';
        this.workspaceAlerts = data?.workspaceConfig?.alerts || {};
        this.userConfigs = data?.userConfigs || [];
      },
      error: (err: any) => {
        this.isLoading = false;
        this.userConfigs = [];
        this.toast(EToasterType.Danger, err?.error?.message || 'Failed to load alert configuration.');
      }
    });
  }


  private save(request: Observable<IResponse>, success: string, onError?: () => void): void {
    this.isReqAlive = true;
    request.subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code !== 'OK') return;
        this.load(false);
        this.toast(EToasterType.Success, success);
      },
      error: (err: any) => {
        this.isReqAlive = false;
        onError?.();
        this.toast(EToasterType.Danger, err?.error?.message || 'Something went wrong, please try again later.');
      }
    });
  }


  protected onWorkspaceChannelToggle(event: Event, item: AlertItem, channel: AlertChannel): void {
    if (this.isReqAlive || !this.workspaceId) return;
    event.preventDefault();

    const key = item.key;
    const previous = !!this.workspaceAlerts[key]?.[channel.key];
    this.workspaceAlerts[key] = { ...this.workspaceAlerts[key], [channel.key]: !previous };
    this.save(
      this._apiFs.alertConfig.upsertWorkspace(this.workspaceId, this.payload(item, this.workspaceAlerts[key])),
      `Workspace ${item.title} ${channel.title} alert ${!previous ? 'enabled' : 'disabled'}.`,
      () => { this.workspaceAlerts[key] = { ...this.workspaceAlerts[key], [channel.key]: previous }; }
    );
  }

  protected onWorkspaceSave(item: AlertItem): void {
    if (this.isReqAlive || !this.workspaceId) return;
    this.save(
      this._apiFs.alertConfig.upsertWorkspace(this.workspaceId, this.payload(item, this.workspaceAlerts[item.key])),
      `Custom workspace ${item.title} alert updated.`
    );
  }


  protected onUserChannelToggle(event: Event, row: any, item: AlertItem, channel: AlertChannel): void {
    if (this.isReqAlive || !row?.user?._id) return;
    event.preventDefault();

    const key = item.key;
    if (!this.workspaceAlerts[key]?.[channel.key]) {
      event.stopPropagation();
      this.toast(EToasterType.Warning, 'Workspace alert is disabled, please enable it to set user alert.');
      return;
    }

    const previous = !!row.alerts?.[key]?.[channel.key];
    row.hasOverride = true;
    row.alerts[key] = { ...row.alerts[key], [channel.key]: !previous };
    this.save(
      this._apiFs.alertConfig.upsertUser(row.user._id, this.payload(item, row.alerts[key])),
      `${item.title} ${channel.title} alert ${!previous ? 'enabled' : 'disabled'} for ${row.user?.userName || row.user?.fullname}.`,
      () => { row.alerts[key] = { ...row.alerts[key], [channel.key]: previous }; }
    );
  }

  protected onUserSave(row: any, item: AlertItem): void {
    if (this.isReqAlive || !row?.user?._id) return;
    this.save(
      this._apiFs.alertConfig.upsertUser(row.user._id, this.payload(item, row.alerts[item.key])),
      `Custom ${item.title} alert updated for ${row.user?.userName || row.user?.fullname}.`
    );
  }


  protected onOpenResetConfirm(row: any): void {
    if (row?.hasOverride) this.resetConfirmModal = { isOpen: true, data: row };
  }

  protected closeResetConfirm(): void {
    this.resetConfirmModal = { isOpen: false, data: null };
  }

  protected confirmResetOverride(): void {
    const row = this.resetConfirmModal.data;
    const userId = row?.user?._id;
    if (this.isReqAlive || !userId) return;

    this.isReqAlive = true;
    this._apiFs.alertConfig.resetUserOverride(userId).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code !== 'OK') return;
        this.toast(EToasterType.Success, `Alert override reset for ${row.user?.userName || row.user?.fullname}.`);
        this.closeResetConfirm();
        this.load();
      },
      error: (err: any) => {
        this.isReqAlive = false;
        this.toast(EToasterType.Danger, err?.error?.message || 'Failed to reset override.');
      }
    });
  }
}