import { Routes } from '@angular/router';

import { ROUTES } from '@src/app/constants/app.routes';
import { APP_PAGE_TITLE } from '@src/app/constants/app-config';

import { AdminLayout } from '../layouts/admin-layout/admin-layout';
import { AdminLogin } from './admin-login/admin-login';
import { Workspace } from './workspace/workspace';
import { Users } from './users/users';
import { Machine } from './machine/machine';
import { ApkVersion } from './apk-version/apk-version';

import { authGuard } from '../core/guards/auth-guard';
import { superAdminGuard } from '../core/guards/super-admin-guard';


export const routes: Routes = [
    {
        path: '',
        component: AdminLayout,
        canActivate: [authGuard, superAdminGuard],
        canActivateChild: [authGuard, superAdminGuard],
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
                path: ROUTES.ADMIN.USER,
                title: APP_PAGE_TITLE.ADMIN.USER,
                component: Users
            },
            {
                path: ROUTES.ADMIN.MACHINE,
                title: APP_PAGE_TITLE.ADMIN.MACHINE,
                component: Machine
            },
            {
                path: ROUTES.ADMIN.APK_VERSION,
                title: APP_PAGE_TITLE.ADMIN.APK_VERSION,
                component: ApkVersion
            }
        ],
    },
    {
        path: ROUTES.ADMIN.LOGIN,
        title: APP_PAGE_TITLE.ADMIN.LOGIN,
        component: AdminLogin
    },
];