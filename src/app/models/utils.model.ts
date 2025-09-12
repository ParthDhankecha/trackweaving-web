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