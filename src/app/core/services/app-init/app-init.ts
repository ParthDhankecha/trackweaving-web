import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { CoreFacadeService } from '../core-facade-service';

import { IResponse } from '@src/app/models/http-response.model';


@Injectable({
  providedIn: 'root'
})
export class AppInit {
  constructor(
    private _apiFs: ApiFacadeService,
    private _coreService: CoreFacadeService
  ) { }

  async initApp(): Promise<void> {
    try {
      const res: IResponse = await firstValueFrom(this._apiFs.sync.sync());
      if (res.code === 'OK' && res.data) {
        const data = res.data || {};
        const decoded = this._coreService.utils.decodeData(data.data, data.date);
        if (decoded) {
          this._coreService.appConfig.configData = decoded;
        }
      }
    } catch (err) {
      console.error('App initialization failed', err);
    }
  }
}