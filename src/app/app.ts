import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { UtmTrackerService } from '@app/core/services/utm-tracker/utm-tracker';
import { Toaster } from './shared/components/toaster/toaster';


@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    Toaster
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly utmTracker = inject(UtmTrackerService);


  constructor() {
    this.utmTracker.startTracking();
  }
}