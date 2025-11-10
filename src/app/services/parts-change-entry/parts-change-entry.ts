import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpClient } from '../http-client/http-client';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { IResponse } from '@src/app/models/http-response.model';


@Injectable({
  providedIn: 'root'
})
export class PartsChangeEntry {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _baseUrl: string = 'part-change-logs';

  private readonly _coreService = inject(CoreFacadeService);
  protected readonly encodeKey = this._coreService.utils.encodeKey;


  partsList(): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}/parts-list`);
  }

  listPagination(payload: { page?: number, limit?: number, machineIds?: string[] }): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}/list`, payload);
  }

  create(payload: any): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}`, payload);
  }

  update(pceId: string, payload: any): Observable<IResponse> {
    return this._http.put(`${this._baseUrl}/${pceId}`, payload);
  }
}