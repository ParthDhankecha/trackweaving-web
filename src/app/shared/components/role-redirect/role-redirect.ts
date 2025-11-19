import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { ROUTES } from '@src/app/constants/app.routes';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';


@Component({
  selector: 'app-role-redirect',
  imports: [],
  templateUrl: './role-redirect.html',
  styleUrl: './role-redirect.scss'
})
export class RoleRedirect {
  constructor(
    private router: Router, // Inject the Router service
    private _coreService: CoreFacadeService, // Inject CommonUtils service
  ) {
    if (!_coreService.utils.isSuperAdmin) {
      if (_coreService.utils.isAdmin || _coreService.utils.isMaster) {
        // navigate to admin dashboard
        router.navigateByUrl(`/${ROUTES.DASHBOARD}`);
        return;
      }
    }
  }
}