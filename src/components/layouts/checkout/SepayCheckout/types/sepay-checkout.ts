/**
 * Bank/account details resolved from the SePay QR url.
 *
 * Parsed once from the `qr` query param so the order summary can show the
 * destination bank + account number alongside the QR image.
 */
export interface BankDetails {
    /** Destination bank short name (e.g. `"MBBank"`). Defaults to `"MBBank"`. */
    bank: string
    /** Destination account number; empty string when it cannot be parsed. */
    account: string
}
