"use client"

import React from "react"
import { useHeadhuntingsBreadcrumbs } from "../../hooks"
import { ResponsiveBreadcrumb } from "@/components/blocks/navigation/ResponsiveBreadcrumb"

/**
 * Breadcrumb trail for the headhuntings list page.
 *
 * Self-contained section (single-use): builds its own trail from the active
 * course in Redux + i18n + router via {@link useHeadhuntingsBreadcrumbs}, so the
 * container just renders `<HeadhuntingsBreadcrumbs />`.
 */
export const HeadhuntingsBreadcrumbs = () => {
    const items = useHeadhuntingsBreadcrumbs()

    return <ResponsiveBreadcrumb items={items} />
}
