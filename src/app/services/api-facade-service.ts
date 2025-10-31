import { inject, Injectable } from '@angular/core';

import { Sync } from '@app/services/sync/sync';
import { Auth } from '@app/services/auth/auth';
import { Dashboard } from '@app/services/dashboard/dashboard';
import { Workspace } from '@app/services/workspace/workspace';
import { Users } from '@app/services/users/users';
import { Machine } from '@app/services/machine/machine';
import { ApkVersion } from '@app/services/apk-version/apk-version';
import { MachineGroup } from './machine-group/machine-group';


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
  // Inject Workspace service
  public readonly workspace: Workspace = inject(Workspace);
  // Inject Users service
  public readonly users: Users = inject(Users);
  // Inject Machine service
  public readonly machine: Machine = inject(Machine);
  // Inject Machine Group service
  public readonly machineGroup: MachineGroup = inject(MachineGroup);
  // Inject APK Version service
  public readonly apkVersion: ApkVersion = inject(ApkVersion);
}