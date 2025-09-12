import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';

import { ROUTES } from '@src/app/constants/app.routes';
import { CoreFacadeService } from '../services/core-facade-service';


export const adminRoleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router); // Inject the Router service
  const _coreService = inject(CoreFacadeService); // Inject CommonUtils service

  if (!_coreService.utils.isAuthenticated) {
    // User is not authenticated, redirect to login page
    router.navigateByUrl(ROUTES.ADMIN.BASE);
    return false;
  }
  if (!_coreService.utils.isAdmin) {
    // User is not an admin, redirect to unauthorized page or home page
    router.navigateByUrl(ROUTES.AUTH.BASE);
    return false;
  }
  return true;
};