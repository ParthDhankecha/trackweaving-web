import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';

import { ROUTES } from '@src/app/constants/app.routes';
import { CoreFacadeService } from '../services/core-facade-service';


export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router); // Inject the Router service
  const _coreService = inject(CoreFacadeService); // Inject CommonUtils service

  if (!_coreService.utils.isAuthenticated) {
    // User is not authenticated, redirect to login page
    const isAdminRoute = state.url.startsWith(`/${ROUTES.ADMIN.BASE}`);
    router.navigateByUrl(isAdminRoute ? ROUTES.ADMIN.getFullRoute(ROUTES.ADMIN.LOGIN) : ROUTES.AUTH.BASE);
    return false;
  }

  // User is authenticated, allow access
  return true;
};