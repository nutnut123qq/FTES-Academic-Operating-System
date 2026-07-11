export enum LocalStorageId {
    /** Keycloak access JWT (same key as legacy `ACCESS_TOKEN_STORAGE_KEY`). */
    KeycloakAccessToken = "keycloak:access_token",
    /** Refresh token from `/auth/login` — used to mint a new access token via REST `/auth/refresh`
     * (the BE GraphQL gateway is query-only, so refresh cannot go through GraphQL). */
    KeycloakRefreshToken = "keycloak:refresh_token",
    /** Learner has discovered "highlight a passage to ask AI" (hides the one-time hint + "new" tag). */
    HintSeenSelectionAsk = "hint:selection-ask",
    /** Remember-me preference from the sign-in form (pre-checks the box on next open). */
    AuthRememberMe = "auth:remember_me",
    /** Whether TOTP 2FA is enabled (FE mock — real flag comes from BE when the contract exists). */
    AuthTwoFactorEnabled = "auth:2fa_enabled",
}