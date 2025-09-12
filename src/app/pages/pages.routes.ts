import { Routes } from '@angular/router';

import { ROUTES } from '@src/app/constants/app.routes';
import { APP_PAGE_TITLE } from '@src/app/constants/app-config';

import { authGuard } from '../core/guards/auth-guard';

import { Dashboard } from './dashboard/dashboard';


export const routes: Routes = [
    {
        path: '',
        redirectTo: ROUTES.DASHBOARD,
        pathMatch: 'full'
    },
    {
        path: ROUTES.DASHBOARD,
        title: APP_PAGE_TITLE.DASHBOARD,
        component: Dashboard,
        canActivate: [authGuard],
    },
    {
        path: 'dev',
        title: APP_PAGE_TITLE.DASHBOARD,
        component: Dashboard,
        canActivate: [authGuard],
    }
];