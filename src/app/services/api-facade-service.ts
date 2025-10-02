import { inject, Injectable } from '@angular/core';

import { Sync } from './sync/sync';
import { Auth } from './auth/auth';
import { Workspace } from './workspace/workspace';
import { Users } from './users/users';
import { Machine } from './machine/machine';
import { ApkVersion } from './apk-version/apk-version';


@Injectable({
  providedIn: 'root'
})
export class ApiFacadeService {

  // Inject Sync service
  public readonly sync: Sync = inject(Sync);
  // Inject App service
  public readonly auth: Auth = inject(Auth);
  // Inject Workspace service
  public readonly workspace: Workspace = inject(Workspace);
  // Inject Users service
  public readonly users: Users = inject(Users);
  // Inject Machine service
  public readonly machine: Machine = inject(Machine);
  // Inject APK Version service
  public readonly apkVersion: ApkVersion = inject(ApkVersion);
}