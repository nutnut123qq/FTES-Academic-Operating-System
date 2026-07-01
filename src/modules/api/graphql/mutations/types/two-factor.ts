import type { GraphQLResponse } from "../../types"

/** TOTP enrollment material returned by `setupTwoFactor`. */
export interface SetupTwoFactorData {
    /** Base32-encoded shared secret (for manual entry). */
    secret: string
    /** otpauth:// URI to render as a QR code. */
    otpauthUrl: string
}

/** Apollo response shape for `setupTwoFactor`. */
export interface MutateSetupTwoFactorResponse {
    /** Top-level `setupTwoFactor` field wrapping the standard API response. */
    setupTwoFactor: GraphQLResponse<SetupTwoFactorData>
}

/** GraphQL `ConfirmTwoFactorRequest` body. */
export interface ConfirmTwoFactorRequest {
    /** The current TOTP code from the authenticator app. */
    code: string
}

/** Apollo response shape for `confirmTwoFactor` (no data payload). */
export interface MutateConfirmTwoFactorResponse {
    /** Top-level `confirmTwoFactor` field wrapping the standard API response. */
    confirmTwoFactor: GraphQLResponse
}

/** GraphQL `DisableTwoFactorRequest` body. */
export interface DisableTwoFactorRequest {
    /** A current TOTP code, required while 2FA is enabled. */
    code: string
}

/** Apollo response shape for `disableTwoFactor` (no data payload). */
export interface MutateDisableTwoFactorResponse {
    /** Top-level `disableTwoFactor` field wrapping the standard API response. */
    disableTwoFactor: GraphQLResponse
}
