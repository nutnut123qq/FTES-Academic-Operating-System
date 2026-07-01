import type { PricingPhase } from "@/modules/types/enums/pricing-phase"

/** One pricing-phase row rendered in the conversion rail. */
export interface CoursePriceRow {
    /** Pricing-phase entity id. */
    id: string
    /** Which phase this row is (Pioneer / EarlyBird / Regular). */
    phase: PricingPhase
    /** Price formatted in VND (e.g. "199,000₫"). */
    formattedPrice: string
    /** Raw VND price of this phase (feeds the shared `PriceTag`). */
    priceVnd: number
    /** Raw VND list price discounts are measured against (struck in `PriceTag`). */
    listPriceVnd: number
    /** Price formatted in USD (e.g. "$9.99"), or null when none. */
    formattedPriceUsd: string | null
    /** Discount vs list price, rounded to a whole percent, or null. */
    savePercent: number | null
    /** Remaining seats for this phase, or null when unlimited. */
    slotAvailable: number | null
    /** Whether earlier phases have already filled (this row is in the past). */
    soldOut: boolean
    /** Whether this is the course's currently active phase. */
    isActive: boolean
}

/** Course totals derived client-side from the loaded course tree (no BE field). */
export interface CourseTotals {
    /** Number of modules. */
    moduleCount: number
    /** Total lessons across all modules. */
    lessonCount: number
    /** Total hands-on challenges across all lessons. */
    challengeCount: number
    /** Total estimated minutes to read all lessons. */
    totalMinutes: number
}
