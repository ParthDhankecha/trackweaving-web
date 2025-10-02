import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { ELangCode, IAppConfigData, ILanguage, IUserRoles } from '@src/app/models/utils.model';
import StorageKeys from '@src/app/constants/storage-keys';


@Injectable({
  providedIn: 'root'
})
export class AppConfig {
  // Inject Services
  private readonly translate = inject(TranslateService);


  protected readonly _supportedLangs: ILanguage[] = [
    { code: ELangCode.EN, label: 'English' },
    { code: ELangCode.HI, label: 'हिन्दी' },
    { code: ELangCode.GU, label: 'ગુજરાતી' }
  ];


  get languageList(): ILanguage[] {
    return [...this._supportedLangs];
  }
  get currentLanguage(): ILanguage {
    const currentLangCode = this.translate.getCurrentLang();
    return this.languageList.find(l => l.code === currentLangCode) || this.languageList[0];
  }


  setDefaultLanguage(): void {
    // Detect browser language
    const browserLang = navigator.language.split('-')[0]; // e.g., 'en', 'hi', 'gu'
    // Apply if supported, else fallback to 'en'
    const savedLang = sessionStorage.getItem(StorageKeys.SST.LANG);
    let initialLang = ELangCode.EN; // Default
    if (savedLang && this.languageList.some(l => l.code === savedLang)) {
      initialLang = savedLang as ELangCode;
    } else if (browserLang && this.languageList.some(l => l.code === browserLang)) {
      initialLang = browserLang as ELangCode;
    }

    this.translate.use(initialLang);
    // Add all supported languages
    this.translate.addLangs(this.languageList.map(l => l.code));
    // Set default fallback language
    this.translate.setFallbackLang(ELangCode.EN);
  }

  // For manual change (dropdown / button)
  changeLanguage(lang: string): Promise<boolean> {
    return new Promise((resolve) => {
      const loadedLang = this.translate.getCurrentLang();
      if (lang === loadedLang) {
        return resolve(false); // No need to change if the selected language is already loaded
      }
      const isLangAvailable = this.languageList.some(l => l.code === lang);
      if (!isLangAvailable) {
        lang = ELangCode.EN; // Fallback to English if the language is not supported
      }
      this.translate.use(lang);
      resolve(true);
    });
  }


  private readonly _configData: IAppConfigData = {
    publicUrl: '',
    clientUrl: '',
    roles: undefined
  };

  // getter and setter for config data
  get configData(): IAppConfigData {
    return this._configData;
  }
  set configData(data: IAppConfigData) {
    if (data && typeof data === 'object') {
      Object.assign(this._configData, data);
    }
  }

  get roles(): IUserRoles {
    return this.configData.roles!;
  }
}