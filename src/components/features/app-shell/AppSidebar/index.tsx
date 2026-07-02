"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { CollapsibleSidebar } from "@/components/blocks/navigation/CollapsibleSidebar"
import { SidebarNavGroup } from "@/components/blocks/navigation/SidebarNavGroup"
import { SidebarNavItem } from "@/components/blocks/navigation/SidebarNavItem"
import { useAppNav } from "../useAppNav"

/**
 * AppSidebar — the app's global primary navigation (archetype A · sidebar rail).
 * A left {@link CollapsibleSidebar} lists the built domains in separator-divided
 * clusters (top · Học · Cộng đồng); it sticks under the 4rem navbar in the single
 * page scroll. Feature owns navigation + active-route (via {@link useAppNav}); the
 * blocks own all styling.
 */
export const AppSidebar = () => {
    const t = useTranslations("nav")
    const router = useRouter()
    const groups = useAppNav()

    return (
        <div className="hidden shrink-0 md:sticky md:top-16 md:block md:h-[calc(100dvh-4rem)]">
            <CollapsibleSidebar
                title={t("brand")}
                collapseLabel={t("collapseLeftRail")}
                expandLabel={t("expandLeftRail")}
                storageKey="app-shell-sidebar-collapsed"
                className="h-full"
            >
                {groups.map((group, index) => (
                    <SidebarNavGroup key={group.key} label={group.label} divider={index > 0}>
                        {group.items.map((item) => (
                            <SidebarNavItem
                                key={item.key}
                                icon={item.icon}
                                label={item.label}
                                isActive={item.isActive}
                                onPress={() => router.push(item.path)}
                            />
                        ))}
                    </SidebarNavGroup>
                ))}
            </CollapsibleSidebar>
        </div>
    )
}
