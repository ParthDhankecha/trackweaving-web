import { Routes } from '@angular/router';

import { ROUTES } from '@src/app/constants/app.routes';
import { APP_PAGE_TITLE } from '@src/app/constants/app-config';

import { MachineGroup } from './components/machine-group/machine-group';
import { MachineConfigure } from './components/machine-configure/machine-configure';
import { MaintenanceCategory } from './components/maintenance-category/maintenance-category';
import { MaintenanceEntry } from './components/maintenance-entry/maintenance-entry';
import { PageNotFound } from '@src/app/shared/components/page-not-found/page-not-found';


export const routes: Routes = [
    {
        path: ROUTES.SETTINGS.MACHINE_GROUP,
        title: APP_PAGE_TITLE.SETTINGS.MACHINE_GROUP,
        component: MachineGroup
    },
    {
        path: ROUTES.SETTINGS.MACHINE_CONFIGURE,
        title: APP_PAGE_TITLE.SETTINGS.MACHINE_CONFIGURE,
        component: MachineConfigure
    },
    {
        path: ROUTES.SETTINGS.MAINTENANCE_CATEGORY,
        title: APP_PAGE_TITLE.SETTINGS.MAINTENANCE_CATEGORY,
        component: MaintenanceCategory
    },
    {
        path: ROUTES.SETTINGS.MAINTENANCE_ENTRY,
        title: APP_PAGE_TITLE.SETTINGS.MAINTENANCE_ENTRY,
        component: MaintenanceEntry
    },
    {
        path: ROUTES.PAGE_NOT_FOUND,
        title: APP_PAGE_TITLE.PAGE_NOT_FOUND,
        component: PageNotFound
    }
];