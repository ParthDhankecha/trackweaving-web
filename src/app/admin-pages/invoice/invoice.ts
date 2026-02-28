import { Component, inject } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';
import { Pagination } from '@src/app/shared/components/pagination/pagination';
import { EntriesPerPageSelector } from '@src/app/shared/components/entries-per-page-selector/entries-per-page-selector';
import { ROUTES } from '@src/app/constants/app.routes';

import moment from 'moment';


@Component({
  selector: 'app-invoice',
  imports: [
    FormsModule,
    Pagination,
    EntriesPerPageSelector,
    DatePipe,
    DecimalPipe
  ],
  templateUrl: './invoice.html',
  styleUrl: './invoice.scss'
})
export class Invoice {

  protected readonly _apiFs = inject(ApiFacadeService);
  protected readonly _coreService = inject(CoreFacadeService);
  private readonly _router = inject(Router);

  protected currentPage: number = 1;
  protected pageSize: number = 10;
  protected totalEntries: number = 0;
  protected searchTerms: string = '';
  /** GST bill filter: '' = all, 'true' = GST only, 'false' = non-GST only */
  protected gstBillFilter: '' | 'true' | 'false' = '';

  protected invoiceList: any[] = [];
  protected deleteConfirmModalConfig: { isOpen: boolean; data: any } = { isOpen: false, data: null };
  protected isDeleteInProgress = false;

  protected paymentModalConfig: {
    isOpen: boolean;
    viewOnly: boolean;
    invoice: any | null;
    payment: { method: string; date: string; reference: string; notes: string };
  } = {
      isOpen: false,
      viewOnly: false,
      invoice: null,
      payment: { method: '', date: '', reference: '', notes: '' }
    };
  protected unpaidConfirmModalConfig: { isOpen: boolean; data: any } = { isOpen: false, data: null };
  protected isPaymentSubmitInProgress = false;
  protected isUnpaidInProgress = false;


  ngOnInit(): void {
    this.loadList();
  }


  private loadList(): void {
    const payload: { page?: number; limit?: number; filter?: any } = {};
    if (this.pageSize && this.pageSize > 0) {
      payload.limit = this.pageSize;
    }
    if (this.currentPage && this.currentPage > 0) {
      payload.page = this.currentPage;
    }
    if (this.searchTerms?.trim()) {
      payload.filter = payload.filter ?? {};
      payload.filter.search = this.searchTerms.trim();
    }
    if (this.gstBillFilter === 'true' || this.gstBillFilter === 'false') {
      payload.filter = payload.filter ?? {};
      payload.filter.includesGst = this.gstBillFilter === 'true';
    }

    this._apiFs.invoice.list(payload).subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.invoiceList = (res.data?.list ?? []).map((invoice: any) => {
            const subscriptionEndDate = invoice?.workspace?.subscriptionEndDate;
            return {
              ...invoice,
              isSubscriptionEndingSoon: subscriptionEndDate && moment(subscriptionEndDate).isBefore(moment().add(30, 'days')),
              isSubscriptionEnded: subscriptionEndDate && moment(subscriptionEndDate).isBefore(moment()),
            };
          });
          this.totalEntries = res.data?.count ?? 0;
        }
      },
      error: () => { }
    });
  }

  protected onSearch(event: Event): void {
    event.stopPropagation();
    this.currentPage = 1;
    this.loadList();
  }

  protected onGstBillFilterChange(): void {
    this.currentPage = 1;
    this.loadList();
  }

  protected onPageChange(page: number): void {
    this.currentPage = page;
    this.loadList();
  }

  protected onEntriesPerPageChange(size: number): void {
    if (size && size > 0) {
      this.currentPage = 1;
      this.pageSize = size;
      this.loadList();
    }
  }

  protected navigateToUpsert(invoiceId?: string): void {
    this._router.navigateByUrl(
      `/${ROUTES.ADMIN.BASE}/${ROUTES.ADMIN.INVOICE}/${ROUTES.ADMIN.INVOICE_UPSERT}${invoiceId ? `/${invoiceId}` : ''}`
    );
  }

  protected navigateToPrint(invoiceId: string): void {
    if (!invoiceId) return;
    this._router.navigateByUrl(
      `/${ROUTES.ADMIN.BASE}/${ROUTES.ADMIN.INVOICE}/${ROUTES.ADMIN.INVOICE_PRINT}/${invoiceId}`
    );
  }

  protected openDeleteConfirmModal(invoice: any): void {
    if (!invoice?._id) return;
    this.deleteConfirmModalConfig = { isOpen: true, data: invoice };
  }

  protected closeDeleteConfirmModal(): void {
    this.deleteConfirmModalConfig = { isOpen: false, data: null };
  }

  protected confirmDelete(): void {
    const invoice = this.deleteConfirmModalConfig.data;
    if (!invoice?._id || this.isDeleteInProgress) return;

    this.isDeleteInProgress = true;
    this._apiFs.invoice.delete(invoice._id).subscribe({
      next: (res: IResponse) => {
        this.isDeleteInProgress = false;
        this.closeDeleteConfirmModal();
        if (res.code === 'OK') {
          this._coreService.utils.showToaster(EToasterType.Success, 'Invoice deleted successfully.');
          this.loadList();
        }
      },
      error: (err: any) => {
        this.isDeleteInProgress = false;
        const msg = err?.error?.message ?? 'Something went wrong. Please try again.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }

  protected onPaymentStatusChange(invoice: any, event: Event): void {
    const target = event.target as HTMLInputElement;
    const newIsPaid = target?.checked ?? false;
    if (!invoice?._id) return;

    if (newIsPaid) {
      this.paymentModalConfig = {
        isOpen: true,
        viewOnly: false,
        invoice,
        payment: {
          method: invoice?.payment?.method ?? '',
          date: invoice?.payment?.date ? moment(invoice.payment.date).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
          reference: invoice?.payment?.reference ?? '',
          notes: invoice?.payment?.notes ?? ''
        }
      };
    } else {
      this.unpaidConfirmModalConfig = { isOpen: true, data: invoice };
    }
    target.checked = invoice?.payment?.isPaid ?? false;
  }

  protected openPaymentModal(invoice: any, viewOnly = false): void {
    if (!invoice?._id) return;
    this.paymentModalConfig = {
      isOpen: true,
      viewOnly,
      invoice,
      payment: invoice?.payment
    };
  }

  protected closePaymentModal(): void {
    this.paymentModalConfig = {
      isOpen: false,
      viewOnly: false,
      invoice: null,
      payment: { method: '', date: '', reference: '', notes: '' }
    };
  }

  protected confirmPayment(): void {
    const { invoice, payment } = this.paymentModalConfig;
    if (!invoice?._id || this.isPaymentSubmitInProgress) return;

    this.isPaymentSubmitInProgress = true;
    const payload = {
      isPaid: true,
      payment: {
        method: payment.method ?? '',
        date: payment.date ? moment(payment.date).format('YYYY-MM-DD') : null,
        reference: payment.reference ?? '',
        notes: payment.notes ?? ''
      }
    };
    this._apiFs.invoice.updatePaymentStatus(invoice._id, payload).subscribe({
      next: (res: IResponse) => {
        this.isPaymentSubmitInProgress = false;
        this.closePaymentModal();
        if (res.code === 'OK') {
          this._coreService.utils.showToaster(EToasterType.Success, 'Payment status updated.');
          this.loadList();
        }
      },
      error: (err: any) => {
        this.isPaymentSubmitInProgress = false;
        const msg = err?.error?.message ?? 'Something went wrong. Please try again.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }

  protected closeUnpaidConfirmModal(): void {
    this.unpaidConfirmModalConfig = { isOpen: false, data: null };
  }

  protected confirmUnpaid(): void {
    const invoice = this.unpaidConfirmModalConfig.data;
    if (!invoice?._id || this.isUnpaidInProgress) return;

    this.isUnpaidInProgress = true;
    this._apiFs.invoice.updatePaymentStatus(invoice._id, { isPaid: false }).subscribe({
      next: (res: IResponse) => {
        this.isUnpaidInProgress = false;
        this.closeUnpaidConfirmModal();
        if (res.code === 'OK') {
          this._coreService.utils.showToaster(EToasterType.Success, 'Invoice marked as unpaid.');
          this.loadList();
        }
      },
      error: (err: any) => {
        this.isUnpaidInProgress = false;
        const msg = err?.error?.message ?? 'Something went wrong. Please try again.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }
}
