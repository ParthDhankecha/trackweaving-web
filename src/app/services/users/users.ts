import { inject, Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

import { HttpClient } from '../http-client/http-client';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { IResponse } from '@src/app/models/http-response.model';


@Injectable({
  providedIn: 'root'
})
export class Users {

  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _adminBaseUrl: string = 'admin/user';
  private readonly _baseUrl: string = 'user';

  private readonly _coreService = inject(CoreFacadeService);
  protected readonly encodeKey = this._coreService.utils.encodeKey;
  /** Cached once for the app lifetime — access matrix options. */
  private _accessMatrix$?: Observable<IResponse>;


  // Admin APIs
  adminListWithPagination(payload: { page?: number, limit?: number }): Observable<IResponse> {
    return this._http.post(`${this._adminBaseUrl}/pagination`, payload);
  }

  adminCreate(payload: any): Observable<IResponse> {
    const body = {
      data: this._coreService.utils.encodeData(payload, this.encodeKey),
      date: this.encodeKey
    };
    return this._http.post(`${this._adminBaseUrl}/create`, body);
  }

  adminUpdate(id: string, payload: any): Observable<IResponse> {
    return this._http.put(`${this._adminBaseUrl}/update/${id}`, payload);
  }

  adminDelete(id: string): Observable<IResponse> {
    return this._http.delete(`${this._adminBaseUrl}/delete/${id}`);
  }


  // User APIs
  list(): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}`);
  }

  create(payload: any): Observable<IResponse> {
    const body = {
      data: this._coreService.utils.encodeData(payload, this.encodeKey),
      date: this.encodeKey
    };
    return this._http.post(`${this._baseUrl}`, body);
  }

  update(id: string, payload: any): Observable<IResponse> {
    const body = {
      data: this._coreService.utils.encodeData(payload, this.encodeKey),
      date: this.encodeKey
    };
    return this._http.put(`${this._baseUrl}/${id}`, body);
  }

  getAccessMatrix(): Observable<IResponse> {
    if (!this._accessMatrix$) {
      this._accessMatrix$ = this._http.get<IResponse>(`${this._baseUrl}/access-matrix`).pipe(
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this._accessMatrix$;
  }
  clearAccessMatrixCache(): void {
    this._accessMatrix$ = undefined;
  }
}