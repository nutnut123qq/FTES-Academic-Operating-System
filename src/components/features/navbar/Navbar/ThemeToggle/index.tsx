"use client"

import React from "react"
import { Button } from "@heroui/react"
import { MoonIcon, SunIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link ThemeToggle}.
 */
export type ThemeToggleProps = WithClassNames<undefined>

/**
 * One-tap light ⇄ dark switch for the navbar, sitting beside the language
 * dropdown.
 *
 * The app opens on `system` now, so a visitor whose OS is light no longer lands
 * in a dark app with no way out but a buried settings modal (góp ý #4). This is
 * deliberately a TOGGLE, not the three-way Light/Dark/System control: "System"
 * is the default and stays where a rarely-changed preference belongs
 * ({@link import("@/components/features/profile/Settings/ModeSection").ModeSection}).
 *
 * `resolvedTheme` — not `theme` — decides what the next tap writes: on `system`
 * the raw value says nothing about what the visitor is actually looking at, so
 * the first tap would be a coin flip.
 *
 * Renders nothing until mounted: the server has no idea which theme the client
 * resolved, so painting an icon during SSR guarantees a wrong-icon flash.
 *
 * @param props - optional root class name (placement only)
 */
export const ThemeToggle = ({ className }: ThemeToggleProps) => {
    const t = useTranslations()
    const { resolvedTheme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => setMounted(true), [])

    if (!mounted) {
        return null
    }

    const isDark = resolvedTheme === "dark"
    return (
        <Button
            isIconOnly
            variant="tertiary"
            aria-label={t("nav.toggleTheme")}
            className={className}
            onPress={() => setTheme(isDark ? "light" : "dark")}
        >
            {isDark ? (
                <SunIcon aria-hidden focusable="false" className="size-5" />
            ) : (
                <MoonIcon aria-hidden focusable="false" className="size-5" />
            )}
        </Button>
    )
}
