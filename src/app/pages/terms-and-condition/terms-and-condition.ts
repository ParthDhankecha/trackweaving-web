import { Component } from '@angular/core';
import moment from 'moment';

@Component({
  selector: 'app-terms-and-condition',
  imports: [],
  templateUrl: './terms-and-condition.html',
  styleUrl: './terms-and-condition.scss'
})
export class TermsAndCondition {

  protected readonly details: {
    dpoName: string;
    companyName: string;
    companyEmail: string;
    companyAddress: string;
    companyCity: string;
    companyState: string;
    effectiveDate: string;
    year: string;
  } = {
      dpoName: '-',
      companyName: 'Pickwell Exim',
      companyEmail: 'info@pickwell.in',
      companyAddress: 'Plot No. 316, 1st Floor, Road No. 3, Near Paliwal Chokadi, Sachin G.I.D.C., Surat-394230, Gujarat, India',
      companyCity: 'Surat',
      companyState: 'Gujarat',
      effectiveDate: moment().format('MMMM D, YYYY'),
      year: moment().format('YYYY')
    };
}