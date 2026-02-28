import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';

import moment from 'moment';

import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ROUTES } from '@src/app/constants/app.routes';
import { IResponse } from '@src/app/models/http-response.model';

const BODY_CLASS = 'invoice-print-view';


@Component({
  selector: 'app-print-invoice',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  templateUrl: './print-invoice.html',
  styleUrl: './print-invoice.scss'
})
export class PrintInvoice implements OnInit, OnDestroy {

  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _coreService = inject(CoreFacadeService);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _doc = inject(DOCUMENT);

  protected invoice: any = null;
  protected configData: any = null;
  protected loading = true;
  protected error: string | null = null;

  /** QR code image for bank details (when includesGst). */
  protected readonly qrCodeSrc = 'assets/qr_code.svg';

  protected get currencySymbol(): string {
    return this._coreService.appConfig?.configData?.currencySymbol ?? '₹';
  }

  /** Empty rows to add below line items so the table fills the page (min total rows). */
  protected get emptyTableRows(): number[] {
    const count = (this.invoice?.lineItems?.length ?? 0);
    const minRows = this.invoice?.includesGst ? 7 : 10;
    const emptyCount = Math.max(0, minRows - count);
    return Array.from({ length: emptyCount }, (_, i) => i);
  }


  ngOnInit(): void {
    this._doc.body.classList.add(BODY_CLASS);
    const id = this._route.snapshot.paramMap.get('invoiceId');
    if (!id) {
      this.error = 'Invoice ID is required.';
      this.loading = false;
      return;
    }

    this.getInvoiceDetails(id);
    this.getConfiguration();
  }


  protected getInvoiceDetails(id: string): void {
    this._apiFs.invoice.getById(id).subscribe({
      next: (res: IResponse) => {
        if (res.code !== 'OK') return;

        this.invoice = res?.data;
        this.invoice.lineItems = [...this.invoice.lineItems];
        this.loading = false;
        if (!this.invoice) this.error = 'Invoice not found.';
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load invoice.';
      }
    });
  }

  protected getConfiguration(): void {
    this._apiFs.invoice.getConfiguration().subscribe({
      next: (res: IResponse) => {
        if (res.code !== 'OK') return;
        this.configData = res.data;
      },
      error: () => {
        this.configData = null;
      }
    });
  }

  protected get displayDate(): string {
    if (!this.invoice?.createdAt) return '';
    return moment(this.invoice.createdAt).format('DD-MM-YYYY');
  }

  protected get invoiceNumber(): string {
    return this.invoice?.invoiceNumber ?? this.invoice?._id ?? '—';
  }

  /** Indian Rupee amount in words (integer part). */
  protected amountInWords(): string {
    const n = Number(this.invoice?.finalAmount ?? 0);
    if (!Number.isFinite(n) || n < 0) return '';
    const whole = Math.floor(n);
    const paise = Math.round((n - whole) * 100);
    const words = this.numberToWords(whole);
    const str = words ? `Rs. ${words} Only` : '';
    if (paise > 0) {
      const pWords = this.numberToWords(paise);
      return str ? `${str} and ${pWords} Paise` : `Rs. ${pWords} Paise Only`;
    }
    return str || '—';
  }

  private numberToWords(n: number): string {
    if (n === 0) return 'Zero';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const to99 = (x: number): string => {
      if (x < 20) return ones[x];
      const t = Math.floor(x / 10);
      const o = x % 10;
      return (tens[t] + (o ? ' ' + ones[o] : '')).trim();
    };
    const to999 = (x: number): string => {
      if (x < 100) return to99(x);
      const h = Math.floor(x / 100);
      const r = x % 100;
      return (ones[h] + ' Hundred' + (r ? ' ' + to99(r) : '')).trim();
    };
    const to99999 = (x: number): string => {
      if (x < 1000) return to999(x);
      const th = Math.floor(x / 1000);
      const r = x % 1000;
      return (to999(th) + ' Thousand' + (r ? ' ' + to999(r) : '')).trim();
    };
    const to9999999 = (x: number): string => {
      if (x < 100000) return to99999(x);
      const lk = Math.floor(x / 100000);
      const r = x % 100000;
      return (to99(lk) + ' Lakh' + (lk !== 1 ? 's' : '') + (r ? ' ' + to99999(r) : '')).trim();
    };
    const to999999999 = (x: number): string => {
      if (x < 10000000) return to9999999(x);
      const cr = Math.floor(x / 10000000);
      const r = x % 10000000;
      return (to999(cr) + ' Crore' + (cr !== 1 ? 's' : '') + (r ? ' ' + to9999999(r) : '')).trim();
    };
    return to999999999(n);
  }

  protected print(): void {
    window.print();
  }

  protected back(): void {
    this._router.navigateByUrl(`/${ROUTES.ADMIN.BASE}/${ROUTES.ADMIN.INVOICE}`);
  }


  ngOnDestroy(): void {
    this._doc.body.classList.remove(BODY_CLASS);
  }
}