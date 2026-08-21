import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';

import { ROUTES } from '@src/app/constants/app.routes';
import { AccessModule } from '@src/app/models/utils.model';
import { CoreFacadeService } from '../services/core-facade-service';


/**
 * Route data: { accessModule: AccessModule }
 */
export const accessGuard: CanActivateFn = (route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) => {
  const router = inject(Router);
  const _coreService = inject(CoreFacadeService);

  const module = (route.data?.['accessModule'] as AccessModule) || 'default';
  if (_coreService.utils.can(module)) {
    return true;
  }

  router.navigateByUrl(`/${ROUTES.AUTH.BASE}`);
  return false;
};