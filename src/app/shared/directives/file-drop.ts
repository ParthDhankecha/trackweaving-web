import { Directive, EventEmitter, HostListener, Output } from '@angular/core';


@Directive({
  selector: '[appFileDrop]'
})
export class FileDrop {

  @Output('filesDropped') filesDropped = new EventEmitter<FileList>();  // Event emitter for dropped files

  // Allow the drop by preventing the default behavior
  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();  // Prevent default to allow dropping
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    event.preventDefault();  // Prevent default to handle the leave correctly
  }

  // Handle the drop event
  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files) {
      this.filesDropped.emit(files);  // Emit the dropped files
      console.log('Files dropped:', files);
    }
  }
}