import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SkeletonInput}. */
export interface SkeletonInputProps extends WithClassNames<undefined> {
    // No part-specific props: a single field-height bar.
}

/**
 * Skeleton matching a HeroUI <Input/> field box
 * (TextField/SearchField/NumberField/InputGroup).
 * Field box = min-h-9 (36px) + rounded-field (0.75rem = rounded-xl).
 */
export const SkeletonInput = ({ className }: SkeletonInputProps) => {
    return <Skeleton className={cn("h-9 w-full rounded-xl", className)} />
}
