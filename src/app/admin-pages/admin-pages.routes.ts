import { Routes } from '@angular/router';

import { ROUTES } from '@src/app/constants/app.routes';
import { APP_PAGE_TITLE } from '@src/app/constants/app-config';

import { AdminLayout } from '../layouts/admin-layout/admin-layout';
import { AdminLogin } from './admin-login/admin-login';
import { Workspace } from './workspace/workspace';
import { Users } from './users/users';

import { authGuard } from '../core/guards/auth-guard';
import { adminRoleGuard } from '../core/guards/admin-role-guard';


export const routes: Routes = [
    {
        path: '',
        component: AdminLayout,
        canActivate: [authGuard, adminRoleGuard],
        canActivateChild: [authGuard, adminRoleGuard],
        children: [
            {
                path: ROUTES.BASE,
                redirectTo: ROUTES.ADMIN.WORKSPACE,
                pathMatch: 'full'
            },
            {
                path: ROUTES.ADMIN.WORKSPACE,
                title: APP_PAGE_TITLE.ADMIN.WORKSPACE,
                component: Workspace
            },
            {
                path: ROUTES.ADMIN.USERS,
                title: APP_PAGE_TITLE.ADMIN.USERS,
                component: Users
            }
        ],
    },
    {
        path: ROUTES.ADMIN.LOGIN,
        title: APP_PAGE_TITLE.ADMIN.LOGIN,
        component: AdminLogin
    },
];