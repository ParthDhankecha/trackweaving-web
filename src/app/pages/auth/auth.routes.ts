import { Routes } from '@angular/router';

import { ROUTES } from '@src/app/constants/app.routes';
import { APP_PAGE_TITLE } from '@src/app/constants/app-config';

import { Login } from './login/login';
import { PageNotFound } from '@src/app/shared/components/page-not-found/page-not-found';


export const routes: Routes = [
    {
        path: '',
        redirectTo: ROUTES.AUTH.LOGIN,
        pathMatch: 'full'
    },
    {
        path: ROUTES.AUTH.LOGIN,
        title: APP_PAGE_TITLE.AUTH.LOGIN,
        component: Login
    },
    {
        path: ROUTES.PAGE_NOT_FOUND,
        title: APP_PAGE_TITLE.PAGE_NOT_FOUND,
        component: PageNotFound
    }
];