import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';

import { HttpClient } from '../http-client/http-client';
import { IResponse } from '@src/app/models/http-response.model';
import { EMachineStatusIds } from '@src/app/models/machine.model';


@Injectable({
  providedIn: 'root'
})
export class Dashboard {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _baseUrl: string = 'machine-logs';

  private readonly _coreService = inject(CoreFacadeService);
  protected readonly encodeKey = this._coreService.utils.encodeKey;


  getList(payload: { status: EMachineStatusIds }): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}/list`, payload);
  }
}