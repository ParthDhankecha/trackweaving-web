// Interface for Workspace
export interface IWorkspace {
    _id?: string;
    workspaceName: string;
    gstNumber: string;
    isActive: string;
    shiftType: 'day' | 'night';
    startTime: string;// 24 hour format HH:mm
    endTime: string;// 24 hour format HH:mm
    name?: string;
    userName?: string;
    userEmail?: string;
    mobile?: string;
    password?: string;
}