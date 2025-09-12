const _prefix: string = 'trackweaving.';


export default class StorageKeys {
    static readonly ACCESS_TOKEN: string = `${_prefix}access_token`;
    static readonly ACCESS_TOKEN_EXPIRES_AT = `${_prefix}token_expire_at`;
    static readonly USER_INFO = `${_prefix}user`;
    static readonly WORKSPACE_ID = `${_prefix}workspaceId`;

    /** sessionStorage */
    static readonly SST = {};
}