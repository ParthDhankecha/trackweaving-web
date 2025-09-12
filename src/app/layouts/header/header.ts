import { Component, Input } from '@angular/core';
import { interval, Subscription } from 'rxjs';

import moment from 'moment';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';


@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    RouterLinkActive,
    NgTemplateOutlet
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {

  @Input('containerClass') containerClass: string = '';


  readonly _moment = moment;
  protected readonly currentDateAndTimeFormat: string = 'DD-MM-YYYY, hh:mm A';
  protected currentDateAndTime: string = this._moment().format(this.currentDateAndTimeFormat);


  ngOnInit(): void {
    this.setCurrentTime();
  }


  protected currentTimeSubscription!: Subscription;
  private setCurrentTime(): void {
    this.currentTimeSubscription = interval(1000).subscribe(() => {
      this.currentDateAndTime = this._moment().format(this.currentDateAndTimeFormat);
    });
  }


  ngOnDestroy(): void {
    this.currentTimeSubscription?.unsubscribe();
  }
}