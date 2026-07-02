"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { SidebarNavGroup } from "@/components/blocks/navigation/SidebarNavGroup"
import { SidebarNavItem } from "@/components/blocks/navigation/SidebarNavItem"
import { SECTION_ACCESS } from "@/resources/constants/admin"
import type { AdminRole, AdminSection } from "@/resources/constants/admin"
import { ADMIN_NAV_GROUPS, ADMIN_SECTION_META } from "../../map"

/** Props for {@link AdminSectionNav}. */
export interface AdminSectionNavProps {
    /** Operator role — the nav lists ONLY sections in `SECTION_ACCESS[role]`. */
    role: AdminRole
    /** The active section (accent-filled row). */
    activeSection: AdminSection
    /** Fired with the target route when a row is pressed. */
    onNavigate: (href: string) => void
}

/**
 * The role-filtered section rows of the console nav, grouped into the three
 * clusters (operations / content / system). Rendered inside the desktop
 * {@link import("@/components/blocks/navigation/CollapsibleSidebar").CollapsibleSidebar}
 * AND the mobile drawer — the caller supplies navigation so the drawer can
 * close itself after a pick.
 */
export const AdminSectionNav = ({ role, activeSection, onNavigate }: AdminSectionNavProps) => {
    const t = useTranslations()
    const allowed = SECTION_ACCESS[role]
    const groups = ADMIN_NAV_GROUPS
        .map((group) => ({ ...group, sections: group.sections.filter((section) => allowed.includes(section)) }))
        .filter((group) => group.sections.length > 0)

    return (
        // the console's navigation landmark — one per visible surface (rail OR drawer)
        <nav aria-label={t("admin.shell.navLabel")} className="flex flex-col">
            {groups.map((group, index) => (
                <SidebarNavGroup
                    key={group.key}
                    label={t(`admin.shell.groups.${group.key}`)}
                    divider={index > 0}
                >
                    {group.sections.map((section) => (
                        <SidebarNavItem
                            key={section}
                            icon={ADMIN_SECTION_META[section].icon}
                            label={t(`admin.shell.sections.${section}`)}
                            isActive={section === activeSection}
                            onPress={() => onNavigate(ADMIN_SECTION_META[section].href)}
                        />
                    ))}
                </SidebarNavGroup>
            ))}
        </nav>
    )
}
