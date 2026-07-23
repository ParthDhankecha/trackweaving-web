import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

import moment from 'moment';

import { HttpClient } from '../http-client/http-client';
import { IResponse } from '@src/app/models/http-response.model';
import StorageKeys from '@src/app/constants/storage-keys';


@Injectable({
  providedIn: 'root'
})
export class ManufacturerPortal {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _baseUrl: string = 'manufacturer';


  signIn(payload: { email: string; password: string }): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}/auth/sign-in`, payload).pipe(
      tap((res: any) => {
        this.setSession(res);
      })
    );
  }

  protected setSession(resObj: any): void {
    if (!['OK', 'CREATED'].includes(resObj?.code)) return;

    localStorage.setItem(StorageKeys.MANUFACTURER_TOKEN, resObj.data.token.accessToken);

    const expiresIn = resObj.data.token.expiresIn * 1000;
    const expiresAt = moment().valueOf() + expiresIn;
    localStorage.setItem(StorageKeys.MANUFACTURER_TOKEN_EXPIRES_AT, `${expiresAt}`);

    if (resObj.data.mfrUser) {
      localStorage.setItem(StorageKeys.MFR_USER_INFO, JSON.stringify(resObj.data.mfrUser));
    }
  }

  getProfile(): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}/auth/profile`);
  }

  getOverview(): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}/dashboard/overview`);
  }

  getAnalytics(payload: { workspaceId?: string; machineType?: string }): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}/dashboard/analytics`, payload);
  }

  getWorkspaceOptions(): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}/dashboard/workspace-options`);
  }

  getMachineGroupOptions(workspaceId: string): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}/dashboard/machine-group-options/${workspaceId}`);
  }

  getMachineLogList(payload: {
    workspaceId: string;
    status?: number;
    machineType?: string;
    page?: number;
    limit?: number;
  }): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}/dashboard/machine-log-list`, payload);
  }

  getReportMachines(workspaceId: string): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}/dashboard/machines/${workspaceId}`);
  }

  getReportQualities(workspaceId: string): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}/dashboard/qualities/${workspaceId}`);
  }

  generateReport(payload: Record<string, unknown>): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}/dashboard/report`, payload);
  }


  logout(): void {
    localStorage.removeItem(StorageKeys.MANUFACTURER_TOKEN);
    localStorage.removeItem(StorageKeys.MANUFACTURER_TOKEN_EXPIRES_AT);
    localStorage.removeItem(StorageKeys.MFR_USER_INFO);
  }
}
