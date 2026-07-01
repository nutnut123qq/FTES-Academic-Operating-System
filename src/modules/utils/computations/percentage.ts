import Decimal from "decimal.js"
import { publicEnv } from "@/resources/env/public"

export interface ComputePercentageParams {
    numerator: Decimal
    denominator: Decimal
    fractionDigits?: number
}
/**
 * Compute the percentage of a numerator divided by a denominator
 * @param numerator - The numerator
 * @param denominator - The denominator
 * @param fractionDigits - The number of decimal places to round to
 * @returns The percentage
 */
export const computePercentage = (
    { 
        numerator, 
        denominator, 
        fractionDigits = publicEnv().computation.percentage.fractionDigits 
    }: ComputePercentageParams): Decimal => {
    return new Decimal(numerator).div(denominator).mul(100).toDecimalPlaces(fractionDigits, Decimal.ROUND_HALF_UP)
}

export interface ComputeRatioParams {
    numerator: Decimal
    denominator: Decimal
    fractionDigits?: number
}

/**
 * Compute the ratio of a numerator divided by a denominator
 * @param numerator - The numerator
 * @param denominator - The denominator
 * @param fractionDigits - The number of decimal places to round to
 * @returns The ratio
 */
export const computeRatio = ({
    numerator,
    denominator,
    fractionDigits = publicEnv().computation.percentage.fractionDigits,
}: ComputeRatioParams): Decimal => {
    return new Decimal(numerator)
        .div(denominator)
        .toDecimalPlaces(fractionDigits, Decimal.ROUND_HALF_UP)
}