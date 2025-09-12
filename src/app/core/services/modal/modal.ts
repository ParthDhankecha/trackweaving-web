import { Injectable } from '@angular/core';
import { IModalLayer } from '@src/app/models/utils.model';


@Injectable({
  providedIn: 'root'
})
export class Modal {

  private modals: Array<IModalLayer> = [];


  register(id: string) {
    const index = this.modals.findIndex((m: IModalLayer) => m.id === id);
    if (index == -1) {
      this.modals.push({
        id: id,
        open: false
      });
    }
  }

  unregister(id: string): void {
    this.modals = this.modals.filter((m: IModalLayer) => m.id !== id);
  }

  isOpen(id: string): boolean {
    const modal = this.modals.find((m: IModalLayer) => m.id === id);
    return modal ? modal.open : false;
  }

  open(id: string): void {
    const index = this.modals.findIndex((m: IModalLayer) => m.id === id);
    if (index > -1) {
      this.modals[index].open = true;
    }
  }

  close(id: string): void {
    const index = this.modals.findIndex((m: IModalLayer) => m.id === id);
    if (index > -1) {
      this.modals[index].open = false;
    }
  }

  toggle(id: string): void {
    const index = this.modals.findIndex((m: IModalLayer) => m.id === id);
    if (index > -1) {
      this.modals[index].open = !this.modals[index].open;
    }
  }
}