/**
 * Format a VND amount with locale thousands separators and the ₫ suffix.
 * @param amount - amount in Vietnamese dong (integer, no decimals)
 * @returns the amount formatted for the `vi-VN` locale, e.g. `99.000₫`
 */
export const formatVnd = (amount: number): string => `${amount.toLocaleString("vi-VN")}₫`
