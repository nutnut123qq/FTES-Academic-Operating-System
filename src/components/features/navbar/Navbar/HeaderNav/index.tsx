"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Button, Popover, PopoverContent, cn } from "@heroui/react"
import { CaretDownIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useAppNav } from "@/components/features/app-shell/useAppNav"
import type { AppNavModule } from "@/components/features/app-shell/useAppNav"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Close delay after the pointer leaves the trigger/panel hover zone (anti-flicker). */
const HOVER_CLOSE_DELAY_MS = 150

/** Props for {@link HeaderNav}. */
export type HeaderNavProps = WithClassNames<undefined>

/**
 * HeaderNav — desktop global navigation in the top bar (header-first shell,
 * NO global left sidebar anywhere). Exactly four top-level modules from
 * {@link useAppNav}: Home is a plain link; Workplace / Course / Community are
 * each a split trigger — the label navigates to the module path, the caret
 * (or hovering the cluster) opens a one-column dropdown of the module's
 * nested features. At most one dropdown is open at a time.
 *
 * A11y: `nav` landmark with an accessible name; caret triggers expose
 * `aria-expanded` / `aria-haspopup="menu"`; ArrowUp/Down walk the menu items,
 * ESC / blur / outside-click close (HeroUI Popover restores trigger focus).
 * Hidden on mobile (the hamburger drawer covers small screens).
 */
export const HeaderNav = ({ className }: HeaderNavProps) => {
    const t = useTranslations()
    const modules = useAppNav()
    const [openKey, setOpenKey] = useState<string | null>(null)
    const closeTimer = useRef<number | null>(null)

    /** Cancel a pending hover-close. */
    const cancelClose = useCallback(() => {
        if (closeTimer.current !== null) {
            window.clearTimeout(closeTimer.current)
            closeTimer.current = null
        }
    }, [])

    /** Open a module's dropdown immediately (closing any other). */
    const openNow = useCallback(
        (key: string) => {
            cancelClose()
            setOpenKey(key)
        },
        [cancelClose],
    )

    /** Schedule a close after the anti-flicker delay (trigger ↔ panel travel). */
    const scheduleClose = useCallback(() => {
        cancelClose()
        closeTimer.current = window.setTimeout(() => {
            setOpenKey(null)
            closeTimer.current = null
        }, HOVER_CLOSE_DELAY_MS)
    }, [cancelClose])

    useEffect(() => cancelClose, [cancelClose])

    /** ArrowUp/Down + Home/End roving focus across the dropdown's menu items. */
    const onMenuKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        const keys = ["ArrowDown", "ArrowUp", "Home", "End"]
        if (!keys.includes(event.key)) return
        const items = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>("[role=\"menuitem\"]"),
        )
        if (items.length === 0) return
        event.preventDefault()
        event.stopPropagation()
        const index = items.indexOf(document.activeElement as HTMLElement)
        let next = 0
        if (event.key === "ArrowDown") next = index < 0 ? 0 : (index + 1) % items.length
        if (event.key === "ArrowUp") next = index < 0 ? items.length - 1 : (index - 1 + items.length) % items.length
        if (event.key === "End") next = items.length - 1
        items[next]?.focus()
    }, [])

    /** Shared pill styling for the Home link and module labels. */
    const linkClass = (isActive: boolean) =>
        cn(
            "rounded-full px-3 py-2 text-sm no-underline transition-colors",
            isActive ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground",
        )

    /** One module cluster: label link + caret trigger + dropdown panel. */
    const renderModule = (module: AppNavModule) => {
        const isOpen = openKey === module.key
        return (
            <div
                key={module.key}
                className="flex items-center"
                onPointerEnter={() => openNow(module.key)}
                onPointerLeave={scheduleClose}
            >
                <Link href={module.path} className={linkClass(module.isActive)}>
                    {module.label}
                </Link>
                <Popover
                    isOpen={isOpen}
                    onOpenChange={(open) => setOpenKey(open ? module.key : null)}
                >
                    <Button
                        isIconOnly
                        variant="tertiary"
                        size="sm"
                        className="-ml-1 rounded-full"
                        aria-label={t("nav.openModuleMenu", { module: module.label })}
                        aria-expanded={isOpen}
                        aria-haspopup="menu"
                    >
                        <CaretDownIcon
                            className={cn("size-4 transition-transform", isOpen && "rotate-180")}
                            aria-hidden
                            focusable="false"
                        />
                    </Button>
                    <PopoverContent placement="bottom start" className="w-64">
                        <div
                            role="menu"
                            aria-label={module.label}
                            className="flex flex-col gap-0 p-2"
                            onKeyDown={onMenuKeyDown}
                            onPointerEnter={cancelClose}
                            onPointerLeave={scheduleClose}
                        >
                            {module.children.map((item) => (
                                <Link
                                    key={item.key}
                                    role="menuitem"
                                    href={item.path}
                                    onClick={() => setOpenKey(null)}
                                    className="flex items-center gap-2 rounded-large px-2 py-2 text-sm no-underline transition-colors hover:bg-default/40"
                                >
                                    <span
                                        className={item.isActive ? "text-accent" : "text-muted"}
                                        aria-hidden
                                    >
                                        {item.icon}
                                    </span>
                                    <span className={item.isActive ? "text-accent" : "text-foreground"}>
                                        {item.label}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        )
    }

    return (
        <nav
            aria-label={t("nav.primary")}
            className={cn("hidden items-center gap-1 md:flex", className)}
        >
            {modules.map((module) =>
                module.children.length === 0 ? (
                    <Link key={module.key} href={module.path} className={linkClass(module.isActive)}>
                        {module.label}
                    </Link>
                ) : (
                    renderModule(module)
                ),
            )}
        </nav>
    )
}
