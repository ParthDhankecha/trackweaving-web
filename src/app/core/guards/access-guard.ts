import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';

import { ROUTES } from '@src/app/constants/app.routes';
import { AccessModule } from '@src/app/models/utils.model';
import { CoreFacadeService } from '../services/core-facade-service';


/**
 * Route data: { accessModules: AccessModule[] }
 */
export const accessGuard: CanActivateFn = (route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) => {
  const router = inject(Router);
  const _coreService = inject(CoreFacadeService);

  const modules = (route.data?.['accessModules'] as AccessModule[]) || ['default'];
  if (modules.some(m => _coreService.utils.can(m, 'read'))) {
    return true;
  }

  router.navigateByUrl(`/${ROUTES.AUTH.BASE}`);
  return false;
};