"use client"

import React from "react"
import { TrophyIcon, ArrowRightIcon } from "@phosphor-icons/react"
import { Button, Chip, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { ACHIEVERS } from "../content"
import type { Achiever } from "../content"

/** Metallic name gradient — built from the theme `accent` token so it matches the site palette in both themes. */
const ACCENT_TEXT_GRADIENT =
    "linear-gradient(100deg, color-mix(in srgb, var(--accent) 60%, var(--foreground)) 0%, var(--accent) 40%, color-mix(in srgb, var(--accent) 55%, white) 62%, var(--accent) 100%)"

/** Observe once: flips true the first time the element enters the viewport, then disconnects. */
const useInViewOnce = <T extends HTMLElement>() => {
    const ref = React.useRef<T>(null)
    const [inView, setInView] = React.useState(false)
    React.useEffect(() => {
        const el = ref.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.3 },
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])
    return { ref, inView }
}

/**
 * Hero metric of a podium card — the highlight string ("GPA 9.6", "TOP 100 · 3 kỳ")
 * with its first number counting up once when the card scrolls into view.
 * `prefers-reduced-motion` (or no number at all) renders the final text immediately.
 */
const HighlightMetric = ({ value }: { value: string }) => {
    const { ref, inView } = useInViewOnce<HTMLSpanElement>()
    // ponytail: first number in the string is "the" metric — enough for GPA/TOP-N highlights
    const match = value.match(/\d+(?:\.\d+)?/)
    const target = match ? Number.parseFloat(match[0]) : 0
    const decimals = match?.[0].split(".")[1]?.length ?? 0
    const [display, setDisplay] = React.useState(target)
    React.useEffect(() => {
        if (!inView || !match) return
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setDisplay(target)
            return
        }
        const startedAt = performance.now()
        let raf = 0
        const tick = (now: number) => {
            const progress = Math.min((now - startedAt) / 900, 1)
            setDisplay(target * (1 - Math.pow(1 - progress, 3)))
            if (progress < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [inView])
    // Long highlights ("TOP 100 · 3 kỳ") drop a size so they never wrap inside the card.
    const sizeClass = value.length > 9 ? "text-2xl" : "text-3xl"
    if (!match) {
        return (
            <span ref={ref} className={cn("whitespace-nowrap font-semibold text-accent", sizeClass)}>
                {value}
            </span>
        )
    }
    const prefix = value.slice(0, match.index)
    const suffix = value.slice((match.index ?? 0) + match[0].length)
    return (
        <span ref={ref} className={cn("whitespace-nowrap font-semibold tabular-nums text-accent", sizeClass)}>
            {prefix}
            {display.toFixed(decimals)}
            {suffix}
        </span>
    )
}

/**
 * Circular portrait. `zoomFace` handles the legacy award posters (square image with the
 * name baked in around y≈75%): a scale(2.4) from origin 50% 28% frames just the face —
 * measured against the real 2480² posters (faces sit at ~47–53% x, ~31% y; baked name
 * and laurels fall outside the window). On failure (or a missing URL) an initials tile
 * in the same accent ring keeps the layout intact.
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
        <div className={cn("aspect-square overflow-hidden rounded-full border-2 border-accent/50", className)}>
            {failed || !src ? (
                <div className="flex size-full items-center justify-center bg-accent/10">
                    <span className="text-xl font-semibold text-accent">{initials}</span>
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

/** Large glass podium card: accent-ringed portrait → gradient name → hero metric → lines. */
const PodiumCard = ({ achiever, position }: { achiever: Achiever; position: number }) => {
    const t = useTranslations("homeLanding")
    const name = t(`honor.people.${achiever.key}.name`)
    const lines = Array.from({ length: achiever.lineCount }, (_, li) => li)
    return (
        <div
            className={cn(
                "relative flex flex-col items-center gap-3 rounded-2xl border border-separator bg-surface/60 p-6 text-center backdrop-blur-md",
                "transition-all duration-300 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/20",
                position === 0 && "sm:order-2",
                position === 1 && "sm:order-1 sm:mt-6",
                position === 2 && "sm:order-3 sm:mt-6",
            )}
        >
            <div className="rounded-full border border-accent/30 p-2">
                <AchieverPortrait src={achiever.imageUrl} name={name} zoomFace={achiever.poster} className="w-28" />
            </div>
            <span
                className="bg-clip-text text-xl font-bold uppercase tracking-wide text-transparent"
                style={{ backgroundImage: ACCENT_TEXT_GRADIENT }}
            >
                {name}
            </span>
            <HighlightMetric value={achiever.highlight} />
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
    )
}

/** Compact glass row card for the non-featured achievers. */
const AchieverRowCard = ({ achiever }: { achiever: Achiever }) => {
    const t = useTranslations("homeLanding")
    const name = t(`honor.people.${achiever.key}.name`)
    const lines = Array.from({ length: achiever.lineCount }, (_, li) => li)
    return (
        <div className="flex gap-3 rounded-2xl border border-separator bg-surface/60 p-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/20">
            <AchieverPortrait
                src={achiever.imageUrl}
                name={name}
                zoomFace={achiever.poster}
                className="w-14 shrink-0 self-start"
            />
            <div className="flex min-w-0 flex-col gap-2">
                <Typography type="body" weight="semibold">
                    {name}
                </Typography>
                <Chip size="sm" variant="soft" color="accent" className="self-start">
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
        </div>
    )
}

/**
 * "Bảng vàng FTES" — tiered podium (2-1-3, center elevated) + compact grid, glass cards
 * with a soft accent glow over ambient accent orbs. All text lives in the DOM (gradient
 * name, count-up hero metric) — nothing depends on the baked-in poster typography.
 * Highlight color = the theme `accent` token, accent-only (recolored from gold
 * 2026-07-03: the standalone warning/gold palette clashed with the site's primary
 * accent). Links to `/leaderboard`; hides when empty.
 */
export const HonorBoardSection = () => {
    const t = useTranslations("homeLanding")
    const router = useRouter()

    if (ACHIEVERS.length === 0) return null

    const podium = ACHIEVERS.filter((achiever) => achiever.featured)
    const rest = ACHIEVERS.filter((achiever) => !achiever.featured)

    return (
        <section className="relative isolate mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-24 left-1/4 size-96 rounded-full bg-accent/10 blur-3xl" />
                <div className="absolute right-0 top-1/3 size-80 rounded-full bg-accent/5 blur-3xl" />
            </div>

            <div className="mb-10 flex flex-col items-center gap-2 text-center">
                <TrophyIcon className="size-6 text-accent" aria-hidden focusable="false" />
                <Typography type="h3" weight="bold">
                    {t("honor.title")}
                </Typography>
                <Typography type="body" color="muted" className="max-w-2xl">
                    {t("honor.subline")}
                </Typography>
            </div>

            {podium.length > 0 && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {podium.map((achiever, position) => (
                        <PodiumCard key={achiever.key} achiever={achiever} position={position} />
                    ))}
                </div>
            )}

            {rest.length > 0 && (
                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {rest.map((achiever) => (
                        <AchieverRowCard key={achiever.key} achiever={achiever} />
                    ))}
                </div>
            )}

            <div className="mt-8 flex justify-center">
                <Button variant="secondary" onPress={() => router.push("/leaderboard")}>
                    {t("honor.cta")}
                    <ArrowRightIcon className="size-4" aria-hidden focusable="false" />
                </Button>
            </div>
        </section>
    )
}
