import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpClient } from '../http-client/http-client';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { IResponse } from '@src/app/models/http-response.model';


@Injectable({
  providedIn: 'root'
})
export class MachineGroup {

  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _baseUrl: string = 'machine-group';

  private readonly _coreService = inject(CoreFacadeService);
  protected readonly encodeKey = this._coreService.utils.encodeKey;


  list(): Observable<IResponse> {
    return this._http.get(`${this._baseUrl}`);
  }

  create(payload: { machineCode: string, machineName: string, ip: string, workspaceId: string }): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}`, payload);
  }

  update(machineId: string, payload: { machineCode?: string, machineName?: string, ip?: string, workspaceId?: string }): Observable<IResponse> {
    return this._http.put(`${this._baseUrl}/${machineId}`, payload);
  }

  delete(machineId: string): Observable<IResponse> {
    return this._http.delete(`${this._baseUrl}/${machineId}`);
  }
}