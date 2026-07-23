export const ROUTES = {
    LANDING: '',
    BASE: 'app',
    HOME: 'app',
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
        getFullRoute: (...args: string[]) => `/${ROUTES.BASE}/${ROUTES.SETTINGS.BASE}/${args.join('/')}`
    },
    ADMIN: {
        BASE: 'admin',
        LOGIN: 'login',
        WORKSPACE: 'workspace',
        USER: 'user',
        MACHINE: 'machine',
        INVOICE: 'invoice',
        INVOICE_HOME: '',
        INVOICE_UPSERT: 'upsert',
        INVOICE_PRINT: 'print',
        APK_VERSION: 'apk-version',
        LEAD: 'lead',
        MANUFACTURER: 'manufacturer',
        MANUFACTURER_USER: 'manufacturer-user',
        ALERT_CONFIG: (id: string = ':workspaceId') => `alert-config/${id}`,
        getFullRoute: (route: string) => `/${ROUTES.ADMIN.BASE}/${route}`
    },
    MANUFACTURER: {
        BASE: 'manufacturer',
        LOGIN: 'login',
        OVERVIEW: 'overview',
        DASHBOARD: 'dashboard',
        MACHINES: 'machines',
        ANALYTICS: 'analytics',
        REPORT: 'report',
        getFullRoute: (route: string) => `/${ROUTES.MANUFACTURER.BASE}/${route}`
    },
    TERMS_AND_CONDITIONS: 'terms-and-condition',
    PRIVACY_POLICY: 'privacy-policy',
    SUPPORT: 'support',
    PAGE_NOT_FOUND: '**'
};