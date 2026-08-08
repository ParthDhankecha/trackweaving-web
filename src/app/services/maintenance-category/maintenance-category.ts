import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpClient } from '../http-client/http-client';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { IResponse } from '@src/app/models/http-response.model';


@Injectable({
  providedIn: 'root'
})
export class MaintenanceCategory {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _baseUrl: string = 'maintenance-categories';

  private readonly _coreService = inject(CoreFacadeService);
  protected readonly encodeKey = this._coreService.utils.encodeKey;


  list(): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}`);
  }

  create(payload: any): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}`, payload);
  }

  update(mcId: string, payload: any): Observable<IResponse> {
    return this._http.put(`${this._baseUrl}/${mcId}`, payload);
  }

  delete(mcId: string): Observable<IResponse> {
    return this._http.delete(`${this._baseUrl}/${mcId}`);
  }
}