import { Routes } from '@angular/router';

import { ROUTES } from '@src/app/constants/app.routes';
import { APP_PAGE_TITLE } from '@src/app/constants/app-config';

import { MachineGroup } from './components/machine-group/machine-group';
import { MachineConfigure } from './components/machine-configure/machine-configure';
import { MaintenanceCategory } from './components/maintenance-category/maintenance-category';
import { MaintenanceEntry } from './components/maintenance-entry/maintenance-entry';
import { ShiftWiseComments } from './components/shift-wise-comments/shift-wise-comments';
import { PartsChangeEntry } from './components/parts-change-entry/parts-change-entry';
import { Users } from './components/users/users';
import { PageNotFound } from '@src/app/shared/components/page-not-found/page-not-found';

import { accessGuard } from '@src/app/core/guards/access-guard';


export const routes: Routes = [
    {
        path: ROUTES.SETTINGS.MACHINE_GROUP,
        title: APP_PAGE_TITLE.SETTINGS.MACHINE_GROUP,
        component: MachineGroup,
        canActivate: [accessGuard],
        data: { accessModules: ['machine_group'] }
    },
    {
        path: ROUTES.SETTINGS.MACHINE_CONFIGURE,
        title: APP_PAGE_TITLE.SETTINGS.MACHINE_CONFIGURE,
        component: MachineConfigure,
        canActivate: [accessGuard],
        data: { accessModules: ['machine_configure'] }
    },
    {
        path: ROUTES.SETTINGS.MAINTENANCE_CATEGORY,
        title: APP_PAGE_TITLE.SETTINGS.MAINTENANCE_CATEGORY,
        component: MaintenanceCategory,
        canActivate: [accessGuard],
        data: { accessModules: ['maintenance_category'] }
    },
    {
        path: ROUTES.SETTINGS.MAINTENANCE_ENTRY,
        title: APP_PAGE_TITLE.SETTINGS.MAINTENANCE_ENTRY,
        component: MaintenanceEntry,
        canActivate: [accessGuard],
        data: { accessModules: ['maintenance_entry', 'maintenance_history'] }
    },
    {
        path: ROUTES.SETTINGS.SHIFT_WISE_COMMENT_UPDATE,
        title: APP_PAGE_TITLE.SETTINGS.SHIFT_WISE_COMMENT_UPDATE,
        component: ShiftWiseComments,
        canActivate: [accessGuard],
        data: { accessModules: ['shift_wise_comment'] }
    },
    {
        path: ROUTES.SETTINGS.PARTS_CHANGE_ENTRY,
        title: APP_PAGE_TITLE.SETTINGS.PARTS_CHANGE_ENTRY,
        component: PartsChangeEntry,
        canActivate: [accessGuard],
        data: { accessModules: ['part_change_entry'] }
    },
    {
        path: ROUTES.SETTINGS.USERS,
        title: APP_PAGE_TITLE.SETTINGS.USERS,
        component: Users,
        canActivate: [accessGuard],
        data: { accessModules: ['user'] }
    },
    {
        path: ROUTES.PAGE_NOT_FOUND,
        title: APP_PAGE_TITLE.PAGE_NOT_FOUND,
        component: PageNotFound
    }
];