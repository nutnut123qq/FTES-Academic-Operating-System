"use client"

import React from "react"
import { Breadcrumbs } from "@heroui/react"
import { useHeadhuntingCompanyBreadcrumbs } from "../../hooks"

/**
 * Breadcrumb trail for the headhunting company detail page.
 *
 * Self-contained section (single-use): builds its own trail from the active
 * course + company in Redux + i18n + router via
 * {@link useHeadhuntingCompanyBreadcrumbs}, so the container just renders
 * `<HeadhuntingCompanyBreadcrumbs />`.
 */
export const HeadhuntingCompanyBreadcrumbs = () => {
    const items = useHeadhuntingCompanyBreadcrumbs()

    return (
        <Breadcrumbs>
            {items.map((item) => (
                <Breadcrumbs.Item
                    key={item.key}
                    onPress={item.onPress}
                >
                    {item.label}
                </Breadcrumbs.Item>
            ))}
        </Breadcrumbs>
    )
}
