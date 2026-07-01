import type { AbstractEntity } from "./abstract"
import type { ModuleEntity } from "./module"
import type { EnrollmentEntity } from "./enrollment"
import type { PrerequisiteEntity } from "./prerequisite"
import type { QnaEntity } from "./qna"
import type { PricingPhaseEntity } from "./pricing-phase"
import type { ValuePropositionEntity } from "./value-proposition"
import type { PricingPhase } from "../enums"

/**
 * Course with ordered modules and landing-page metadata.
 */
export interface CourseEntity extends AbstractEntity {
    /** The display id of the course. */
    displayId: string
    /** The title of the course. */
    title: string
    /** The slug of the course. */
    slug: string | null
    /** The description of the course. */
    description: string | null
    /** The CDN URL of the course. */
    cdnUrl: string | null
    /** The cover image URL of the course. */
    coverImageUrl: string | null
    /**
     * List / Regular (listed) price. Tier Regular in `pricingPhases` has `regular: null` — use this.
     */
    originalPrice: number | null
    /**
     * List / Regular price in USD (charged by international gateways). `null` when the course has no USD price.
     */
    originalPriceUsd: number | null
    /** Exactly three tiers when backend seeds them: Pioneer, EarlyBird, Regular. */
    pricingPhases?: Array<PricingPhaseEntity>
    /** Active tier for marketing stepper (optional; defaults to Pioneer in UI). */
    currentPhase?: PricingPhase
    /** The prerequisites of the course. */
    prerequisites?: Array<PrerequisiteEntity>
    /** Bullet value proposition lines (ordered). */
    valuePropositions?: Array<ValuePropositionEntity>
    /** The Q&A entries of the course. */
    qnas?: Array<QnaEntity>
    /** The modules of the course. */
    modules?: Array<ModuleEntity>
    /** The enrollments of the course. */
    enrollments?: Array<EnrollmentEntity>
    /** The number of enrollments of the course. */
    enrollmentCount: number
}
