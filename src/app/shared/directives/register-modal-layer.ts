import { Directive, inject, Input } from '@angular/core';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';


@Directive({
  selector: '[appRegisterModalLayer]'
})
export class RegisterModalLayer {

  private readonly _coreService = inject(CoreFacadeService);

  @Input('appRegisterModalLayer') modalLayerId: string = '';  // The ID of the modal layer to register
  @Input('openModalOnInit') openModalOnInit: boolean = false; // Whether to open the modal immediately after registration


  ngOnInit(): void {
    if (!this.modalLayerId) {
      console.warn('Modal Layer ID is required for registration.');
      return;
    }
    // Register modal in the core service
    this._coreService.modal.register(this.modalLayerId);
    // Open modal if specified
    if (this.openModalOnInit) {
      this._coreService.modal.open(this.modalLayerId);
    }
  }

  ngOnDestroy(): void {
    if (this.modalLayerId) {
      // Unregister modal on destroy
      this._coreService.modal.unregister(this.modalLayerId);
    }
  }
}