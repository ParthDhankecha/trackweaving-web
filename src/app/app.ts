import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { CoreFacadeService } from './core/services/core-facade-service';
import { ApiFacadeService } from './services/api-facade-service';
import { Toaster } from './shared/components/toaster/toaster';
import { IResponse } from './models/http-response.model';


@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    Toaster
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  constructor(
    private _coreService: CoreFacadeService,
    private _apiFs: ApiFacadeService
  ) {
    // this._coreService.appConfig.setDefaultLanguage();
    this.loadSyncData();
  }

  private loadSyncData(): void {
    this._apiFs.sync.sync().subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          const data = res.data || {};
          const decodedData = this._coreService.utils.decodeData(data.data, data.date);
          if (decodedData) {
            this._coreService.appConfig.configData = decodedData;
          }
        }
      },
      error: (err: any) => { }
    });
  }
}