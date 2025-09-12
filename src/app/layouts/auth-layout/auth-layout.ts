import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toaster } from '@src/app/shared/components/toaster/toaster';


@Component({
  selector: 'app-auth-layout',
  imports: [
    RouterOutlet,
    Toaster
  ],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss'
})
export class AuthLayout { }