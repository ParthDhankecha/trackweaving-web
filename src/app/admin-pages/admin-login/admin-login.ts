import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { Toaster } from '@src/app/shared/components/toaster/toaster';

import { ROUTES } from '@src/app/constants/app.routes';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';


@Component({
  selector: 'app-admin-login',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    Toaster
  ],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.scss'
})
export class AdminLogin {
  constructor(
    private _coreService: CoreFacadeService,
  ) {
    if (this._coreService.utils.isAuthenticated) {
      this._router.navigateByUrl(ROUTES.HOME);
      return;
    }
  }

  private readonly _router = inject(Router);
  private readonly _apiFs = inject(ApiFacadeService);
  protected _fb: FormBuilder = inject(FormBuilder);

  protected loginForm: FormGroup = this._fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]]
  });
  protected isEyeOpen: boolean = false;


  get email(): AbstractControl | null {
    return this.loginForm.get('email');
  }

  get password(): AbstractControl | null {
    return this.loginForm.get('password');
  }


  protected isReqAlive: boolean = false;
  protected onSubmit(): void {
    if (this.isReqAlive) {
      return;
    }
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isReqAlive = true;
    this._apiFs.auth.adminLogin({
      email: this.email?.value,
      password: this.password?.value
    }).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this._router.navigateByUrl(ROUTES.ADMIN.BASE).then(() => {
            this._coreService.utils.showToaster(EToasterType.Success, res.message || 'Login successful');
          });
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        console.error('Login with phone error', err);
        const msg = err?.error?.message || 'Something went wrong. Please try again later';
        this._coreService.utils.showToaster(EToasterType.Danger, msg);
      }
    });
  }
}