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
        getFullRoute: (route: string) => `/${ROUTES.ADMIN.BASE}/${route}`
    },
    PAGE_NOT_FOUND: '**'
};