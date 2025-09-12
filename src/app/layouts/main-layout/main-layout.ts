import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Toaster } from '@src/app/shared/components/toaster/toaster';


@Component({
  selector: 'app-main-layout',
  imports: [
    RouterOutlet,
    Toaster
    // RouterLink,
    // RouterLinkActive
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout {


}