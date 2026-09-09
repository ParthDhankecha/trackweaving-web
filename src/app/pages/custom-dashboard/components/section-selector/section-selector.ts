import { Component, EventEmitter, Input, Output } from '@angular/core';

import { TrackWeavingLogo } from '@src/app/shared/components/track-weaving-logo/track-weaving-logo';
import { SectionKey } from '@src/app/models/custom-dashboard.model';

@Component({
  selector: 'app-section-selector',
  imports: [TrackWeavingLogo],
  templateUrl: './section-selector.html',
  styleUrl: './section-selector.scss'
})
export class SectionSelector {
  /** Renders as a dismissible overlay on top of the live dashboard instead of a full first-run screen. */
  @Input() overlay: boolean = false;
  @Input() currentSection: SectionKey | null = null;

  @Output() sectionSelected = new EventEmitter<SectionKey>();
  @Output() dismissed = new EventEmitter<void>();

  protected readonly sections: SectionKey[] = ['A', 'B'];

  protected choose(section: SectionKey): void {
    this.sectionSelected.emit(section);
  }
}
