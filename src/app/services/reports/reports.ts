import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpClient } from '../http-client/http-client';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { IResponse } from '@src/app/models/http-response.model';


@Injectable({
  providedIn: 'root'
})
export class Reports {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _baseUrl: string = 'reports';

  private readonly _coreService = inject(CoreFacadeService);
  protected readonly encodeKey = this._coreService.utils.encodeKey;


  generateReport(payload: any = {}): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}`, payload);
  }
}