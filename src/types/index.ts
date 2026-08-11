import { ComponentType, ReactNode, SVGProps } from "react"

/**
 * Renderable icon component — `(props: SVGProps<SVGSVGElement>) => JSX`.
 *
 * The repo's single icon library is `@phosphor-icons/react`. `@gravity-ui/icons` (and
 * `react-icons` / `@iconify/react` / `@icons-pack/react-simple-icons`) are leftovers of an
 * unfinished migration (phosphor → gravity → back to phosphor) that is being undone; those
 * packages are banned by `no-restricted-imports` in `eslint.config.mjs`.
 *
 * For an icon lookup table prefer `import type { Icon } from "@phosphor-icons/react"`.
 * Keep this type only for hand-written SVG components (`src/components/svg/*`), which are
 * plain `SVGProps` components rather than phosphor `Icon`s.
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