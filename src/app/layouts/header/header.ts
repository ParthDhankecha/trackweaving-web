import { Component, ElementRef, inject, Input, ViewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ISettingsMenu } from '@src/app/models/utils.model';
import { ROUTES } from '@src/app/constants/app.routes';


@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    RouterLinkActive,
    NgTemplateOutlet
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  // Inject services
  protected readonly _coreService = inject(CoreFacadeService);
  private readonly _router = inject(Router);

  @Input('containerClass') containerClass: string = '';
  @Input('loadFor') loadFor: string = '';
  @Input() manufacturerWorkspaceId: string = '';


  protected readonly _appRoutes = ROUTES;
  protected readonly manufacturerReportLink = ROUTES.MANUFACTURER.getFullRoute(ROUTES.MANUFACTURER.REPORT);


  ngOnInit(): void { }


  // machine group, machine configure, maintenance category, maintenance entry, shift wise comment update
  // parts change entry, users, privacy policy, terms & conditions
  private readonly _allSettingsMenu: ISettingsMenu[] = [
    {
      id: 'machineGroup', icon: 'gearGroup', label: "Machine Group",
      link: ROUTES.SETTINGS.getFullRoute(ROUTES.SETTINGS.MACHINE_GROUP),
      accessModule: 'machine_group'
    },
    {
      id: 'machineConfigure', icon: 'machineConfig', label: "Machine Configure",
      link: ROUTES.SETTINGS.getFullRoute(ROUTES.SETTINGS.MACHINE_CONFIGURE),
      accessModule: 'machine_configure'
    },
    {
      id: 'maintenanceCategory', icon: 'list', label: "Maintenance Category",
      link: ROUTES.SETTINGS.getFullRoute(ROUTES.SETTINGS.MAINTENANCE_CATEGORY),
      accessModule: 'maintenance_category'
    },
    {
      id: 'maintenanceEntry', icon: 'listPlus', label: "Maintenance Entry",
      link: ROUTES.SETTINGS.getFullRoute(ROUTES.SETTINGS.MAINTENANCE_ENTRY),
      accessModule: 'maintenance_entry'
    },
    {
      id: 'shiftWiseCommentUpdate', icon: 'comment', label: "Shift Wise Comment Update",
      link: ROUTES.SETTINGS.getFullRoute(ROUTES.SETTINGS.SHIFT_WISE_COMMENT_UPDATE),
      accessModule: 'shift_wise_comment'
    },
    {
      id: 'partsChangeEntry', icon: 'tools', label: "Parts Change Entry",
      link: ROUTES.SETTINGS.getFullRoute(ROUTES.SETTINGS.PARTS_CHANGE_ENTRY),
      accessModule: 'part_change_entry'
    },
    {
      id: 'alertConfig', icon: 'alert', label: "Alert Configuration",
      link: ROUTES.SETTINGS.getFullRoute(ROUTES.SETTINGS.ALERT_CONFIG),
      accessModule: 'alert_config'
    },
    {
      id: 'users', icon: 'users', label: "Manage Users",
      link: ROUTES.SETTINGS.getFullRoute(ROUTES.SETTINGS.USERS),
      accessModule: 'user'
    },
    {
      id: 'operators', icon: 'users', label: "Manage Operators",
      link: ROUTES.SETTINGS.getFullRoute(ROUTES.SETTINGS.OPERATORS),
      accessModule: 'operator'
    },
    {
      id: 'privacyPolicy', icon: 'pp', label: "Privacy Policy", link: `/${ROUTES.PRIVACY_POLICY}`
    },
    {
      id: 'termsConditions', icon: 't&c', label: "Terms & Conditions", link: `/${ROUTES.TERMS_AND_CONDITIONS}`
    }
  ];


  protected get settingsMenu(): ISettingsMenu[] {
    return this._allSettingsMenu.filter((menu) => {
      if (!menu.accessModule) return true;
      return this._coreService.utils.can(menu.accessModule, 'read');
    });
  }

  protected get canViewReports(): boolean {
    return this._coreService.utils.can('report', 'read');
  }


  @ViewChild('logoutModalContent') logoutModalContentRef!: ElementRef;
  protected onLogoutConfirmationModalContainer(event: Event): void {
    event.stopPropagation();
    if (this.logoutModalContentRef?.nativeElement && !this.logoutModalContentRef?.nativeElement.contains(event.target)) {
      this.closeOrCancelLogoutModal();
    }
  }


  get showDashboardComponentContent(): boolean {
    return this.loadFor === 'dashboard';
  }


  protected isLogoutConfirmationModalOpen: boolean = false;
  protected onLogout(): void {
    this.isLogoutConfirmationModalOpen = true;
  }

  protected onconfirmLogout(): void {
    this.isLogoutConfirmationModalOpen = false;
    this._coreService.utils.logout();
  }

  protected closeOrCancelLogoutModal(): void {
    this.isLogoutConfirmationModalOpen = false;
  }

  protected navigateManufacturerReport(): void {
    this._router.navigate([this.manufacturerReportLink], {
      state: this.manufacturerWorkspaceId ? { workspaceId: this.manufacturerWorkspaceId } : undefined
    });
  }
}