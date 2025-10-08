export const ROUTES = {
    BASE: '',
    HOME: '',
    AUTH: {
        BASE: 'auth',
        LOGIN: 'login',
        getFullRoute: (route: string) => `/${ROUTES.AUTH.BASE}/${route}`
    },
    DASHBOARD: 'dashboard',
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