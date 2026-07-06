import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';


@Component({
  selector: 'app-view-lead',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  templateUrl: './view-lead.html',
  styleUrl: './view-lead.scss'
})
export class ViewLead {

  @Input() lead: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<any>();

  protected onClose(): void {
    this.close.emit();
  }

  protected onEdit(): void {
    this.edit.emit(this.lead);
  }

  protected getStatusColor(status: string): string {
    const map: Record<string, string> = {
      'New': 'primary',
      'Contacted': 'info',
      'Demo scheduled': 'warning',
      'Visited': 'info',
      'Follow up': 'warning',
      'Converted': 'success',
      'Not interested': 'secondary',
      'Lost': 'danger',
    };
    return map[status] ?? 'secondary';
  }
}
