import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpClient } from '../http-client/http-client';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { IResponse } from '@src/app/models/http-response.model';


@Injectable({
  providedIn: 'root'
})
export class Users {

  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _baseUrl: string = 'admin/user';

  private readonly _coreService = inject(CoreFacadeService);
  protected readonly encodeKey = this._coreService.utils.encodeKey;


  listWithPagination(payload: { page?: number, limit?: number }): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}/pagination`, payload);
  }

  create(payload: any): Observable<IResponse> {
    const body = {
      data: this._coreService.utils.encodeData(payload, this.encodeKey),
      date: this.encodeKey
    };
    return this._http.post(`${this._baseUrl}/create`, body);
  }

  update(id: string, payload: any): Observable<IResponse> {
    return this._http.put(`${this._baseUrl}/update/${id}`, payload);
  }

  delete(id: string): Observable<IResponse> {
    return this._http.delete(`${this._baseUrl}/delete/${id}`);
  }
}