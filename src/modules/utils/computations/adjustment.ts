// Import the definition file directly (NOT `from "."` — self-barrel: index.ts re-exports this file → cycle).
import { bnMulDecimal } from "./operation"
import BN from "bn.js"
import Decimal from "decimal.js"

export const adjustSlippage = (
    {
        bn,
        slippage,
        fractionDigits ,
        isRoundUp,
    }: AdjustSlippageParams
): BN => {
    return bnMulDecimal({
        bn,
        decimal: new Decimal(1).sub(slippage),
        fractionDigits,
        isRoundUp,
    })
}

export interface AdjustSlippageParams {
    bn: BN
    slippage: Decimal
    fractionDigits?: Decimal
    isRoundUp?: boolean
}