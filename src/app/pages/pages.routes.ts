import { Routes } from '@angular/router';

import { ROUTES } from '@src/app/constants/app.routes';
import { APP_PAGE_TITLE } from '@src/app/constants/app-config';

import { authGuard } from '../core/guards/auth-guard';

import { Dashboard } from './dashboard/dashboard';
import { adminRoleGuard } from '../core/guards/admin-role-guard';
import { RoleRedirect } from '../shared/components/role-redirect/role-redirect';


export const routes: Routes = [
    {
        path: '',
        // redirectTo: ROUTES.DASHBOARD,
        pathMatch: 'full',
        component: RoleRedirect// It will handle the redirection based on role
    },
    {
        path: ROUTES.DASHBOARD,
        title: APP_PAGE_TITLE.DASHBOARD,
        component: Dashboard,
        canActivate: [authGuard, adminRoleGuard],
    },
    {
        path: 'dev',
        title: APP_PAGE_TITLE.DASHBOARD,
        component: Dashboard,
        canActivate: [authGuard, adminRoleGuard],
    }
];