import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';

import { IResponse } from '@src/app/models/http-response.model';
import { AccessAction, AccessModule, EToasterType, IUserAccess } from '@src/app/models/utils.model';


/** Column order in the table. Unknown actions from the API are appended. */
const ACTION_ORDER: AccessAction[] = ['read', 'create', 'update', 'delete'];


@Component({
  selector: 'app-user-access',
  imports: [],
  templateUrl: './user-access.html',
  styleUrl: './user-access.scss'
})
export class UserAccess implements OnInit {

  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);

  @Input('userData') userData: any = null;
  @Output('closeOrCancel') closeOrCancel: EventEmitter<void> = new EventEmitter<void>();
  @Output('saved') saved: EventEmitter<any> = new EventEmitter<any>();

  /** Table rows (modules) and columns (actions). */
  protected accessModules: { key: AccessModule; label: string }[] = [];
  protected accessActions: { key: AccessAction; label: string }[] = [];
  /** Allowed actions per module, from the access-matrix API. */
  private allowedByModule: Partial<Record<AccessModule, AccessAction[]>> = {};
  /** Granted actions per module — this is what we save. */
  protected accessValue: IUserAccess = {};

  protected isReqAlive: boolean = false;
  protected isMatrixLoaded: boolean = false;


  ngOnInit(): void {
    this._apiFs.users.getAccessMatrix().subscribe({
      next: (res: IResponse) => {
        if (res.code !== 'OK') return;
        this.setMatrix(res.data?.moduleWiseAccess);
        this.accessValue = this.toAccessValue(this.userData?.access);
        this.isMatrixLoaded = true;
      },
    });
  }


  // --- matrix (what can be granted) ---

  private setMatrix(moduleWiseAccess: Record<string, string[]> | null | undefined): void {
    const matrix = moduleWiseAccess ?? {};
    this.allowedByModule = {};
    this.accessModules = Object.entries(matrix).map(([key, actions]) => {
      const module = key as AccessModule;
      this.allowedByModule[module] = (actions || []) as AccessAction[];
      return { key: module, label: this.label(key) };
    });

    const used = new Set(Object.values(this.allowedByModule).flat());
    this.accessActions = [
      ...ACTION_ORDER.filter((action) => used.has(action)),
      ...[...used].filter((action) => !ACTION_ORDER.includes(action)),
    ].map((key) => ({ key, label: this.label(key) }));
  }

  private allowed(module: AccessModule): AccessAction[] {
    return this.allowedByModule[module] || [];
  }

  private label(key: string): string {
    return key.replaceAll('_', ' ');
  }


  // --- grants (what this user currently has) ---

  /** null access = never configured → start with everything allowed. */
  private toAccessValue(saved: IUserAccess | null | undefined): IUserAccess {
    const access: IUserAccess = {};
    for (const mod of this.accessModules) {
      const allowed = this.allowed(mod.key);
      access[mod.key] = saved == null ? [...allowed] : allowed.filter((action) => saved[mod.key]?.includes(action));
    }
    return access;
  }

  private grant(module: AccessModule, actions: AccessAction[]): void {
    this.accessValue = { ...this.accessValue, [module]: actions };
  }


  // --- template ---

  protected moduleHasAction(module: AccessModule, action: AccessAction): boolean {
    return this.allowed(module).includes(action);
  }

  protected isAccessChecked(module: AccessModule, action: AccessAction): boolean {
    return this.accessValue[module]?.includes(action) ?? false;
  }

  protected allowedCount(module: AccessModule): number {
    return this.allowed(module).length;
  }

  protected grantedCount(module: AccessModule): number {
    return this.accessValue[module]?.length ?? 0;
  }

  protected isModuleAllChecked(module: AccessModule): boolean {
    const total = this.allowedCount(module);
    return total > 0 && this.grantedCount(module) === total;
  }

  protected isModuleAllIndeterminate(module: AccessModule): boolean {
    const granted = this.grantedCount(module);
    return granted > 0 && granted < this.allowedCount(module);
  }

  protected onToggleAccess(module: AccessModule, action: AccessAction, event: Event): void {
    const on = (event.target as HTMLInputElement).checked;
    const next = new Set(this.accessValue[module] || []);
    if (on) next.add(action);
    else next.delete(action);
    this.grant(module, this.allowed(module).filter((a) => next.has(a)));
  }

  protected onToggleModuleAll(module: AccessModule, event: Event): void {
    const on = (event.target as HTMLInputElement).checked;
    this.grant(module, on ? [...this.allowed(module)] : []);
  }


  protected onSubmit(): void {
    if (this.isReqAlive || !this.userData?._id) return;

    this.isReqAlive = true;
    this._apiFs.users.update(this.userData._id, { access: this.accessValue }).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this._coreService.utils.showToaster(EToasterType.Success, 'Access updated successfully.');
          this.saved.emit(res.data);
        }
      },
      error: (err) => {
        this.isReqAlive = false;
        const msg = err?.error?.message || 'Something went wrong, please try again later.';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }

  protected onCloseOrCancel(): void {
    this.closeOrCancel.emit();
  }
}