import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';
import { AlertConfigSchema } from '@src/app/services/alert-config/alert-config';


type AlertField = { key: string; title: string; placeholder: string };
type AlertItem = { key: string; title: string; fields: AlertField[]; colClass: string };


@Component({
  selector: 'app-client-alert-config',
  imports: [FormsModule],
  templateUrl: './alert-config.html',
  styleUrl: './alert-config.scss'
})
export class AlertConfig implements OnInit {

  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _coreService = inject(CoreFacadeService);

  protected alertItems: AlertItem[] = [];
  protected workspaceName: string | null = null;
  protected workspaceAlerts: Record<string, any> = {};
  protected userConfigs: any[] = [];
  protected isLoading: boolean = false;
  protected isReqAlive: boolean = false;
  protected resetConfirmModal: { isOpen: boolean; data: any } = {
    isOpen: false,
    data: null
  };


  ngOnInit(): void {
    this.load();
  }


  private toast(type: EToasterType, message: string): void {
    this._coreService.utils.showToaster(type, message);
  }


  private payload(key: string, entry: Record<string, any> = {}): Record<string, any> {
    const fields = this.alertItems.find(item => item.key === key)?.fields || [];
    const body: Record<string, any> = { notification: !!entry['notification'] };

    for (const field of fields) {
      if (typeof entry[field.key] === 'string') body[field.key] = entry[field.key];
    }
    return { [key]: body };
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
    if (showLoader) this.isLoading = true;

    this._apiFs.alertConfig.getDetails().subscribe({
      next: (res: IResponse) => {
        this.isLoading = false;
        if (res.code !== 'OK') return;

        const data = res.data;
        this.setSchema(data?.schema);
        this.workspaceName = data?.workspaceName || '';
        this.workspaceAlerts = data?.workspaceAlerts || {};
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


  protected onWorkspaceToggle(event: Event, key: string): void {
    if (this.isReqAlive) return;
    event.preventDefault();

    const previous = !!this.workspaceAlerts[key]?.notification;
    this.workspaceAlerts[key] = { ...this.workspaceAlerts[key], notification: !previous };
    this.save(
      this._apiFs.alertConfig.saveWorkspace(this.payload(key, this.workspaceAlerts[key])),
      'Workspace alert updated successfully.',
      () => { this.workspaceAlerts[key] = { ...this.workspaceAlerts[key], notification: previous }; }
    );
  }

  protected onWorkspaceSave(key: string): void {
    if (this.isReqAlive) return;
    this.save(
      this._apiFs.alertConfig.saveWorkspace(this.payload(key, this.workspaceAlerts[key])),
      'Custom workspace alert updated successfully.'
    );
  }


  protected onUserToggle(event: Event, row: any, key: string): void {
    if (this.isReqAlive || !row?.user?._id) return;
    event.preventDefault();

    if (!this.workspaceAlerts[key]?.notification) {
      event.stopPropagation();
      this.toast(EToasterType.Warning, 'Workspace alerts are disabled, please enable them to set user alerts.');
      return;
    }

    const previous = !!row.alerts?.[key]?.notification;
    row.hasOverride = true;
    row.alerts[key] = { ...row.alerts[key], notification: !previous };
    this.save(
      this._apiFs.alertConfig.saveUser(row.user._id, this.payload(key, row.alerts[key])),
      'User alert updated successfully.',
      () => { row.alerts[key] = { ...row.alerts[key], notification: previous }; }
    );
  }

  protected onUserSave(row: any, key: string): void {
    if (this.isReqAlive || !row?.user?._id) return;
    this.save(
      this._apiFs.alertConfig.saveUser(row.user._id, this.payload(key, row.alerts[key])),
      'Custom user alert updated successfully.'
    );
  }


  protected onOpenResetConfirm(row: any): void {
    if (row?.hasOverride) this.resetConfirmModal = { isOpen: true, data: row };
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
        if (res.code !== 'OK') return;
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