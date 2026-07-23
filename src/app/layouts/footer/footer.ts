import { Component, inject, Input } from '@angular/core';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';


@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer {

  @Input() contentOnly: boolean = false;

  // Inject services
  protected _coreService = inject(CoreFacadeService);


  get customerId(): string {
    return this._coreService.utils.decodeToken?.user?.uid;
  }
}