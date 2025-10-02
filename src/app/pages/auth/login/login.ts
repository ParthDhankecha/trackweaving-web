import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ROUTES } from '@src/app/constants/app.routes';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { IResponse } from '@src/app/models/http-response.model';
import { EToasterType } from '@src/app/models/utils.model';
import { ApiFacadeService } from '@src/app/services/api-facade-service';


@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  constructor(
    private _coreService: CoreFacadeService,
  ) {
    if (this._coreService.utils.isAuthenticated) {
      if (this._coreService.utils.isAdmin) {
        this._router.navigateByUrl(ROUTES.HOME);
      } else {
        this._router.navigateByUrl(ROUTES.ADMIN.BASE);
      }
      return;
    }
  }

  private readonly _router = inject(Router);
  private readonly _apiFs = inject(ApiFacadeService);
  protected _fb: FormBuilder = inject(FormBuilder);

  protected loginForm: FormGroup = this._fb.group({
    phoneNo: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]]
  });
  protected isEyeOpen: boolean = false;


  get phoneNo(): AbstractControl | null {
    return this.loginForm.get('phoneNo');
  }

  get password(): AbstractControl | null {
    return this.loginForm.get('password');
  }


  protected onlyDigits(event: KeyboardEvent, inputLength: number = 10): void {
    const input = event.target as HTMLInputElement;
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'];
    if (allowedKeys.includes(event.key)) {
      return;
    }

    if (!/^\d$/.test(event.key) || input.value.length >= inputLength) {
      event.preventDefault();
    }
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
    this._apiFs.auth.login({
      // `mobile number` as a `username`
      userName: this.phoneNo?.value,
      password: this.password?.value
    }).subscribe({
      next: (res: IResponse) => {
        this.isReqAlive = false;
        if (res.code === 'OK') {
          this._router.navigateByUrl(ROUTES.BASE).then(() => {
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