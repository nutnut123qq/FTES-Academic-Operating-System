"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import {
    Button,
    ColorArea,
    ColorPicker,
    ColorSlider,
    ColorSwatch,
    cn,
    parseColor,
} from "@heroui/react"
import type { Color } from "@heroui/react"
import { CheckIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useAppearanceStore } from "@/hooks/zustand/appearance/store"
import {
    ACCENT_PRESETS,
    DEFAULT_ACCENT,
    DEFAULT_ACCENT_HEX,
} from "@/resources/constants/appearance"
import { handleRadioGroupKeyDown } from "../radio-group"

/**
 * How long to wait after the last colour change before writing the store. The CSS
 * variable is updated on every change for a live preview; only the persisted
 * write (localStorage) is debounced, so dragging the colour area does not
 * serialize the store on every pointer move.
 */
const CUSTOM_PERSIST_DEBOUNCE_MS = 250

/**
 * AccentSection — "Màu chủ đạo" group of the appearance settings: a radiogroup grid
 * of the curated accent swatches (first = indigo #3F51B5, the default) plus a
 * free-form colour picker and a reset. Selecting a swatch writes the appearance
 * store, which flips `data-accent` on `<html>` so the whole app (both light and
 * dark) re-tokens instantly; a custom colour instead writes an inline
 * `--accent` / `--accent-foreground` pair, which outranks the preset block. The
 * selected swatch is marked colour-independently (ring + check icon); each swatch
 * is announced by its localized name.
 */
export const AccentSection = () => {
    const t = useTranslations()
    const accent = useAppearanceStore((state) => state.accent)
    const accentCustom = useAppearanceStore((state) => state.accentCustom)
    const setAccent = useAppearanceStore((state) => state.setAccent)
    const setAccentCustom = useAppearanceStore((state) => state.setAccentCustom)
    const resetAccent = useAppearanceStore((state) => state.resetAccent)

    // Picker value lives locally so dragging stays smooth; the store is the source
    // of truth and syncs back in (including after the persist rehydrate on mount,
    // which is why this is an effect and not just the initial state).
    const [color, setColor] = useState<Color>(() => parseColor(DEFAULT_ACCENT_HEX))
    const persistTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    useEffect(() => {
        setColor(parseColor(accentCustom ?? DEFAULT_ACCENT_HEX))
    }, [accentCustom])

    // stop the pending write when the section unmounts mid-drag
    useEffect(() => () => clearTimeout(persistTimeout.current), [])

    const onColorChange = useCallback((next: Color) => {
        setColor(next)
        // instant preview — the debounced store write below re-applies the same
        // value together with the matching readable foreground
        document.documentElement.style.setProperty("--accent", next.toString("hex"))
        clearTimeout(persistTimeout.current)
        persistTimeout.current = setTimeout(() => {
            setAccentCustom(next.toString("hex"))
        }, CUSTOM_PERSIST_DEBOUNCE_MS)
    }, [setAccentCustom])

    const onReset = useCallback(() => {
        clearTimeout(persistTimeout.current)
        resetAccent()
    }, [resetAccent])

    // a custom colour wins over the preset, so no swatch reads as selected then
    const hasCustom = accentCustom !== null

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
                    const isSelected = !hasCustom && accent === preset.id
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

            {/* free-form colour + reset — the custom value outranks the presets above */}
            <div className="flex flex-wrap items-center gap-3">
                <ColorPicker value={color} onChange={onColorChange}>
                    <ColorPicker.Trigger
                        className={cn(
                            "flex items-center gap-2 rounded-xl border p-2 text-sm outline-none transition-colors",
                            "focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-overlay",
                            hasCustom
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-default text-foreground hover:bg-default",
                        )}
                    >
                        <ColorSwatch />
                        <span>{t("appearance.accent.custom")}</span>
                    </ColorPicker.Trigger>
                    <ColorPicker.Popover className="gap-2">
                        <ColorArea
                            aria-label={t("appearance.accent.custom")}
                            className="max-w-full"
                            colorSpace="hsb"
                            xChannel="saturation"
                            yChannel="brightness"
                        >
                            <ColorArea.Thumb />
                        </ColorArea>
                        <ColorSlider channel="hue" className="gap-1 px-1" colorSpace="hsb">
                            <ColorSlider.Track>
                                <ColorSlider.Thumb />
                            </ColorSlider.Track>
                        </ColorSlider>
                    </ColorPicker.Popover>
                </ColorPicker>
                <Button variant="tertiary" size="sm" onPress={onReset}>
                    {t("appearance.accent.reset")}
                </Button>
            </div>
        </section>
    )
}
