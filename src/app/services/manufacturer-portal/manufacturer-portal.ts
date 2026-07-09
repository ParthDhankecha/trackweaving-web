import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

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
        if (res?.data?.token?.accessToken) {
          localStorage.setItem(StorageKeys.MANUFACTURER_TOKEN, res.data.token.accessToken);
          localStorage.setItem(StorageKeys.MANUFACTURER_INFO, JSON.stringify(res.data.manufacturer));
        }
      })
    );
  }

  getProfile(): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}/auth/profile`);
  }

  getOverview(): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}/dashboard/overview`);
  }

  getMachineList(payload: {
    workspaceId?: string;
    machineType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}/dashboard/machine-list`, payload);
  }

  getAnalytics(payload: { workspaceId?: string; machineType?: string }): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}/dashboard/analytics`, payload);
  }

  getWorkspaceOptions(): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}/dashboard/workspace-options`);
  }

  logout(): void {
    localStorage.removeItem(StorageKeys.MANUFACTURER_TOKEN);
    localStorage.removeItem(StorageKeys.MANUFACTURER_INFO);
  }
}
