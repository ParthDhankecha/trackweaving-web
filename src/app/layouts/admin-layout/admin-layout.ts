import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ROUTES } from '@src/app/constants/app.routes';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';


@Component({
  selector: 'app-admin-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss'
})
export class AdminLayout {

  // Inject services
  protected readonly _coreService = inject(CoreFacadeService);


  protected readonly sidebarRoutes: { label: string, link: string, icon: string }[] = [
    {
      label: ROUTES.ADMIN.WORKSPACE,
      link: ROUTES.ADMIN.getFullRoute(ROUTES.ADMIN.WORKSPACE),
      icon: 'workspace'
    },
    {
      label: ROUTES.ADMIN.USER,
      link: ROUTES.ADMIN.getFullRoute(ROUTES.ADMIN.USER),
      icon: 'users'
    },
    {
      label: ROUTES.ADMIN.MACHINE,
      link: ROUTES.ADMIN.getFullRoute(ROUTES.ADMIN.MACHINE),
      icon: 'machine'
    },
    {
      label: 'APK Version',
      link: ROUTES.ADMIN.getFullRoute(ROUTES.ADMIN.APK_VERSION),
      icon: 'apk'
    }
  ];
  isSidebarCollapsed: boolean = false;


  protected logout(): void {
    this._coreService.utils.logout();
  }
}