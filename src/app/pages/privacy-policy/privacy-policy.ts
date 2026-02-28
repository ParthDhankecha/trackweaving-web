import { Component } from '@angular/core';
import moment from 'moment';

@Component({
  selector: 'app-privacy-policy',
  imports: [],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss'
})
export class PrivacyPolicy {

  protected readonly details: {
    dpoName: string;
    companyName: string;
    companyEmail: string;
    companyAddress: string;
    effectiveDate: string;
    lastUpdated: string;
    year: string;
  } = {
      dpoName: 'Ronak',
      companyName: 'Dwarkesh Infotech',
      companyEmail: 'trackweaving@gmail.com',
      companyAddress: '706, Surat Digital Valley, VIP Circle, Uttran, Surat, Gujarat 394105',
      effectiveDate: moment().format('MMMM D, YYYY'),
      lastUpdated: moment().format('MMMM D, YYYY'),
      year: moment().format('YYYY')
    };
}