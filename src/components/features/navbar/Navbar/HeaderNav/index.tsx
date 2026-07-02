"use client"

import React, { useState } from "react"
import { Button, Popover, PopoverContent, Typography, cn } from "@heroui/react"
import { CaretDownIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useAppNav } from "@/components/features/app-shell/useAppNav"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Keys surfaced as direct top-bar links; everything else lives in the mega-menu. */
const PRIMARY_KEYS = ["subjects", "courses", "community"]

/** Props for {@link HeaderNav}. */
export type HeaderNavProps = WithClassNames<undefined>

/**
 * HeaderNav — desktop global navigation in the top bar (header-first shell). The
 * three core domains (Subjects · Courses · Community) are direct links; every
 * other domain lives under a single "Explore" mega-menu grouped by section. The
 * left sidebar is now reserved for in-context nav (the subject workspace rail).
 *
 * Reads the shared {@link useAppNav} source (same as the mobile drawer), so the
 * header, drawer, and any rail never drift. Hidden on mobile (the hamburger
 * drawer covers small screens). `"use client"` for the popover state.
 */
export const HeaderNav = ({ className }: HeaderNavProps) => {
    const t = useTranslations("nav")
    const groups = useAppNav()
    const [isOpen, setOpen] = useState(false)

    const allItems = groups.flatMap((group) => group.items)
    const primaryItems = PRIMARY_KEYS.map((key) => allItems.find((i) => i.key === key)).filter(
        (item): item is NonNullable<typeof item> => Boolean(item),
    )
    // mega-menu = every group except the "top" (Home) minus the primary items,
    // dropping any group left empty.
    const menuGroups = groups
        .filter((group) => group.key !== "top")
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => !PRIMARY_KEYS.includes(item.key)),
        }))
        .filter((group) => group.items.length > 0)

    return (
        <div className={cn("hidden items-center gap-1 md:flex", className)}>
            {primaryItems.map((item) => (
                <Link
                    key={item.key}
                    href={item.path}
                    className={cn(
                        "rounded-full px-3 py-2 text-sm no-underline transition-colors",
                        item.isActive ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground",
                    )}
                >
                    {item.label}
                </Link>
            ))}

            <Popover isOpen={isOpen} onOpenChange={setOpen}>
                <Button variant="tertiary" size="sm" className="gap-1 rounded-full text-sm text-muted">
                    {t("section.explore")}
                    <CaretDownIcon className="size-4" aria-hidden focusable="false" />
                </Button>
                <PopoverContent placement="bottom start" className="w-[600px]">
                    <div className="grid grid-cols-3 gap-2 p-2">
                        {menuGroups.map((group) => (
                            <div key={group.key} className="flex flex-col gap-0.5">
                                {group.label ? (
                                    <Typography type="body-xs" color="muted" className="px-2 py-1">
                                        {group.label}
                                    </Typography>
                                ) : null}
                                {group.items.map((item) => (
                                    <Link
                                        key={item.key}
                                        href={item.path}
                                        onClick={() => setOpen(false)}
                                        className="flex items-center gap-2 rounded-large px-2 py-2 text-sm no-underline transition-colors hover:bg-default/40"
                                    >
                                        <span className={item.isActive ? "text-accent" : "text-muted"}>
                                            {item.icon}
                                        </span>
                                        <span className={item.isActive ? "text-accent" : "text-foreground"}>
                                            {item.label}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
