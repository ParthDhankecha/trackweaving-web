import { Component } from '@angular/core';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';


@Component({
  selector: 'app-toaster',
  imports: [],
  templateUrl: './toaster.html',
  styleUrl: './toaster.scss'
})
export class Toaster {

  constructor(
    private _coreService: CoreFacadeService
  ) {
    this._coreService.utils.toasters$.subscribe({
      next: (toaster: any) => {
        toaster.id = `toaster-${Math.random().toString(36).substring(2, 9)}`;
        toaster.timeoutId = setTimeout(() => {
          this.removeToaster(toaster);
        }, toaster.duration || 6000);
        this.toasters.push(toaster);
      }
    });

    this._coreService.utils.clearToasters$.subscribe({
      next: (needClear: boolean) => {
        if (needClear) {
          // Clear the timeout if it exists
          this.toasters.forEach(t => { if (t && t.timeoutId) clearTimeout(t.timeoutId) });
          this.toasters = [];
        }
      }
    });
  }


  protected toasters: any[] = [];
  
  get toasterTop(): string {
    return this._coreService.utils.isAuthenticated && this._coreService.utils.isAdmin ? '80px' : '20px';
  }

  protected onMouseEnter(event: MouseEvent, toaster: any): void {
    event.stopPropagation();
    if (toaster && toaster.timeoutId) {
      clearTimeout(toaster.timeoutId); // Clear the timeout to prevent auto-dismissal
      toaster.timeoutId = null;
    }
  }

  protected onMouseLeave(event: MouseEvent, toaster: any): void {
    event.stopPropagation();
    if (toaster && !toaster.timeoutId) {
      toaster.timeoutId = setTimeout(() => {
        this.removeToaster(toaster);
      }, 2500); // Resume auto-dismissal after 2.5 seconds
    }
  }


  protected removeToaster(toaster: any): void {
    const toasterIdx = this.toasters.findIndex(t => t.id === toaster.id);
    if (toasterIdx !== -1) {
      this.toasters.splice(toasterIdx, 1);// Remove the toaster from the array
    }
    if (toaster && toaster.timeoutId) {
      clearTimeout(toaster.timeoutId); // Clear the timeout if it exists
    }
  }

  ngOnDestroy(): void {
    // Clear all timeouts when the component is destroyed
    this.toasters.forEach(t => { if (t && t.timeoutId) clearTimeout(t.timeoutId) });
    this.toasters = [];
  }
}