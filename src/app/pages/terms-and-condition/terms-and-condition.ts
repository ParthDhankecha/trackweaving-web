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
      dpoName: 'Ronak',
      companyName: 'Dwarkesh Infotech',
      companyEmail: 'trackweaving@gmail.com',
      companyAddress: '706, Surat Digital Valley, VIP Circle, Uttran, Surat, Gujarat 394105',
      companyCity: 'Surat',
      companyState: 'Gujarat',
      effectiveDate: moment().format('MMMM D, YYYY'),
      year: moment().format('YYYY')
    };
}