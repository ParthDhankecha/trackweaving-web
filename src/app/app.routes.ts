import { Routes } from '@angular/router';

import { ROUTES } from './constants/app.routes';
import { APP_PAGE_TITLE, LANDING_SEO } from './constants/app-config';

import { Landing } from './pages/landing/landing';
import { MainLayout } from './layouts/main-layout/main-layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { Reports } from './pages/reports/reports';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { TermsAndCondition } from './pages/terms-and-condition/terms-and-condition';
import { PrivacyPolicy } from './pages/privacy-policy/privacy-policy';
import { Support } from './pages/support/support';
import { PageNotFound } from './shared/components/page-not-found/page-not-found';

import { authGuard } from './core/guards/auth-guard';
import { landingGuard } from './core/guards/landing-guard';
import { deviceSessionGuard, stayOnDeviceReportGuard } from './core/guards/device-session-guard';


export const routes: Routes = [
    {
        path: ROUTES.LANDING,
        title: LANDING_SEO.title,
        component: Landing,
        pathMatch: 'full',
        canActivate: [deviceSessionGuard, landingGuard],
    },
    {
        path: ROUTES.BASE,
        title: APP_PAGE_TITLE.BRAND_NAME,
        component: MainLayout,
        canActivate: [deviceSessionGuard, authGuard],
        loadChildren: () => import('./pages/pages.routes').then(m => m.routes),
    },
    {// for client
        path: ROUTES.DASHBOARD,
        title: APP_PAGE_TITLE.DASHBOARD,
        component: Dashboard,
        canActivate: [deviceSessionGuard, authGuard],
    },
    {
        path: ROUTES.AUTH.BASE,
        title: APP_PAGE_TITLE.AUTH.BASE,
        component: AuthLayout,
        canActivate: [deviceSessionGuard],
        loadChildren: () => import('./pages/auth/auth.routes').then(m => m.routes),
    },
    {
        path: ROUTES.ADMIN.BASE,
        title: APP_PAGE_TITLE.ADMIN.BASE,
        canActivate: [deviceSessionGuard],
        loadChildren: () => import('./admin-pages/admin-pages.routes.js').then(m => m.routes),
    },
    {
        path: ROUTES.MANUFACTURER.BASE,
        title: APP_PAGE_TITLE.MANUFACTURER.BASE,
        canActivate: [deviceSessionGuard],
        loadChildren: () => import('./manufacturer-pages/manufacturer-pages.routes').then(m => m.routes),
    },
    {
        path: ROUTES.DEVICE_REPORT,
        title: APP_PAGE_TITLE.DEVICE_REPORT,
        data: { isDevice: true },
        canActivate: [deviceSessionGuard],
        canDeactivate: [stayOnDeviceReportGuard],
        component: Reports,
    },
    {
        path: ROUTES.TERMS_AND_CONDITIONS,
        title: APP_PAGE_TITLE.TERMS_AND_CONDITIONS,
        component: TermsAndCondition,
    },
    {
        path: ROUTES.PRIVACY_POLICY,
        title: APP_PAGE_TITLE.PRIVACY_POLICY,
        component: PrivacyPolicy,
    },
    {
        path: ROUTES.SUPPORT,
        title: APP_PAGE_TITLE.SUPPORT,
        component: Support,
    },
    {
        path: ROUTES.PAGE_NOT_FOUND,
        title: APP_PAGE_TITLE.PAGE_NOT_FOUND,
        component: PageNotFound
    }
];