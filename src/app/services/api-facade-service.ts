import { inject, Injectable } from '@angular/core';

import { Sync } from '@app/services/sync/sync';
import { Auth } from '@app/services/auth/auth';
import { Dashboard } from '@app/services/dashboard/dashboard';
import { Workspace } from '@app/services/workspace/workspace';
import { Users } from '@app/services/users/users';
import { Machine } from '@app/services/machine/machine';
import { ApkVersion } from '@app/services/apk-version/apk-version';
import { MachineGroup } from './machine-group/machine-group';
import { MachineConfigure } from './machine-configure/machine-configure';
import { MaintenanceCategory } from './maintenance-category/maintenance-category';
import { MaintenanceEntry } from './maintenance-entry/maintenance-entry';
import { PartsChangeEntry } from './parts-change-entry/parts-change-entry';
import { ShiftWiseComments } from './shift-wise-comments/shift-wise-comments';
import { Reports } from './reports/reports';


@Injectable({
  providedIn: 'root'
})
export class ApiFacadeService {

  // Inject Sync service
  public readonly sync: Sync = inject(Sync);
  // Inject App service
  public readonly auth: Auth = inject(Auth);
  // Inject Dashboard service
  public readonly dashboard: Dashboard = inject(Dashboard);
  // Inject Reports service
  public readonly reports: Reports = inject(Reports);
  // Inject Workspace service
  public readonly workspace: Workspace = inject(Workspace);
  // Inject Users service
  public readonly users: Users = inject(Users);
  // Inject Machine service
  public readonly machine: Machine = inject(Machine);
  // Inject Machine Configure service
  public readonly machineConfigure: MachineConfigure = inject(MachineConfigure);
  // Inject Machine Group service
  public readonly machineGroup: MachineGroup = inject(MachineGroup);
  // Inject APK Version service
  public readonly apkVersion: ApkVersion = inject(ApkVersion);
  // Inject Maintenance Category service
  public readonly maintenanceCategory: MaintenanceCategory = inject(MaintenanceCategory);
  // Inject Maintenance Entry service
  public readonly maintenanceEntry: MaintenanceEntry = inject(MaintenanceEntry);
  // Inject Shift Wise Comments service
  public readonly shiftWiseComments: ShiftWiseComments = inject(ShiftWiseComments);
  // Inject Parts Change Entry service
  public readonly partsChangeEntry: PartsChangeEntry = inject(PartsChangeEntry);
}