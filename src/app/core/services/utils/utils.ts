import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import { AES, enc } from 'crypto-js';
import { jwtDecode } from 'jwt-decode';
import { _, TranslateService } from '@ngx-translate/core';

import StorageKeys from '@src/app/constants/storage-keys';
import { EToasterType, IToaster } from '@src/app/models/utils.model';
import { ROUTES } from '@src/app/constants/app.routes';
import { AppConfig } from '../app-config/app-config';


@Injectable({
  providedIn: 'root'
})
export class Utils {

  // Inject Services
  private readonly _translate = inject(TranslateService);
  protected readonly _router = inject(Router); // Inject the Router service
  private readonly _appConfig = inject(AppConfig);

  get encodeKey(): string {
    return `${window.screen.height}${window.screen.width}${window.screen.colorDepth}${new Date().getTime()}`;
  }

  encodeData(data: any, encodeKey: string): string {
    return AES.encrypt(JSON.stringify(data), encodeKey).toString();
  }

  decodeData(data: string, encodeKey: string): any {
    const bytes = AES.decrypt(data, encodeKey);
    return JSON.parse(bytes.toString(enc.Utf8));
  }


  private decodeTokenData: any;
  get decodeToken(): any {
    try {
      const accessToken = localStorage.getItem(StorageKeys.ACCESS_TOKEN);
      if (!this.decodeTokenData && accessToken) {
        this.decodeTokenData = jwtDecode<any>(accessToken);
      }
      return this.decodeTokenData;
    } catch (error) {
      console.log('Error while decoding', error);
      this.decodeTokenData = null;
      return;
    }
  }

  get isAuthenticated(): boolean {
    const details = this.decodeToken;
    const exp = details?.exp;
    if (exp) {
      return new Date().getTime() < exp * 1000;
    }
    if (details?.iat && (exp === null || exp === undefined)) {
      return true;
    }
    return false;
  }

  get isSuperAdmin(): boolean {
    return this._appConfig.roles && this._appConfig.roles.SUPER_ADMIN === this.decodeToken?.user?.type;
  }
  get isAdmin(): boolean {
    return this._appConfig.roles && this._appConfig.roles.ADMIN === this.decodeToken?.user?.type;
  }
  get isSubUser(): boolean {
    return this._appConfig.roles && this._appConfig.roles.SUB_USER === this.decodeToken?.user?.type;
  }

  logout(): void {
    localStorage.clear();
    const baseKey = this.isSuperAdmin ? 'ADMIN' : 'AUTH';
    this.decodeTokenData = null;
    this.clearAllToaster();
    this._router.navigateByUrl(`${ROUTES[baseKey].getFullRoute(ROUTES[baseKey].LOGIN)}`);
  }


  readonly toasters$ = new Subject<IToaster>();
  public clearToasters$ = new Subject<boolean>();
  showToaster(type: EToasterType, message: string, duration: number = 6000): void {
    this.toasters$.next({ type, message, duration });
  }

  clearAllToaster(): void {
    this.clearToasters$.next(true);
  }


  translate(key: string, interpolateParams: Object = {}): Observable<string> {
    return this._translate.get(_(key), interpolateParams);
  }
  translateStream(key: string, interpolateParams: Object = {}): Observable<string> {
    return this._translate.stream(_(key), interpolateParams);
  }
}