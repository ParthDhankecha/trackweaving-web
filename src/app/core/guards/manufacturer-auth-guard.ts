import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';

import { ROUTES } from '@src/app/constants/app.routes';
import { CoreFacadeService } from '../services/core-facade-service';


export const manufacturerAuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const _coreService = inject(CoreFacadeService);

  if (!_coreService.utils.isManufacturerAuthenticated) {
    router.navigateByUrl(ROUTES.MANUFACTURER.getFullRoute(ROUTES.MANUFACTURER.LOGIN));
    return false;
  }
  return true;
};

export const manufacturerLoginGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const _coreService = inject(CoreFacadeService);

  if (_coreService.utils.isManufacturerAuthenticated) {
    router.navigateByUrl(ROUTES.MANUFACTURER.getFullRoute(ROUTES.MANUFACTURER.OVERVIEW));
    return false;
  }
  return true;
};
