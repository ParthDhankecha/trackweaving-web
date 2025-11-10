import { Routes } from '@angular/router';

import { ROUTES } from '@src/app/constants/app.routes';
import { APP_PAGE_TITLE } from '@src/app/constants/app-config';

// import { Dashboard } from './dashboard/dashboard';
import { Reports } from './reports/reports';

// import { adminRoleGuard } from '../core/guards/admin-role-guard';
import { authGuard } from '../core/guards/auth-guard';
import { RoleRedirect } from '../shared/components/role-redirect/role-redirect';


export const routes: Routes = [
    {
        path: '',
        // redirectTo: ROUTES.DASHBOARD,
        pathMatch: 'full',
        component: RoleRedirect// It will handle the redirection based on role
    },
    // {
    //     path: ROUTES.DASHBOARD,
    //     title: APP_PAGE_TITLE.DASHBOARD,
    //     component: Dashboard,
    //     canActivate: [authGuard, adminRoleGuard],
    // },
    {// for client
        path: ROUTES.REPORT,
        title: APP_PAGE_TITLE.REPORT,
        component: Reports,
        canActivate: [authGuard],
    },
    {
        path: ROUTES.SETTINGS.BASE,
        title: APP_PAGE_TITLE.SETTINGS.BASE,
        canActivate: [authGuard],
        loadChildren: () => import('./settings/settings.routes').then(m => m.routes)
    }
];