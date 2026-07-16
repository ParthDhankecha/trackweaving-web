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
      dpoName: '-',
      companyName: 'Pickwell Exim',
      companyEmail: 'info@pickwell.in',
      companyAddress: 'Plot No. 316, 1st Floor, Road No. 3, Near Paliwal Chokadi, Sachin G.I.D.C., Surat-394230, Gujarat, India',
      effectiveDate: moment().format('MMMM D, YYYY'),
      lastUpdated: moment().format('MMMM D, YYYY'),
      year: moment().format('YYYY')
    };
}