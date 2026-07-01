import { ComponentType, ReactNode, SVGProps } from "react"

/**
 * Renderable icon component. Replaces phosphor's `Icon`/`IconProps` types after the
 * migration to `@gravity-ui/icons`, whose icons are `(props: SVGProps<SVGSVGElement>) => JSX`.
 */
export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

/** Form values for the CV submission form (presentational form + its container). */
export interface CvSubmissionFormValues {
    /** The selected CV file, or `null` before a file is chosen. */
    cv: File | null
}

export interface Module {
    id: string
    name: string
    description: ReactNode
    content: ReactNode
    video: string
    duration: string
    order: number
}

export interface Course {
    id: string
    name: string
    description: string
    image: string
    commitmentTexts: Array<string>
    price: number
    location: string
    date: string
    time: string
    duration: string
    modules: Array<Module>
    pricing: Array<Pricing>
    currentPhase: PricingPhase
    originalPrice: number
    prerequisites?: Array<string>
    registrationUrl?: string
}

export enum PricingPhase {
    Pioneer = "pioneer",
    EarlyBird = "early_bird",
    Regular = "regular",
}

export interface Pricing {
    phase: PricingPhase
    name: string
    price: number
    startDate: string
    slotAvailable: number
    slotSold: number
    endDate: string
}