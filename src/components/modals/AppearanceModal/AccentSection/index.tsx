"use client"

import React from "react"
import { cn } from "@heroui/react"
import { CheckIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useAppearanceStore } from "@/hooks/zustand/appearance/store"
import {
    ACCENT_PRESETS,
    DEFAULT_ACCENT,
} from "@/resources/constants/appearance"
import { handleRadioGroupKeyDown } from "../radio-group"

/**
 * AccentSection — "Màu chủ đạo" group of the appearance modal: a radiogroup grid
 * of the curated accent swatches (first = indigo #3F51B5, the default). Selecting
 * a swatch writes the appearance store, which flips `data-accent` on `<html>` so
 * the whole app (both light and dark) re-tokens instantly. The selected swatch is
 * marked colour-independently (ring + check icon); each swatch is announced by its
 * localized name.
 */
export const AccentSection = () => {
    const t = useTranslations()
    const accent = useAppearanceStore((state) => state.accent)
    const setAccent = useAppearanceStore((state) => state.setAccent)
    return (
        <section className="flex flex-col gap-3">
            <div className="text-sm text-muted">{t("appearance.accent.label")}</div>
            <div
                role="radiogroup"
                aria-label={t("appearance.accent.label")}
                className="grid grid-cols-3 gap-2"
                onKeyDown={handleRadioGroupKeyDown}
            >
                {ACCENT_PRESETS.map((preset) => {
                    const isSelected = accent === preset.id
                    const isDefault = preset.id === DEFAULT_ACCENT
                    const name = t(preset.nameKey)
                    const caption = isDefault
                        ? `${name} (${t("appearance.accent.default")})`
                        : name
                    return (
                        <button
                            key={preset.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            aria-label={isDefault ? `${name} — ${t("appearance.accent.default")}` : name}
                            tabIndex={isSelected ? 0 : -1}
                            onClick={() => setAccent(preset.id)}
                            className={cn(
                                "flex flex-col items-center gap-2 rounded-xl p-2 outline-none transition-colors",
                                "focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-overlay",
                                "hover:bg-default",
                            )}
                        >
                            <span
                                className={cn(
                                    "flex size-9 items-center justify-center rounded-full",
                                    isSelected &&
                                        "ring-2 ring-foreground ring-offset-2 ring-offset-overlay",
                                )}
                                style={{ background: preset.swatch }}
                            >
                                {isSelected ? (
                                    <CheckIcon
                                        weight="bold"
                                        className="size-4 text-white"
                                        aria-hidden
                                        focusable="false"
                                    />
                                ) : null}
                            </span>
                            <span className="text-xs text-muted">{caption}</span>
                        </button>
                    )
                })}
            </div>
        </section>
    )
}
