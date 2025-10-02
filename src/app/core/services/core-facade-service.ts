import { inject, Injectable } from '@angular/core';

import { AppConfig } from './app-config/app-config';
import { Utils } from './utils/utils';
import { Modal } from './modal/modal';


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
}