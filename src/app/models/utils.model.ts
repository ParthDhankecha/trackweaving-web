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


export type AccessAction = 'create' | 'read' | 'update' | 'delete' | 'export' | 'history';

export type AccessModule =
    | 'default'
    | 'machine_group'
    | 'machine_configure'
    | 'maintenance_category'
    | 'maintenance_entry'
    | 'shift_wise_comment'
    | 'part_change_entry'
    | 'user'
    | 'report';

export type IUserAccess = Partial<Record<AccessModule, AccessAction[]>>;

export interface IUserRoles {
    SUPER_ADMIN: number;
    ADMIN: number;
    MASTER: number;
}

export interface IUserTypeOption {
    value: number;
    label: string;
}

export interface IAppConfigData {
    publicUrl: string;
    clientUrl: string;
    roles?: IUserRoles;
    userTypeOptions?: IUserTypeOption[];
    access?: IUserAccess;
    isOwner?: boolean;
    efficiencyAveragePer: number;
    efficiencyGoodPer: number;
    beamLeftMin: number;
    refreshInterval: number;
    currencySymbol?: string;
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
    /** Module key used for access checks; omit for always-visible items */
    accessModule?: AccessModule,
}