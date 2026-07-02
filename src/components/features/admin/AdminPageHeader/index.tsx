"use client"

import React from "react"
import type { ReactNode } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { ResponsiveBreadcrumb } from "@/components/blocks/navigation/ResponsiveBreadcrumb"
import type { AdminSection } from "@/resources/constants/admin"
import { ADMIN_SECTION_META } from "../map"

/** Props for {@link AdminPageHeader}. */
export interface AdminPageHeaderProps {
    /** The console section this page belongs to (breadcrumb + section crumb). */
    section: AdminSection
    /** Extra crumb for a subpage (e.g. a user's name on the detail page). */
    subpage?: ReactNode
    /** Page title. */
    title: ReactNode
    /** Supporting description under the title. */
    description?: ReactNode
    /** Right-aligned actions slot. */
    actions?: ReactNode
}

/**
 * Shared header for every console section page: the `Admin / <Section>[ / <Subpage>]`
 * breadcrumb over the standard {@link PageHeader} (title + description + actions).
 * The section crumb only navigates when a subpage crumb sits below it.
 */
export const AdminPageHeader = ({
    section,
    subpage,
    title,
    description,
    actions,
}: AdminPageHeaderProps) => {
    const t = useTranslations()
    const router = useRouter()

    const items = [
        { key: "admin", label: t("admin.shell.breadcrumbRoot"), onPress: () => router.push("/admin") },
        {
            key: "section",
            label: t(`admin.shell.sections.${section}`),
            onPress: subpage ? () => router.push(ADMIN_SECTION_META[section].href) : undefined,
        },
        ...(subpage ? [{ key: "subpage", label: subpage }] : []),
    ]

    return (
        <PageHeader
            breadcrumb={<ResponsiveBreadcrumb items={items} />}
            title={title}
            description={description}
            actions={actions}
        />
    )
}
