import { Routes } from '@angular/router';


import { ROUTES } from './constants/app.routes';
import { APP_PAGE_TITLE } from './constants/app-config';

import { MainLayout } from './layouts/main-layout/main-layout';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { PageNotFound } from './shared/components/page-not-found/page-not-found';

import { authGuard } from './core/guards/auth-guard';


export const routes: Routes = [
    {
        path: ROUTES.BASE,
        title: APP_PAGE_TITLE.BRAND_NAME,
        component: MainLayout,
        canActivate: [authGuard],
        loadChildren: () => import('./pages/pages.routes').then(m => m.routes),
    },
    {
        path: ROUTES.AUTH.BASE,
        title: APP_PAGE_TITLE.AUTH.BASE,
        component: AuthLayout,
        loadChildren: () => import('./pages/auth/auth.routes').then(m => m.routes),
    },
    {
        path: ROUTES.ADMIN.BASE,
        title: APP_PAGE_TITLE.ADMIN.BASE,
        loadChildren: () => import('./admin-pages/admin-pages.routes.js').then(m => m.routes),
    },
    {
        path: ROUTES.PAGE_NOT_FOUND,
        title: APP_PAGE_TITLE.PAGE_NOT_FOUND,
        component: PageNotFound
    }
];