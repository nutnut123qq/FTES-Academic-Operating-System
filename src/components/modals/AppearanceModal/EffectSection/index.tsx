"use client"

import React from "react"
import { Switch, cn } from "@heroui/react"
import {
    ArrowUpIcon,
    MeteorIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useAppearanceStore } from "@/hooks/zustand/appearance/store"
import type {
    EffectDirection,
    EffectSpeed,
} from "@/resources/constants/appearance"
import { handleRadioGroupKeyDown } from "../radio-group"

/** One direction choice for the ambient effect. */
interface DirectionOption {
    /** Store value this option writes. */
    value: EffectDirection
    /** Rendered icon (arrow-up / meteor). */
    icon: React.ReactNode
    /** Localized label. */
    label: string
}

/** One speed choice for the ambient effect. */
interface SpeedOption {
    /** Store value this option writes. */
    value: EffectSpeed
    /** Localized label. */
    label: string
}

/**
 * EffectSection — "Hiệu ứng nền" group of the appearance modal: a switch that
 * turns the ambient background on/off plus a radiogroup picking the direction
 * ("Bay lên" rise vs "Rơi xuống như sao băng" fall) and a radiogroup picking the
 * speed ("Chậm" / "Vừa" / "Nhanh"). Both groups are disabled (visually + aria)
 * while the effect is off. Everything applies live on the background behind the
 * modal; reduced-motion still wins at the CSS level.
 */
export const EffectSection = () => {
    const t = useTranslations()
    const effectEnabled = useAppearanceStore((state) => state.effectEnabled)
    const effectDirection = useAppearanceStore((state) => state.effectDirection)
    const effectSpeed = useAppearanceStore((state) => state.effectSpeed)
    const setEffectEnabled = useAppearanceStore((state) => state.setEffectEnabled)
    const setEffectDirection = useAppearanceStore((state) => state.setEffectDirection)
    const setEffectSpeed = useAppearanceStore((state) => state.setEffectSpeed)
    const options: Array<DirectionOption> = [
        { value: "rise", icon: <ArrowUpIcon className="size-5" aria-hidden focusable="false" />, label: t("appearance.effect.rise") },
        { value: "fall", icon: <MeteorIcon className="size-5" aria-hidden focusable="false" />, label: t("appearance.effect.fall") },
    ]
    const speedOptions: Array<SpeedOption> = [
        { value: "slow", label: t("appearance.speed.slow") },
        { value: "normal", label: t("appearance.speed.normal") },
        { value: "fast", label: t("appearance.speed.fast") },
    ]
    return (
        <section className="flex flex-col gap-3">
            <div className="text-sm text-muted">{t("appearance.effect.label")}</div>
            <div className="flex items-center justify-between gap-3">
                <span className="text-sm">{t("appearance.effect.enabled")}</span>
                <Switch
                    isSelected={effectEnabled}
                    onChange={(value) => setEffectEnabled(value)}
                    aria-label={t("appearance.effect.enabled")}
                >
                    <Switch.Control>
                        <Switch.Thumb />
                    </Switch.Control>
                </Switch>
            </div>
            <div
                role="radiogroup"
                aria-label={t("appearance.effect.direction")}
                aria-disabled={!effectEnabled}
                className={cn(
                    "grid grid-cols-2 gap-2",
                    !effectEnabled && "pointer-events-none opacity-50",
                )}
                onKeyDown={handleRadioGroupKeyDown}
            >
                {options.map((option) => {
                    const isSelected = effectDirection === option.value
                    return (
                        <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            aria-disabled={!effectEnabled}
                            disabled={!effectEnabled}
                            tabIndex={isSelected && effectEnabled ? 0 : -1}
                            onClick={() => {
                                if (!effectEnabled) return
                                setEffectDirection(option.value)
                            }}
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
            <div className="text-sm text-muted">{t("appearance.speed.label")}</div>
            <div
                role="radiogroup"
                aria-label={t("appearance.speed.label")}
                aria-disabled={!effectEnabled}
                className={cn(
                    "grid grid-cols-3 gap-2",
                    !effectEnabled && "pointer-events-none opacity-50",
                )}
                onKeyDown={handleRadioGroupKeyDown}
            >
                {speedOptions.map((option) => {
                    const isSelected = effectSpeed === option.value
                    return (
                        <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            aria-disabled={!effectEnabled}
                            disabled={!effectEnabled}
                            tabIndex={isSelected && effectEnabled ? 0 : -1}
                            onClick={() => {
                                if (!effectEnabled) return
                                setEffectSpeed(option.value)
                            }}
                            className={cn(
                                "flex items-center justify-center rounded-xl border p-3 text-sm outline-none transition-colors",
                                "focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-overlay",
                                isSelected
                                    ? "border-accent bg-accent/10 text-accent"
                                    : "border-default text-foreground hover:bg-default",
                            )}
                        >
                            {option.label}
                        </button>
                    )
                })}
            </div>
        </section>
    )
}
