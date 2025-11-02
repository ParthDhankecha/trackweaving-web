import { Component, ElementRef, inject, Input, ViewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

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

  @Input('containerClass') containerClass: string = '';
  @Input('loadFor') loadFor: string = '';


  ngOnInit(): void { }


  // machine group, machine configure, maintenance category, maintenance entry, shift wise comment update
  // parts change entry, users, privacy policy, terms & conditions
  protected readonly settingsMenu: ISettingsMenu[] = [
    {
      id: 'machineGroup', icon: 'gearGroup', label: "Machine Group", link: ROUTES.SETTINGS.getFullRoute(ROUTES.SETTINGS.MACHINE_GROUP)
    },
    {
      id: 'machineConfigure', icon: 'machineConfig', label: "Machine Configure", link: ROUTES.SETTINGS.getFullRoute(ROUTES.SETTINGS.MACHINE_CONFIGURE)
    },
    {
      id: 'maintenanceCategory', icon: 'list', label: "Maintenance Category", link: ROUTES.SETTINGS.getFullRoute(ROUTES.SETTINGS.MAINTENANCE_CATEGORY)
    },
    {
      id: 'maintenanceEntry', icon: 'listPlus', label: "Maintenance Entry", link: ROUTES.SETTINGS.getFullRoute(ROUTES.SETTINGS.MAINTENANCE_ENTRY)
    },
    {
      id: 'shiftWiseCommentUpdate', icon: 'comment', label: "Shift Wise Comment Update", link: ``
    },
    {
      id: 'partsChangeEntry', icon: 'tools', label: "Parts Change Entry", link: ``
    },
    {
      id: 'users', icon: 'users', label: "Users", link: ``
    },
    {
      id: 'privacyPolicy', icon: 'pp', label: "Privacy Policy", link: ROUTES.PRIVACY_POLICY
    },
    {
      id: 'termsConditions', icon: 't&c', label: "Terms & Conditions", link: ROUTES.TERMS_AND_CONDITIONS
    }
  ];


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
}