"use client"

import React from "react"
import {
    useTranslations,
} from "next-intl"
import { useAppSelector } from "@/redux/hooks"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link FoundationsLearnHeader}. */
export interface FoundationsLearnHeaderProps extends WithClassNames<undefined> {
    /** Breadcrumb node rendered in the PageHeader breadcrumb slot (tier-1). */
    breadcrumb?: React.ReactNode
}

/**
 * Title + description for the foundations category learn page.
 *
 * Renders the house {@link PageHeader} block (H3 title + `body-sm` muted
 * description) so every page header reads at the same scale. No back arrow — the
 * breadcrumb above owns the escape (per the sidebar+breadcrumb rule). Reads the
 * active category from Redux.
 * @param props.className - Optional root class names.
 */
export const FoundationsLearnHeader = ({
    breadcrumb,
    className,
}: FoundationsLearnHeaderProps) => {
    const t = useTranslations()
    const category = useAppSelector((state) => state.foundation.category)

    const title = category?.title || t("foundations.title")
    const description = category?.description || t("foundations.description")

    return (
        <PageHeader
            breadcrumb={breadcrumb}
            title={title}
            description={description}
            className={className}
        />
    )
}
