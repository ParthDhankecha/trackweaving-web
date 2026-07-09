import { Routes } from '@angular/router';

import { ROUTES } from '@src/app/constants/app.routes';
import { APP_PAGE_TITLE } from '@src/app/constants/app-config';

import { ManufacturerLayout } from '../layouts/manufacturer-layout/manufacturer-layout';
import { ManufacturerLogin } from './manufacturer-login/manufacturer-login';
import { ManufacturerOverview } from './overview/overview';
import { ManufacturerMachines } from './machines/machines';
import { ManufacturerAnalytics } from './analytics/analytics';

import { manufacturerAuthGuard, manufacturerLoginGuard } from '../core/guards/manufacturer-auth-guard';


export const routes: Routes = [
    {
        path: '',
        component: ManufacturerLayout,
        canActivate: [manufacturerAuthGuard],
        canActivateChild: [manufacturerAuthGuard],
        children: [
            {
                path: '',
                redirectTo: ROUTES.MANUFACTURER.OVERVIEW,
                pathMatch: 'full'
            },
            {
                path: ROUTES.MANUFACTURER.OVERVIEW,
                title: APP_PAGE_TITLE.MANUFACTURER.OVERVIEW,
                component: ManufacturerOverview
            },
            {
                path: ROUTES.MANUFACTURER.MACHINES,
                title: APP_PAGE_TITLE.MANUFACTURER.MACHINES,
                component: ManufacturerMachines
            },
            {
                path: ROUTES.MANUFACTURER.ANALYTICS,
                title: APP_PAGE_TITLE.MANUFACTURER.ANALYTICS,
                component: ManufacturerAnalytics
            }
        ]
    },
    {
        path: ROUTES.MANUFACTURER.LOGIN,
        title: APP_PAGE_TITLE.MANUFACTURER.LOGIN,
        component: ManufacturerLogin,
        canActivate: [manufacturerLoginGuard]
    }
];
