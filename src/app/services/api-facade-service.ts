import { inject, Injectable } from '@angular/core';

import { Auth } from './auth/auth';
import { Workspace } from './workspace/workspace';
import { Users } from './users/users';
import { Machine } from './machine/machine';


@Injectable({
  providedIn: 'root'
})
export class ApiFacadeService {

  // Inject App service
  public readonly auth: Auth = inject(Auth);
  // Inject Workspace service
  public readonly workspace: Workspace = inject(Workspace);
  // Inject Users service
  public readonly users: Users = inject(Users);
  // Inject Machine service
  public readonly machine: Machine = inject(Machine);
}