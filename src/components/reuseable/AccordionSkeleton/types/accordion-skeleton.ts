import type { ReactNode } from "react"
import type { SkeletonTextSize } from "../../SkeletonText"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Visual variant aligned with HeroUI `Accordion`. */
export type AccordionSkeletonVariant = "default" | "surface"

/** One placeholder accordion row. */
export interface AccordionSkeletonItem {
    /** Accessible name for the placeholder row. */
    ariaLabel?: string
    /** When true, renders the expanded body slot under the title row. */
    expanded?: boolean
    /** Typography token for the title line. */
    titleSize?: SkeletonTextSize
    /** Tailwind width class for the title bar. */
    titleWidth?: string
    /** When true, shows a square shimmer where the chevron indicator sits. */
    showIndicator?: boolean
}

/** Props for {@link AccordionSkeleton}. */
export interface AccordionSkeletonProps extends WithClassNames<undefined> {
    /** Placeholder rows (order preserved). */
    items: Array<AccordionSkeletonItem>
    /** Container styling preset (default = borderless sidebar). */
    variant?: AccordionSkeletonVariant
    /** Body content for expanded rows; omitted rows render no body block. */
    renderExpandedBody?: (index: number) => ReactNode
}
