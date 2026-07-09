import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { ROUTES } from '@src/app/constants/app.routes';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';


@Component({
  selector: 'app-manufacturer-login',
  imports: [ReactiveFormsModule],
  templateUrl: './manufacturer-login.html',
  styleUrl: './manufacturer-login.scss'
})
export class ManufacturerLogin {

  private readonly _router = inject(Router);
  private readonly _apiFs = inject(ApiFacadeService);
  private readonly _coreService = inject(CoreFacadeService);
  protected readonly _fb = inject(FormBuilder);

  constructor() {
    if (this._coreService.utils.isManufacturerAuthenticated) {
      this._router.navigateByUrl(ROUTES.MANUFACTURER.getFullRoute(ROUTES.MANUFACTURER.OVERVIEW));
    }
  }

  protected loginForm: FormGroup = this._fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });
  protected isEyeOpen = false;
  protected isReqAlive = false;

  get email():    AbstractControl | null { return this.loginForm.get('email'); }
  get password(): AbstractControl | null { return this.loginForm.get('password'); }


  protected onSubmit(): void {
    if (this.isReqAlive) return;
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isReqAlive = true;
    this._apiFs.manufacturerPortal.signIn(this.loginForm.value).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this._router.navigateByUrl(ROUTES.MANUFACTURER.getFullRoute(ROUTES.MANUFACTURER.OVERVIEW)).then(() => {
            this._coreService.utils.showToaster(EToasterType.Success, 'Welcome!');
          });
        }
      },
      error: (err: any) => {
        this.isReqAlive = false;
        this._coreService.utils.showToaster(EToasterType.Danger, err?.error?.message || 'Login failed.');
      }
    });
  }
}
