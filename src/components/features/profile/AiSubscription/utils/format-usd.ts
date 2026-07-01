/**
 * Format a USD amount with the `en-US` currency style (2 decimal places).
 * @param amount - amount in US dollars
 * @returns the amount formatted for the `en-US` locale, e.g. `$3.99`
 */
export const formatUsd = (amount: number): string => amount.toLocaleString(
    "en-US",
    {
        style: "currency",
        currency: "USD",
    },
)
