import type {
    BankDetails,
} from "../types"

/** Fallback bank short name when the QR url is missing or unparseable. */
const DEFAULT_BANK = "MBBank"

/**
 * Parse the destination bank + account number out of a SePay QR url.
 *
 * The QR url carries the bank/account as the `bank` / `acc` query params.
 * Pure + total: any missing/invalid input resolves to the default bank and an
 * empty account, so callers never have to guard against a throw.
 *
 * @param qrUrl - the raw SePay QR url (may be empty)
 * @returns the resolved {@link BankDetails}
 */
export const parseBankDetails = (qrUrl: string): BankDetails => {
    if (!qrUrl) {
        return {
            bank: DEFAULT_BANK,
            account: "",
        }
    }
    try {
        const url = new URL(qrUrl)
        return {
            bank: url.searchParams.get("bank") || DEFAULT_BANK,
            account: url.searchParams.get("acc") || "",
        }
    } catch {
        // malformed url → fall back to defaults rather than throwing
        return {
            bank: DEFAULT_BANK,
            account: "",
        }
    }
}
