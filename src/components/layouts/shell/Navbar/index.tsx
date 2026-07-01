"use client"

import React, {
    useEffect,
} from "react"
import {
    cn,
} from "@heroui/react"
import {
    Logo,
} from "./Logo"
import {
    AccountMenuDropdown,
} from "./AccountMenuDropdown"
import {
    NavLinks,
} from "./NavLinks"
import {
    SearchButton,
} from "./SearchButton"
import {
    NotificationBell,
} from "./NotificationBell"
import { useSearchOverlayState } from "@/hooks/zustand/overlay/hooks"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link Navbar}.
 */
export type NavbarProps = WithClassNames<undefined>

/**
 * Navbar — top application navigation bar.
 *
 * Container: owns the Ctrl/Cmd+K search shortcut and renders the logo,
 * self-navigating links, search trigger, and the account dropdown.
 * `"use client"` for hooks + keyboard handling.
 * @param props - optional root class name
 */
export const Navbar = ({ className }: NavbarProps) => {
    const { open: openSearch } = useSearchOverlayState()

    // register the global Ctrl/Cmd+K shortcut to open the search overlay
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const isK = event.key.toLowerCase() === "k"
            if (!isK) return
            if (!(event.ctrlKey || event.metaKey)) return
            event.preventDefault()
            openSearch()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [openSearch])

    return (
        <nav className={cn("sticky top-0 z-50 h-16 min-h-16 border-b bg-background", className)}>
            <div className="mx-auto flex h-full w-full items-center justify-between px-3">
                <div className="flex items-center gap-6">
                    <Logo className="flex-1 justify-start" />
                    <NavLinks />
                </div>

                <div className="flex items-center justify-end gap-3">
                    <SearchButton />
                    <NotificationBell />
                    <AccountMenuDropdown />
                </div>
            </div>
        </nav>
    )
}
