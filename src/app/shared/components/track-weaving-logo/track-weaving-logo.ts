import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-track-weaving-logo',
  templateUrl: './track-weaving-logo.html',
  styleUrl: './track-weaving-logo.scss'
})
export class TrackWeavingLogo {
  @Input() size = 40;
  @Input() framed = true;
}