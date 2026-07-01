"use client"

import {
    useMemo,
} from "react"
import numeral from "numeral"
import Decimal from "decimal.js"
import _ from "lodash"
import type {
    CoursePriceRow,
} from "../types"
import { PricingPhase } from "@/modules/types/enums/pricing-phase"
import { type PricingPhaseEntity } from "@/modules/types/entities/pricing-phase"
import { computePercentage } from "@/modules/utils/computations/percentage"
import { publicEnv } from "@/resources/env/public"
import { useAppSelector } from "@/redux/hooks"

/** Result of {@link usePricingRows}. */
export interface UsePricingRowsResult {
    /** All pricing phases, ordered, formatted for the rail. */
    rows: Array<CoursePriceRow>
    /** The currently active phase row (drives the big headline price), or null. */
    active: CoursePriceRow | null
}

/**
 * Derives the pricing-rail rows from the active course: display price per phase
 * (phase price, else course list price), USD line when present, whole-percent
 * discount vs list, sold-out flag (phases before the active one), and the active
 * phase. Reuses the legacy Stepper computation so prices stay identical.
 *
 * @returns the formatted rows + the active row.
 */
export const usePricingRows = (): UsePricingRowsResult => {
    const course = useAppSelector((state) => state.course.entity)

    return useMemo<UsePricingRowsResult>(() => {
        // mirror the backend display transforms so rail prices match the catalog /
        // payment modal (which read `coursePricePreview`): VND ÷ testDivisor in
        // non-prod; USD charm-rounded to x.99 (no divisor). Keeps every surface equal.
        const divisor = publicEnv().pricing.testDivisor
        const toDisplayVnd = (amount: number): number =>
            divisor === 1 ? amount : Math.max(1, Math.round(amount / divisor))
        const toDisplayUsd = (amount: number): number => Math.max(1, Math.ceil(amount)) - 0.01

        const listPrice = toDisplayVnd(course?.originalPrice ?? 0)
        const currentPhase = course?.currentPhase ?? PricingPhase.Pioneer
        const phases = _.cloneDeep(course?.pricingPhases ?? []).sort(
            (a, b) => a.sortIndex - b.sortIndex,
        )
        const currentOrderIndex = phases.find((p) => p.phase === currentPhase)?.sortIndex ?? 0

        /** Display price for a tier (phase price, else course list price), test-divided. */
        const priceOf = (phase: PricingPhaseEntity): number =>
            toDisplayVnd(phase.price ?? course?.originalPrice ?? 0)
        /** USD display price for a tier (charm-rounded), or null when none. */
        const usdOf = (phase: PricingPhaseEntity): number | null => {
            const raw = phase.priceUsd ?? course?.originalPriceUsd ?? null
            return raw == null ? null : toDisplayUsd(raw)
        }
        /** Discount percent of a tier price against the list price. */
        const discountOf = (tierPrice: number, refPrice: number): number => {
            if (refPrice <= 0 || tierPrice >= refPrice) {
                return 0
            }
            return new Decimal(refPrice).minus(tierPrice).dividedBy(refPrice).times(100).toNumber()
        }

        const rows: Array<CoursePriceRow> = phases.map((phase) => {
            const price = priceOf(phase)
            const usd = usdOf(phase)
            return {
                id: phase.id,
                phase: phase.phase,
                formattedPrice: `${numeral(price).format("0,0")}₫`,
                priceVnd: price,
                listPriceVnd: listPrice,
                formattedPriceUsd: usd != null ? numeral(usd).format("$0,0.00") : null,
                savePercent: phase.price != null
                    ? computePercentage({
                        numerator: new Decimal(discountOf(price, listPrice)),
                        denominator: new Decimal(100),
                        fractionDigits: 0,
                    }).toNumber()
                    : null,
                slotAvailable: phase.slotAvailable ?? null,
                soldOut: phase.sortIndex < currentOrderIndex,
                isActive: phase.phase === currentPhase,
            }
        })

        return {
            rows,
            active: rows.find((row) => row.isActive) ?? null,
        }
    }, [course])
}
