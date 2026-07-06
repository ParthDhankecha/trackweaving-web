import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpClient } from '../http-client/http-client';
import { IResponse } from '@src/app/models/http-response.model';


@Injectable({
  providedIn: 'root'
})
export class Lead {

  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _baseUrl: string = 'admin/lead';


  getStats(): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}/stats`);
  }

  getById(id: string): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}/${id}`);
  }

  list(payload: {
    page?: number;
    limit?: number;
    filter?: any;
    sort?: { field: string; order: 'asc' | 'desc' };
  }): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}/list`, payload);
  }

  checkDuplicate(mobileNumber: string, excludeId?: string): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}/check-duplicate`, { mobileNumber, excludeId });
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
}
