import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpClient } from '../http-client/http-client';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { IResponse } from '@src/app/models/http-response.model';


@Injectable({
  providedIn: 'root'
})
export class ApkVersion {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _coreService = inject(CoreFacadeService);
  protected readonly encodeKey = this._coreService.utils.encodeKey;

  /* Admin side APIs */
  private readonly _adminBaseUrl: string = 'admin/app-version';

  list(listType: 'android' | 'ios'): Observable<IResponse> {
    return this._http.post(`${this._adminBaseUrl}/list`, {
      type: listType
    });
  }

  create(payload: any): Observable<IResponse> {
    return this._http.post(`${this._adminBaseUrl}`, payload);
  }

  update(apkVersionId: string, payload: any): Observable<IResponse> {
    return this._http.put(`${this._adminBaseUrl}/${apkVersionId}`, payload);
  }

  delete(apkVersionId: string): Observable<IResponse> {
    return this._http.delete(`${this._adminBaseUrl}/${apkVersionId}`);
  }
}