import { Routes } from '@angular/router';

import { ROUTES } from '@src/app/constants/app.routes';
import { APP_PAGE_TITLE } from '@src/app/constants/app-config';

import { Invoice } from './invoice';
import { UpsertInvoice } from './upsert-invoice/upsert-invoice';
import { PrintInvoice } from './print-invoice/print-invoice';


export const routes: Routes = [
    {
        path: '',
        redirectTo: ROUTES.ADMIN.INVOICE_HOME,
        pathMatch: 'full'
    },
    {
        path: ROUTES.ADMIN.INVOICE_HOME,
        title: APP_PAGE_TITLE.ADMIN.INVOICE,
        component: Invoice
    },
    {
        path: `${ROUTES.ADMIN.INVOICE_PRINT}/:invoiceId`,
        title: APP_PAGE_TITLE.ADMIN.INVOICE_PRINT,
        component: PrintInvoice
    },
    {
        path: `${ROUTES.ADMIN.INVOICE_UPSERT}/:invoiceId`,
        title: APP_PAGE_TITLE.ADMIN.INVOICE_UPSERT,
        component: UpsertInvoice
    },
    {
        path: ROUTES.ADMIN.INVOICE_UPSERT,
        title: APP_PAGE_TITLE.ADMIN.INVOICE_UPSERT,
        component: UpsertInvoice
    }
];