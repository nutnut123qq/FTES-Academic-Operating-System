"use client"

import React from "react"
import { cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useAppNav } from "@/components/features/app-shell/useAppNav"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link HeaderNav}. */
export type HeaderNavProps = WithClassNames<undefined>

/**
 * HeaderNav — desktop global navigation in the top bar (header-first shell,
 * NO global left sidebar anywhere). Exactly four top-level modules from
 * {@link useAppNav} (Home · Workplace · Course · Community), each a PLAIN LABEL
 * LINK to its landing route. Per product directive (design D9) there are NO
 * dropdowns, carets, hover sub-menus, or mega-menus — nested features are
 * reached from inside each module's own landing page.
 *
 * A11y: `nav` landmark with an accessible name; items are plain links. Because
 * nothing opens, no trigger exposes `aria-haspopup`/`aria-expanded`; Tab walks
 * the four links and Enter navigates. Hidden on mobile (the hamburger drawer
 * covers small screens).
 */
export const HeaderNav = ({ className }: HeaderNavProps) => {
    const t = useTranslations()
    const modules = useAppNav()

    return (
        <nav
            aria-label={t("nav.primary")}
            className={cn("hidden items-center gap-2 md:flex", className)}
        >
            {modules.map((module) => (
                <Link
                    key={module.key}
                    href={module.path}
                    aria-current={module.isActive ? "page" : undefined}
                    className={cn(
                        "rounded-full px-3 py-2 text-sm no-underline transition-colors",
                        module.isActive
                            ? "bg-accent/10 text-accent"
                            : "text-muted hover:text-foreground",
                    )}
                >
                    {module.label}
                </Link>
            ))}
        </nav>
    )
}
