export enum LocalStorageId {
    /** Keycloak access JWT (same key as legacy `ACCESS_TOKEN_STORAGE_KEY`). */
    KeycloakAccessToken = "keycloak:access_token",
    /** Learner has discovered "highlight a passage to ask AI" (hides the one-time hint + "new" tag). */
    HintSeenSelectionAsk = "hint:selection-ask",
}