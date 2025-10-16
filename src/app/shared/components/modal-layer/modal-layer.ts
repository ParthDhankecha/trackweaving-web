import { NgClass } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, inject, Input, Output, ViewChild } from '@angular/core';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';


@Component({
  selector: 'app-modal-layer',
  imports: [
    NgClass
  ],
  templateUrl: './modal-layer.html',
  styleUrl: './modal-layer.scss'
})
export class ModalLayer {

  protected _coreService = inject(CoreFacadeService);

  /**
   * Modal layer component that displays a modal with a specific background and content positioning.
   * Uses `appRegisterModalLayer` for modal registration and identification.
   */
  @Input('appRegisterModalLayer') id: string = '';
  @Input('bgLayer') bgLayer: 'bg-gray-light' | 'bg-gray-blur-sm' | 'bg-gray-blur-lg' | 'bg-white-blur-sm' | '' = 'bg-gray-light';
  @Input('contentPosition') contentPosition: 'center' | 'right' = 'center';
  @Output('close') close: EventEmitter<void> = new EventEmitter<void>();


  @ViewChild('modalLayerWrapperRef') modalLayerWrapper!: ElementRef;
  @ViewChild('modalContainerRef') modalContainer!: ElementRef;


  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    if (this.modalContainer?.nativeElement && !this.modalContainer?.nativeElement.contains(event.target)) {
      this.close.emit();
    }
  }


  get isOpen(): boolean {
    return this._coreService.modal.isOpen(this.id);
  }
}