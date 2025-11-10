import { inject, Injectable } from '@angular/core';

import { AppConfig } from '@app/core/services/app-config/app-config';
import { Utils } from '@app/core/services/utils/utils';
import { Modal } from '@app/core/services/modal/modal';
import { ExportData } from './export-data/export-data';


@Injectable({
  providedIn: 'root'
})
export class CoreFacadeService {

  // Inject app config service
  public readonly appConfig: AppConfig = inject(AppConfig);
  // Inject utils service 
  public readonly utils: Utils = inject(Utils);
  // Inject modal service
  public readonly modal: Modal = inject(Modal);
  // Inject export data service
  public readonly exportData: ExportData = inject(ExportData);
}