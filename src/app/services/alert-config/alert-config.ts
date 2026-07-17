import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpClient } from '../http-client/http-client';
import { IResponse } from '@src/app/models/http-response.model';


export type AlertFlags = {
  pickChange?: boolean;
  maxSpeed?: boolean;
  lowSpeed?: boolean;
  beamLeft?: boolean;
};

@Injectable({
  providedIn: 'root'
})
export class AlertConfig {

  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _baseUrl: string = 'admin/alert-config';


  getByWorkspace(workspaceId: string): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}/workspace/${workspaceId}`);
  }

  upsertWorkspace(workspaceId: string, alerts: AlertFlags): Observable<IResponse> {
    return this._http.put(`${this._baseUrl}/workspace/${workspaceId}`, { alerts });
  }

  upsertUser(userId: string, alerts: AlertFlags): Observable<IResponse> {
    return this._http.put(`${this._baseUrl}/user/${userId}`, { alerts });
  }

  resetUserOverride(userId: string): Observable<IResponse> {
    return this._http.delete(`${this._baseUrl}/user/${userId}`);
  }
}