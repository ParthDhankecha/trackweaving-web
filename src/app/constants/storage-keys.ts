const _prefix: string = 'trackweaving.';


export default class StorageKeys {
    static readonly ACCESS_TOKEN: string = `${_prefix}access_token`;
    static readonly ACCESS_TOKEN_EXPIRES_AT = `${_prefix}token_expire_at`;
    static readonly USER_INFO = `${_prefix}user`;
    static readonly WORKSPACE_ID = `${_prefix}workspaceId`;
    static readonly MANUFACTURER_TOKEN = `${_prefix}manufacturer_token`;
    static readonly MANUFACTURER_TOKEN_EXPIRES_AT = `${_prefix}manufacturer_token_expire_at`;
    static readonly MFR_USER_INFO = `${_prefix}mfr_user`;
    static readonly DASHBOARD_LAYOUT = `${_prefix}dashboard_layout`;
    static readonly DASHBOARD_GROUP_BY = `${_prefix}dashboard_group_by`;

    /** sessionStorage */
    static readonly SST = {
        // Selected Language
        LANG: `${_prefix}lang`
    };
}