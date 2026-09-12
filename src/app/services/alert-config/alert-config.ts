import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpClient } from '../http-client/http-client';
import { IResponse } from '@src/app/models/http-response.model';


export type AlertChannelFlags = {
  notification?: boolean;
  whatsapp?: boolean;
};

export type AlertConfigFieldSchema = {
  title: string;
  placeholder?: string;
  required?: boolean;
};

export type AlertSchemaEntry = {
  title: string;
  fields?: Record<string, AlertConfigFieldSchema>;
};

export type AlertConfigSchema = Record<string, AlertSchemaEntry>;

export type AlertFlags = {
  pickChange?: AlertChannelFlags;
  maxSpeed?: AlertChannelFlags;
  lowSpeed?: AlertChannelFlags;
  beamLeft?: AlertChannelFlags & { thresholds?: string };
  machineStopped?: AlertChannelFlags & {
    minutes?: string;
    warpMinutes?: string;
    weftMinutes?: string;
    feederMinutes?: string;
    otherMinutes?: string;
  };
};

export type AlertChannelKey = keyof AlertChannelFlags;
export type AlertKey = keyof Required<AlertFlags>;

export type MachineAttentionCriterion = {
  enabled?: boolean;
  minutes?: number;
  below?: number;
  count?: number;
  windowMinutes?: number;
  belowExpectedPercent?: number;
  durationMinutes?: number;
  differencePercent?: number;
  [key: string]: boolean | number | undefined;
};

export type MachineAttentionGroupConfig = Record<string, MachineAttentionCriterion>;

export type MachineAttentionGroupKey = 'fixnow' | 'needsattention' | 'watch';

export type MachineAttentionConfig = {
  enabled?: boolean;
  fixnow?: MachineAttentionGroupConfig;
  needsattention?: MachineAttentionGroupConfig;
  watch?: MachineAttentionGroupConfig;
};

export type MachineAttentionSchemaEntry = {
  title: string;
  criteria: Record<string, {
    title: string;
    description: string;
    unit?: string;
    unit2?: string;
    fields: string[];
  }>;
};

export type MachineAttentionSchema = Record<string, MachineAttentionSchemaEntry>;

@Injectable({
  providedIn: 'root'
})
export class AlertConfig {

  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _adminBaseUrl: string = 'admin/alert-config';
  private readonly _baseUrl: string = 'alert-config';


  getByWorkspace(workspaceId: string): Observable<IResponse> {
    return this._http.get(`${this._adminBaseUrl}/workspace/${workspaceId}`);
  }

  upsertWorkspace(workspaceId: string, alerts: Partial<AlertFlags>): Observable<IResponse> {
    return this._http.put(`${this._adminBaseUrl}/workspace/${workspaceId}`, { alerts });
  }

  upsertUser(userId: string, alerts: Partial<AlertFlags>): Observable<IResponse> {
    return this._http.put(`${this._adminBaseUrl}/user/${userId}`, { alerts });
  }

  resetUserOverride(userId: string): Observable<IResponse> {
    return this._http.delete(`${this._adminBaseUrl}/user/${userId}`);
  }


  /*  client APIs  */
  getDetails(): Observable<IResponse> {
    return this._http.get(this._baseUrl);
  }

  saveWorkspace(
    alerts: Partial<AlertFlags> = {},
    machineAttention?: MachineAttentionConfig,
    options?: { restoreMachineAttentionDefaults?: boolean }
  ): Observable<IResponse> {
    const body: Record<string, unknown> = {};
    if (Object.keys(alerts).length) body['alerts'] = alerts;
    if (machineAttention) body['machineAttention'] = machineAttention;
    if (options?.restoreMachineAttentionDefaults) {
      body['restoreMachineAttentionDefaults'] = true;
    }
    return this._http.put(this._baseUrl, body);
  }

  saveUser(userId: string, alerts: Partial<AlertFlags>): Observable<IResponse> {
    return this._http.put(`${this._baseUrl}/user/${userId}`, { alerts });
  }

  resetUser(userId: string): Observable<IResponse> {
    return this._http.delete(`${this._baseUrl}/user/${userId}`);
  }
}