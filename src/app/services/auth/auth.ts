import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

import moment from 'moment';

import { HttpClient } from '../http-client/http-client';
import { IResponse } from '@src/app/models/http-response.model';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import StorageKeys from '@src/app/constants/storage-keys';


@Injectable({
  providedIn: 'root'
})
export class Auth {

  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _baseUrl: string = 'auth';

  private readonly _coreService = inject(CoreFacadeService);
  protected readonly encodeKey = this._coreService.utils.encodeKey;



  login(payload: { userName: string, password: string }): Observable<IResponse> {
    const body = {
      data: this._coreService.utils.encodeData(payload, this.encodeKey),
      date: this.encodeKey
    };
    return this._http.post(`${this._baseUrl}/sign-in`, body).pipe(
      tap((res: any) => {
        this.setSession(res);
      }),
    );
  }

  adminLogin(payload: { email: string, password: string }): Observable<IResponse> {
    const body = {
      data: this._coreService.utils.encodeData(payload, this.encodeKey),
      date: this.encodeKey
    };
    return this._http.post(`admin/${this._baseUrl}/sign-in`, body).pipe(
      tap((res: any) => {
        this.setSession(res);
      }),
    );
  }

  loginWithPhone(mobile: string): Observable<IResponse> {
    return this._http.post(`${this._baseUrl}/sign-in-with-mobile`, { mobile: mobile });
  }

  verifyMobileOtp(mobile: string, otp: string): Observable<IResponse> {
    const payload = {
      data: this._coreService.utils.encodeData({ mobile: mobile, otp: otp }, this.encodeKey),
      date: this.encodeKey
    };
    return this._http.post(`${this._baseUrl}/verify-mobile-otp`, payload).pipe(
      tap((res: any) => {
        this.setSession(res);
      }),
    );
  }


  protected setSession(resObj: any): void {
    if (!['OK', 'CREATED'].includes(resObj?.code)) return;

    localStorage.setItem(StorageKeys.ACCESS_TOKEN, resObj.data.token.accessToken);

    const expiresIn = resObj.data.token.expiresIn * 1000;
    const expiresAt = moment().valueOf() + expiresIn;
    localStorage.setItem(StorageKeys.ACCESS_TOKEN_EXPIRES_AT, `${expiresAt}`);

    const userDetails = {
      ...resObj.data.user
    };
    localStorage.setItem(StorageKeys.USER_INFO, JSON.stringify(userDetails));
  }
}