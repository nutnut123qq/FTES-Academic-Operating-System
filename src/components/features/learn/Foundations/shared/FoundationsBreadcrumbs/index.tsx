"use client"

import React from "react"
import type {
    FoundationsBreadcrumbItem,
} from "../../types"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { ResponsiveBreadcrumb } from "@/components/blocks/navigation/ResponsiveBreadcrumb"

/** Props for {@link FoundationsBreadcrumbs}. */
export interface FoundationsBreadcrumbsProps extends WithClassNames<undefined> {
    /** Breadcrumb rows to render, in order. */
    items: Array<FoundationsBreadcrumbItem>
}

/**
 * Renders the foundations page breadcrumb trail.
 *
 * Presentational: maps the supplied items to HeroUI breadcrumb rows, no logic.
 * Shared across the foundations hub, category and detail pages — each supplies
 * its own trail — so it stays prop-driven.
 * @param props - the ordered breadcrumb items
 */
export const FoundationsBreadcrumbs = ({
    items,
    className,
}: FoundationsBreadcrumbsProps) => {
    return <ResponsiveBreadcrumb items={items} className={className} />
}
