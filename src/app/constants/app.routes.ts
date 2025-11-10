export const ROUTES = {
    BASE: '',
    HOME: '',
    AUTH: {
        BASE: 'auth',
        LOGIN: 'login',
        getFullRoute: (route: string) => `/${ROUTES.AUTH.BASE}/${route}`
    },
    DASHBOARD: 'dashboard',
    REPORT: 'report',
    SETTINGS: {
        BASE: 'settings',
        MACHINE_GROUP: 'machine-group',
        MACHINE_CONFIGURE: 'machine-configure',
        MAINTENANCE_CATEGORY: 'maintenance-category',
        MAINTENANCE_ENTRY: 'maintenance-entry',
        SHIFT_WISE_COMMENT_UPDATE: 'shift-wise-comment-update',
        PARTS_CHANGE_ENTRY: 'parts-change-entry',
        USERS: 'users',
        getFullRoute: (...args: string[]) => `/${ROUTES.SETTINGS.BASE}/${args.join('/')}`
    },
    ADMIN: {
        BASE: 'admin',
        LOGIN: 'login',
        WORKSPACE: 'workspace',
        USER: 'user',
        MACHINE: 'machine',
        APK_VERSION: 'apk-version',
        getFullRoute: (route: string) => `/${ROUTES.ADMIN.BASE}/${route}`
    },
    TERMS_AND_CONDITIONS: 'terms-and-condition',
    PRIVACY_POLICY: 'privacy-policy',
    SUPPORT: 'support',
    PAGE_NOT_FOUND: '**'
};