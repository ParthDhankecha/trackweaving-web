import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpClient } from '../http-client/http-client';
import { IResponse } from '@src/app/models/http-response.model';


@Injectable({
  providedIn: 'root'
})
export class ManufacturerUser {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _baseUrl: string = 'admin/manufacturer-user';


  listWithPagination(payload: {
    manufacturerId?: string;
    isActive?: boolean;
    email?: string;
    contactPerson?: string;
    page?: number;
    limit?: number;
  }): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}/pagination`, payload);
  }

  getById(id: string): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}/${id}`);
  }

  create(payload: {
    manufacturerId: string;
    email: string;
    password: string;
    contactPerson: string;
    phone?: string;
    isActive: boolean;
  }): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}/create`, payload);
  }

  update(id: string, payload: {
    manufacturerId?: string;
    email?: string;
    password?: string;
    contactPerson?: string;
    phone?: string;
    isActive?: boolean;
  }): Observable<IResponse> {
    return this._http.put(`${this._baseUrl}/update/${id}`, payload);
  }

  delete(id: string): Observable<IResponse> {
    return this._http.delete(`${this._baseUrl}/delete/${id}`);
  }
}