import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-entries-per-page-selector',
  imports: [
    FormsModule
  ],
  templateUrl: './entries-per-page-selector.html',
  styleUrl: './entries-per-page-selector.scss'
})
export class EntriesPerPageSelector {

  @Input('options') options: number[] = [10, 25, 50, 75, 100]; // Default options
  @Input('pageSize') pageSize: number = 10;  // Default page size
  @Input('selectClass') selectClass: string = ''; // Additional CSS classes for the select element
  @Output() pageSizeChange = new EventEmitter<number>();  // To emit changes to parent component


  protected onEntriesPerPageChange(event: any): void {
    this.pageSizeChange.emit(parseInt(event.target.value, 10));
  }
}