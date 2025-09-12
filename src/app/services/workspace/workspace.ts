import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpClient } from '../http-client/http-client';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { IWorkspace } from '@src/app/models/workspace.model';


@Injectable({
  providedIn: 'root'
})
export class Workspace {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _baseUrl: string = 'admin/workspace';

  private readonly _coreService = inject(CoreFacadeService);
  protected readonly encodeKey = this._coreService.utils.encodeKey;



  listWithPagination(payload: { isActive?: boolean, page?: number, limit?: number }): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}/pagination`, payload);
  }

  optionList(): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}/option-list`);
  }

  create(payload: IWorkspace): Observable<IResponse> {
    const body = {
      data: this._coreService.utils.encodeData(payload, this.encodeKey),
      date: this.encodeKey
    };
    return this._http.post(`${this._baseUrl}/create`, body);
  }

  update(id: string, payload: IWorkspace): Observable<IResponse> {
    return this._http.put(`${this._baseUrl}/update/${id}`, payload);
  }
}