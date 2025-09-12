import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ROUTES } from '@src/app/constants/app.routes';
import { Toaster } from '@src/app/shared/components/toaster/toaster';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';


@Component({
  selector: 'app-admin-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    Toaster
  ],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss'
})
export class AdminLayout {

  protected readonly _coreService = inject(CoreFacadeService);

  protected readonly sidebarRoutes: { label: string, url: string }[] = [
    {
      label: ROUTES.ADMIN.WORKSPACE,
      url: ROUTES.ADMIN.getFullRoute(ROUTES.ADMIN.WORKSPACE)
    },
    {
      label: ROUTES.ADMIN.USERS,
      url: ROUTES.ADMIN.getFullRoute(ROUTES.ADMIN.USERS)
    }
  ];
  isSidebarCollapsed: boolean = false;


  protected logout(): void {
    this._coreService.utils.logout();
  }

}