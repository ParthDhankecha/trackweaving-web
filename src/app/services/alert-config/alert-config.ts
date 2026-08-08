import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpClient } from '../http-client/http-client';
import { IResponse } from '@src/app/models/http-response.model';


export type AlertChannelFlags = {
  notification?: boolean;
  whatsapp?: boolean;
};

export type AlertFlags = {
  pickChange?: AlertChannelFlags;
  maxSpeed?: AlertChannelFlags;
  lowSpeed?: AlertChannelFlags;
  beamLeft?: AlertChannelFlags & { thresholds?: string };
  machineStopped?: AlertChannelFlags & { minutes?: string };
};

export type AlertChannelKey = keyof AlertChannelFlags;
export type AlertKey = keyof Required<AlertFlags>;

@Injectable({
  providedIn: 'root'
})
export class AlertConfig {

  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _baseUrl: string = 'admin/alert-config';


  getByWorkspace(workspaceId: string): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}/workspace/${workspaceId}`);
  }

  upsertWorkspace(workspaceId: string, alerts: Partial<AlertFlags>): Observable<IResponse> {
    return this._http.put(`${this._baseUrl}/workspace/${workspaceId}`, { alerts });
  }

  upsertUser(userId: string, alerts: Partial<AlertFlags>): Observable<IResponse> {
    return this._http.put(`${this._baseUrl}/user/${userId}`, { alerts });
  }

  resetUserOverride(userId: string): Observable<IResponse> {
    return this._http.delete(`${this._baseUrl}/user/${userId}`);
  }
}