// Enum for language codes
export enum ELangCode {
    EN = 'en',
    HI = 'hi',
    GU = 'gu'
};
export interface ILanguage {
    code: ELangCode;
    label: string;
}

export interface IUserRoles {
    SUPER_ADMIN: number;
    ADMIN: number;
    SUB_USER: number;
}

export interface IAppConfigData {
    publicUrl: string;
    clientUrl: string;
    roles?: IUserRoles;
    efficiencyAveragePer: number;
    efficiencyGoodPer: number;
    refreshInterval: number;
}
// Enum for Toaster types
export enum EToasterType {
    Info = 'info',
    Success = 'success',
    Warning = 'warning',
    Danger = 'danger',
}

// Interface for a Toaster
export interface IToaster {
    type: EToasterType; // Use the enum here
    message: string;
    duration?: number;
}


export interface IModalLayer {
    id: string
    open: boolean
}



export interface ISettingsMenu {
    id: string,
    icon: string,
    label: string,
    link: string,
}