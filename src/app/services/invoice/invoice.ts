import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpClient } from '../http-client/http-client';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { IResponse } from '@src/app/models/http-response.model';


@Injectable({
  providedIn: 'root'
})
export class Invoice {

  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _baseUrl: string = 'admin/invoice';

  private readonly _coreService = inject(CoreFacadeService);
  protected readonly encodeKey = this._coreService.utils.encodeKey;


  getOptions(): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}/options`);
  }

  getById(id: string): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}/${id}`);
  }

  getConfiguration(): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}/configuration`);
  }

  list(payload: { page?: number; limit?: number; filter?: any }): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}/list`, payload);
  }

  create(payload: any): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}`, payload);
  }

  update(id: string, payload: any): Observable<IResponse> {
    return this._http.put(`${this._baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<IResponse> {
    return this._http.delete(`${this._baseUrl}/${id}`);
  }

  updatePaymentStatus(
    id: string,
    payload: { isPaid: boolean; payment?: { method: string; date: string | null; reference: string; notes: string } }
  ): Observable<IResponse> {
    return this._http.put(`${this._baseUrl}/${id}/payment-status`, payload);
  }
}