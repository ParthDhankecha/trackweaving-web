import { inject, Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

import { HttpClient } from '../http-client/http-client';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { IResponse } from '@src/app/models/http-response.model';


@Injectable({
  providedIn: 'root'
})
export class Machine {

  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _baseUrl: string = 'admin/machine';

  private readonly _coreService = inject(CoreFacadeService);
  protected readonly encodeKey = this._coreService.utils.encodeKey;

  /** Cached once for the app lifetime — machine enum options. */
  private _configurations$?: Observable<IResponse>;


  getConfigurations(): Observable<IResponse> {
    if (!this._configurations$) {
      this._configurations$ = this._http.get<IResponse>(`${this._baseUrl}/configurations`).pipe(
        shareReplay({ bufferSize: 1, refCount: false })// cache the response for the app lifetime until the app reloads
      );
    }
    return this._configurations$;
  }

  listWithPagination(payload: {
    page?: number,
    limit?: number,
    machineName?: string,
    workspaceId?: string[],
    machineCode?: string,
    ip?: string
  }): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}`, payload);
  }

  getMachineCode(workspaceId: string): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}/code/${workspaceId}`);
  }

  optionList(workspaceId: string): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}/option-list/${workspaceId}`);
  }

  create(payload: { machineCode: string, machineName: string, ip: string, workspaceId: string }): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}/create`, payload);
  }

  update(machineId: string, payload: { machineCode?: string, machineName?: string, ip?: string, workspaceId?: string }): Observable<IResponse> {
    return this._http.put(`${this._baseUrl}/update/${machineId}`, payload);
  }

  delete(machineId: string): Observable<IResponse> {
    return this._http.delete(`${this._baseUrl}/delete/${machineId}`);
  }
}