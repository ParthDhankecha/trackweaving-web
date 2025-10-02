import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { HttpClient } from '../http-client/http-client';


@Injectable({
  providedIn: 'root'
})
export class Sync {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _baseUrl: string = 'sync';

  private readonly _coreService = inject(CoreFacadeService);
  protected readonly encodeKey = this._coreService.utils.encodeKey;


  sync(payload: any = {}): Observable<IResponse> {
    payload = {
      data: this._coreService.utils.encodeData(payload, this.encodeKey),
      date: this.encodeKey
    };
    return this._http.post(`${this._baseUrl}`, payload);
  }
}