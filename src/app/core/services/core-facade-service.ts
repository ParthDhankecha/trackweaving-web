import { inject, Injectable } from '@angular/core';

import { Utils } from './utils/utils';
import { Modal } from './modal/modal';


@Injectable({
  providedIn: 'root'
})
export class CoreFacadeService {

  // Inject utils service 
  public readonly utils: Utils = inject(Utils);

  // Inject modal service
  public readonly modal: Modal = inject(Modal);
}