import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Header } from '../header/header';
import { Footer } from '../footer/footer';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import StorageKeys from '@src/app/constants/storage-keys';
import { ILanguage } from '@src/app/models/utils.model';


@Component({
  selector: 'app-main-layout',
  imports: [
    RouterOutlet,
    Header,
    Footer
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout {

  // Inject services
  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _langList = this._coreService.appConfig.languageList;
  protected selectedLang!: ILanguage;


  ngOnInit(): void {
    this.selectedLang = this._coreService.appConfig.currentLanguage;
  }

  protected onChangeLanguage(lang: ILanguage): void {
    if (lang?.code === this.selectedLang.code) {
      return; // No need to change if the selected language is already loaded
    }

    this._coreService.appConfig.changeLanguage(lang.code).then((isChanged) => {
      if (isChanged) {
        this.selectedLang = lang;
        sessionStorage.setItem(StorageKeys.SST.LANG, lang.code);
      }
    });
  }
}