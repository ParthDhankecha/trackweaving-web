import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpClient } from '../http-client/http-client';
import { IResponse } from '@src/app/models/http-response.model';


@Injectable({
  providedIn: 'root'
})
export class Operator {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _baseUrl: string = 'operators';


  list(payload: { page?: number, limit?: number } = {}): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}/list`, payload);
  }

  create(payload: { operatorName: string, shift: number, machineIds?: string[] }): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}`, payload);
  }

  update(operatorId: string, payload: { operatorName?: string, shift?: number, machineIds?: string[] }): Observable<IResponse> {
    return this._http.put(`${this._baseUrl}/${operatorId}`, payload);
  }

  delete(operatorId: string): Observable<IResponse> {
    return this._http.delete(`${this._baseUrl}/${operatorId}`);
  }
}
