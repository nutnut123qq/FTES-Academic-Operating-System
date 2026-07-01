/**
 * Access token stored in `localStorage` under {@link LocalStorageId.KeycloakAccessToken}.
 *
 * We keep this as a distinct alias (instead of plain `string`) to make call sites explicit.
 */
export type LocalStorageAccessToken = string
