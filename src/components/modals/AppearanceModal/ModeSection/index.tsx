"use client"

import React from "react"
import { cn } from "@heroui/react"
import {
    DesktopIcon,
    MoonIcon,
    SunIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { handleRadioGroupKeyDown } from "../radio-group"

/** One theme-mode choice of the segmented control. */
interface ModeOption {
    /** next-themes value this option writes. */
    value: "light" | "dark" | "system"
    /** Rendered icon (sun / moon / desktop). */
    icon: React.ReactNode
    /** Localized label. */
    label: string
}

/**
 * ModeSection — "Chế độ" group of the appearance modal: a segmented radiogroup
 * with Light / Dark / System, read/written straight through next-themes (which
 * keeps owning persistence + its own no-flash script). Applies live — no save
 * button.
 */
export const ModeSection = () => {
    const t = useTranslations()
    const { theme, setTheme } = useTheme()
    const current = theme ?? "dark"
    const options: Array<ModeOption> = [
        { value: "light", icon: <SunIcon className="size-5" aria-hidden focusable="false" />, label: t("appearance.mode.light") },
        { value: "dark", icon: <MoonIcon className="size-5" aria-hidden focusable="false" />, label: t("appearance.mode.dark") },
        { value: "system", icon: <DesktopIcon className="size-5" aria-hidden focusable="false" />, label: t("appearance.mode.system") },
    ]
    return (
        <section className="flex flex-col gap-3">
            <div className="text-sm text-muted">{t("appearance.mode.label")}</div>
            <div
                role="radiogroup"
                aria-label={t("appearance.mode.label")}
                className="grid grid-cols-3 gap-2"
                onKeyDown={handleRadioGroupKeyDown}
            >
                {options.map((option) => {
                    const isSelected = current === option.value
                    return (
                        <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={isSelected ? 0 : -1}
                            onClick={() => setTheme(option.value)}
                            className={cn(
                                "flex flex-col items-center gap-2 rounded-xl border p-3 text-sm outline-none transition-colors",
                                "focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-overlay",
                                isSelected
                                    ? "border-accent bg-accent/10 text-accent"
                                    : "border-default text-foreground hover:bg-default",
                            )}
                        >
                            {option.icon}
                            {option.label}
                        </button>
                    )
                })}
            </div>
        </section>
    )
}
