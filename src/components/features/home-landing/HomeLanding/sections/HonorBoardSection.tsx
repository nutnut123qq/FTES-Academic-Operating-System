"use client"

import React from "react"
import { TrophyIcon, ArrowRightIcon } from "@phosphor-icons/react"
import { Button, Chip, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { ACHIEVERS } from "../content"
import type { Achiever } from "../content"

/** Gold metallic gradient — built from the theme-aware `warning` token so it lives in both themes. */
const GOLD_TEXT_GRADIENT =
    "linear-gradient(100deg, color-mix(in srgb, var(--warning) 60%, var(--foreground)) 0%, var(--warning) 40%, color-mix(in srgb, var(--warning) 55%, white) 62%, var(--warning) 100%)"

/**
 * Circular portrait. `zoomFace` handles the legacy award posters (square image with the
 * name baked in around y≈75%): a scale(2.4) from origin 50% 28% frames just the face —
 * measured against the real 2480² posters (faces sit at ~47–53% x, ~31% y; baked name
 * and laurels fall outside the window). On failure (or a missing URL) an initials tile
 * in the same gold ring keeps the layout intact.
 */
const AchieverPortrait = ({
    src,
    name,
    zoomFace,
    className,
}: {
    src: string
    name: string
    zoomFace?: boolean
    className?: string
}) => {
    const [failed, setFailed] = React.useState(false)
    const initials = name
        .split(/\s+/)
        .map((word) => word[0])
        .slice(-2)
        .join("")
        .toUpperCase()
    return (
        <div className={cn("aspect-square overflow-hidden rounded-full border-2 border-warning/50", className)}>
            {failed || !src ? (
                <div className="flex size-full items-center justify-center bg-warning/10">
                    <span className="text-base font-semibold text-warning">{initials}</span>
                </div>
            ) : (
                <img
                    src={src}
                    alt={name}
                    loading="lazy"
                    onError={() => setFailed(true)}
                    className={cn("size-full object-cover", zoomFace && "origin-[50%_28%] scale-[2.4]")}
                />
            )}
        </div>
    )
}

/**
 * One ranked row of the board: rank number → portrait (top 3 only) → name → highlight chip → lines.
 * Ranks 1–3 carry the gold emphasis (bold gold rank, portrait, gradient name); the rest stay plain
 * so the list reads as a leaderboard rather than six equal cards.
 */
const HonorRow = ({ achiever, rank }: { achiever: Achiever; rank: number }) => {
    const t = useTranslations("homeLanding")
    const name = t(`honor.people.${achiever.key}.name`)
    const lines = Array.from({ length: achiever.lineCount }, (_, li) => li)
    const isTop = rank <= 3
    return (
        <li className="flex items-start gap-3 p-4 transition-colors duration-300 hover:bg-warning/5 sm:gap-4 sm:px-5">
            <span
                className={cn(
                    "w-6 shrink-0 pt-0.5 text-center tabular-nums",
                    isTop ? "text-lg font-bold text-warning" : "text-base font-semibold text-muted",
                )}
            >
                {rank}
            </span>
            {isTop && (
                <AchieverPortrait
                    src={achiever.imageUrl}
                    name={name}
                    zoomFace={achiever.poster}
                    className="w-14 shrink-0 sm:w-16"
                />
            )}
            <div className="flex min-w-0 flex-col gap-2">
                {isTop ? (
                    <span
                        className="bg-clip-text text-base font-bold uppercase tracking-wide text-transparent"
                        style={{ backgroundImage: GOLD_TEXT_GRADIENT }}
                    >
                        {name}
                    </span>
                ) : (
                    <Typography type="body" weight="semibold">
                        {name}
                    </Typography>
                )}
                <Chip size="sm" variant="soft" color="warning" className="self-start">
                    {achiever.highlight}
                </Chip>
                <ul className="flex flex-col gap-2">
                    {lines.map((li) => (
                        <li key={li}>
                            <Typography type="body-sm" color="muted">
                                {t(`honor.people.${achiever.key}.lines.${li}`)}
                            </Typography>
                        </li>
                    ))}
                </ul>
            </div>
        </li>
    )
}

/**
 * "Bảng vàng FTES" — a single ranked list (featured achievers first, then the rest) on one
 * glass surface over ambient gold orbs; only the top 3 carry a portrait. Gold = the
 * theme-aware `warning` token (restored 2026-08-10: the accent recolor of 2026-07-03 lost
 * the "bảng vàng" reading). All text lives in the DOM — nothing depends on the baked-in
 * poster typography. Links to `/leaderboard`; hides when empty.
 */
export const HonorBoardSection = () => {
    const t = useTranslations("homeLanding")
    const router = useRouter()

    if (ACHIEVERS.length === 0) return null

    // Featured achievers take ranks 1–3 (the only rows with a portrait), the rest follow in order.
    const ranked = [
        ...ACHIEVERS.filter((achiever) => achiever.featured),
        ...ACHIEVERS.filter((achiever) => !achiever.featured),
    ]

    return (
        <section className="relative isolate mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-24 left-1/4 size-96 rounded-full bg-warning/10 blur-3xl" />
                <div className="absolute right-0 top-1/3 size-80 rounded-full bg-warning/5 blur-3xl" />
            </div>

            <div className="mb-10 flex flex-col items-center gap-2 text-center">
                <TrophyIcon className="size-6 text-warning" aria-hidden focusable="false" />
                <Typography type="h3" weight="bold">
                    {t("honor.title")}
                </Typography>
                <Typography type="body" color="muted" className="max-w-2xl">
                    {t("honor.subline")}
                </Typography>
            </div>

            <ol className="mx-auto flex max-w-3xl flex-col divide-y divide-separator overflow-hidden rounded-2xl border border-separator bg-surface/60 backdrop-blur-md">
                {ranked.map((achiever, index) => (
                    <HonorRow key={achiever.key} achiever={achiever} rank={index + 1} />
                ))}
            </ol>

            <div className="mt-8 flex justify-center">
                <Button variant="secondary" onPress={() => router.push("/leaderboard")}>
                    {t("honor.cta")}
                    <ArrowRightIcon className="size-4" aria-hidden focusable="false" />
                </Button>
            </div>
        </section>
    )
}
