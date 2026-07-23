const TITLE_POSTFIX = '- Pickwell';

/** Homepage / landing SEO — keep `src/index.html` meta tags aligned when editing. */
export const LANDING_SEO = {
    title: 'TrackWeaving | Real-Time Loom Monitoring Software for Textile Mills',
    description:
        'TrackWeaving is a real-time weaving machine monitoring software for textile manufacturers. Track loom production, speed, stoppages, beam status, efficiency, and shift-wise performance on mobile and web.',
    keywords: [
        'weaving machine monitoring software',
        'loom monitoring software',
        'textile mill monitoring system',
        'real-time loom data',
        'textile production tracking',
        'weaving machine analytics',
    ].join(', '),
    canonicalUrl: 'https://www.trackweaving.com/',
};

export const APP_PAGE_TITLE = {
    BRAND_NAME: `Pickwell`,
    HOME: `Home ${TITLE_POSTFIX}`,
    AUTH: {
        BASE: `Authentication ${TITLE_POSTFIX}`,
        LOGIN: `Login ${TITLE_POSTFIX}`,
        REGISTER: `Register ${TITLE_POSTFIX}`,
    },
    DASHBOARD: `Dashboard ${TITLE_POSTFIX}`,
    REPORT: `Report ${TITLE_POSTFIX}`,
    SETTINGS: {
        BASE: `Settings ${TITLE_POSTFIX}`,
        MACHINE_GROUP: `Machine Group ${TITLE_POSTFIX}`,
        MACHINE_CONFIGURE: `Machine Configure ${TITLE_POSTFIX}`,
        MAINTENANCE_CATEGORY: `Maintenance Category ${TITLE_POSTFIX}`,
        MAINTENANCE_ENTRY: `Maintenance Entry ${TITLE_POSTFIX}`,
        SHIFT_WISE_COMMENT_UPDATE: `Shift Wise Comment Update ${TITLE_POSTFIX}`,
        PARTS_CHANGE_ENTRY: `Parts Change Entry ${TITLE_POSTFIX}`,
        USERS: `Users ${TITLE_POSTFIX}`
    },
    DESIGN: `Design ${TITLE_POSTFIX}`,
    ADMIN: {
        BASE: `Admin ${TITLE_POSTFIX}`,
        LOGIN: `Admin Login ${TITLE_POSTFIX}`,
        WORKSPACE: `Workspace Management ${TITLE_POSTFIX}`,
        USER: `User Management ${TITLE_POSTFIX}`,
        MACHINE: `Machine Management ${TITLE_POSTFIX}`,
        INVOICE: `Invoice Management ${TITLE_POSTFIX}`,
        INVOICE_UPSERT: `Invoice Upsert ${TITLE_POSTFIX}`,
        INVOICE_PRINT: `Print Invoice ${TITLE_POSTFIX}`,
        APK_VERSION: `APK Version Management ${TITLE_POSTFIX}`,
        LEAD: `Lead / CRM Management ${TITLE_POSTFIX}`,
        MANUFACTURER: `Manufacturer Management ${TITLE_POSTFIX}`,
        MANUFACTURER_USER: `Manufacturer User Management ${TITLE_POSTFIX}`,
        ALERT_CONFIG: `Alert Configuration ${TITLE_POSTFIX}`,
    },
    MANUFACTURER: {
        BASE: `Manufacturer Portal ${TITLE_POSTFIX}`,
        LOGIN: `Manufacturer Login ${TITLE_POSTFIX}`,
        OVERVIEW: `Overview ${TITLE_POSTFIX}`,
        DASHBOARD: `Dashboard ${TITLE_POSTFIX}`,
        ANALYTICS: `Analytics ${TITLE_POSTFIX}`,
        REPORT: `Reports ${TITLE_POSTFIX}`,
    },
    TERMS_AND_CONDITIONS: `Terms and Conditions ${TITLE_POSTFIX}`,
    PRIVACY_POLICY: `Privacy Policy ${TITLE_POSTFIX}`,
    SUPPORT: `Support ${TITLE_POSTFIX}`,
    PAGE_NOT_FOUND: `404 - Page Not Found ${TITLE_POSTFIX}`,
};