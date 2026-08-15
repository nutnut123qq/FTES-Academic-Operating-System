"use client"

import React from "react"
import { cn } from "@heroui/react"
import {
    ArrowUpIcon,
    MeteorIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { AmbientBackground } from "@/components/blocks/layout/AmbientBackground"
import { useAppearanceStore } from "@/hooks/zustand/appearance/store"
import { BACKGROUND_EFFECTS } from "@/resources/constants/appearance"
import type {
    EffectDirection,
    EffectSpeed,
} from "@/resources/constants/appearance"
import { handleRadioGroupKeyDown } from "../radio-group"

/**
 * Particles per preview tile. The tiles are ~96px tall, so each effect's real
 * count (up to 70) would only add DOM nodes nobody can see — ten live previews on
 * one page is the reason this is capped.
 */
const PREVIEW_PARTICLE_COUNT = 12

/** One direction choice for the ambient spark field. */
interface DirectionOption {
    /** Store value this option writes. */
    value: EffectDirection
    /** Rendered icon (arrow-up / meteor). */
    icon: React.ReactNode
    /** Localized label. */
    label: string
}

/** One speed choice for the ambient spark field. */
interface SpeedOption {
    /** Store value this option writes. */
    value: EffectSpeed
    /** Localized label. */
    label: string
}

/**
 * EffectSection — "Hiệu ứng nền" group of the appearance settings: a radiogroup of
 * the ten ambient backgrounds (off · embers · waves · snow · rain · bubbles ·
 * fireflies · starfield · aurora · circuit), each tile previewing the real effect
 * live and tinted by the current accent. Picking "Embers" additionally reveals the
 * direction ("Bay lên" rise vs "Rơi xuống như sao băng" fall) and speed
 * radiogroups, which only that effect reads. Everything applies live on the
 * background behind the page; reduced-motion still wins at the CSS level.
 */
export const EffectSection = () => {
    const t = useTranslations()
    const effect = useAppearanceStore((state) => state.effect)
    const effectDirection = useAppearanceStore((state) => state.effectDirection)
    const effectSpeed = useAppearanceStore((state) => state.effectSpeed)
    const setEffect = useAppearanceStore((state) => state.setEffect)
    const setEffectDirection = useAppearanceStore((state) => state.setEffectDirection)
    const setEffectSpeed = useAppearanceStore((state) => state.setEffectSpeed)
    const isSparkField = effect === "ember"
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
            <div
                role="radiogroup"
                aria-label={t("appearance.effect.label")}
                className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                onKeyDown={handleRadioGroupKeyDown}
            >
                {BACKGROUND_EFFECTS.map((option) => {
                    const isSelected = effect === option
                    const label = t(`appearance.effect.names.${option}`)
                    return (
                        <button
                            key={option}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            aria-label={label}
                            tabIndex={isSelected ? 0 : -1}
                            onClick={() => setEffect(option)}
                            className={cn(
                                "relative flex h-24 flex-col justify-end overflow-hidden rounded-xl border p-2 text-left text-sm outline-none transition-colors",
                                "focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-overlay",
                                isSelected
                                    ? "border-accent text-accent"
                                    : "border-default text-foreground hover:bg-default",
                            )}
                        >
                            {/* the real effect, scaled into the tile (the block is
                                `fixed inset-0 -z-10` by default — the override pins it
                                inside this button instead) */}
                            <AmbientBackground
                                effect={option}
                                direction={effectDirection}
                                speed={effectSpeed}
                                count={PREVIEW_PARTICLE_COUNT}
                                className="absolute inset-0 z-0"
                            />
                            <span className="relative z-10 font-medium">{label}</span>
                        </button>
                    )
                })}
            </div>

            {/* direction + speed only steer the spark field ("Embers"); the other
                effects carry their own timing, so the controls stay hidden there */}
            {isSparkField ? (
                <>
                    <div className="text-sm text-muted">{t("appearance.effect.direction")}</div>
                    <div
                        role="radiogroup"
                        aria-label={t("appearance.effect.direction")}
                        className="grid grid-cols-2 gap-2"
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
                                    tabIndex={isSelected ? 0 : -1}
                                    onClick={() => setEffectDirection(option.value)}
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
                        className="grid grid-cols-3 gap-2"
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
                                    tabIndex={isSelected ? 0 : -1}
                                    onClick={() => setEffectSpeed(option.value)}
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
                </>
            ) : null}
        </section>
    )
}
