import Decimal from "decimal.js"
import numeral from "numeral"
import { publicEnv } from "@/resources/env/public"

export const round = (
    decimal: Decimal,
    fractionDigits = publicEnv().computation.round.fractionDigits,
    maxLength = 6
): string => {
    // Step 1: Round the number using the configured fraction digits
    const rounded = decimal.toDecimalPlaces(
        fractionDigits,
        Decimal.ROUND_HALF_UP
    )

    // Convert to string for length checking
    const str = rounded.toString()
    // If length is within the limit, return directly
    if (str.length <= maxLength) return str

    // Step 2: Extract the integer part (remove decimals)
    const intPart = rounded.trunc()
    const intStr = intPart.toString()

    // Step 3: If even the integer part is still too long,
    // format using numeral (e.g. 1k, 2.5m, 1.2b)
    if (intStr.length > maxLength) {
        return numeral(rounded.toNumber()).format("0.[00]a")
    }

    // Step 4: Calculate how many decimal digits we can still keep
    // -1 is reserved for the decimal point "."
    const remain = maxLength - intStr.length - 1
    if (remain <= 0) return intStr

    // Step 5: Trim decimals to fit the max length (without rounding up)
    return rounded
        .toDecimalPlaces(remain, Decimal.ROUND_DOWN)
        .toString()
}