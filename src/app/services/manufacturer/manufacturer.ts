import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpClient } from '../http-client/http-client';
import { IResponse } from '@src/app/models/http-response.model';


@Injectable({
  providedIn: 'root'
})
export class Manufacturer {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _baseUrl: string = 'admin/manufacturer';


  optionList(): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}/option-list`);
  }

  getById(id: string): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}/${id}`);
  }

  listWithPagination(payload: { companyName?: string; isActive?: boolean; page?: number; limit?: number }): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}/pagination`, payload);
  }

  create(payload: { companyName: string; isActive?: boolean }): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}/create`, payload);
  }

  update(id: string, payload: { companyName?: string; isActive?: boolean }): Observable<IResponse> {
    return this._http.put(`${this._baseUrl}/update/${id}`, payload);
  }

  delete(id: string): Observable<IResponse> {
    return this._http.delete(`${this._baseUrl}/delete/${id}`);
  }

  assignWorkspaces(id: string, workspaceIds: string[]): Observable<IResponse> {
    return this._http.put(`${this._baseUrl}/assign-workspaces/${id}`, { workspaceIds });
  }
}