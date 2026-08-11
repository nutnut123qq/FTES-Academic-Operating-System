"use client"

import React from "react"
import { TrophyIcon, ArrowRightIcon } from "@phosphor-icons/react"
import { Button, Chip, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link, useRouter } from "@/i18n/navigation"
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
 * Podium stagger from `sm:` up: rank 1 centre and raised, 2 left, 3 right. DOM order stays 1, 2, 3,
 * so the single-column mobile stack and screen readers both read the ranking straight down.
 *
 * Placed by explicit grid cell rather than flex `order` (what the pre-list version used): the cell
 * each rank lands in is stated outright instead of being derived from source order, so the mobile
 * stack can never disagree with the desktop podium. Verified at 375 and 1280.
 */
const PODIUM_CELL = [
    "sm:col-start-2 sm:row-start-1",
    "sm:col-start-1 sm:row-start-1 sm:mt-6",
    "sm:col-start-3 sm:row-start-1 sm:mt-6",
] as const

/** Name in the gold metallic gradient — shared by the podium cards and the list rows. */
const GoldName = ({ name, size }: { name: string; size: "card" | "row" }) => (
    <span
        className={cn(
            "bg-clip-text font-bold uppercase tracking-wide text-transparent",
            size === "card" ? "text-xl" : "text-base",
        )}
        style={{ backgroundImage: GOLD_TEXT_GRADIENT }}
    >
        {name}
    </span>
)

/**
 * `text-warning` on the anchor exists only so the underline picks up the gold: the name inside is a
 * `text-transparent` + `bg-clip-text` gradient span, so the anchor colour never touches the glyphs —
 * but `text-decoration` is painted in the anchor's colour, and without this it draws a black rule
 * under gold text.
 */
const MaybeLink = ({ href, children }: { href?: string; children: React.ReactNode }) =>
    href ? (
        <Link href={href} className="self-start text-warning hover:underline">
            {children}
        </Link>
    ) : (
        <>{children}</>
    )

/**
 * Podium card for ranks 1–3 — the pre-list treatment the team asked to keep: large ringed portrait,
 * gradient name, oversized highlight, then the achievement lines. Carries a rank badge so the board
 * still reads 1, 2, 3 → 4, 5… once the list below takes over.
 */
const PodiumCard = ({ achiever, position }: { achiever: Achiever; position: number }) => {
    const t = useTranslations("homeLanding")
    const name = t(`honor.people.${achiever.key}.name`)
    const lines = Array.from({ length: achiever.lineCount }, (_, li) => li)
    return (
        <div
            className={cn(
                "relative flex flex-col items-center gap-3 rounded-2xl border border-separator bg-surface/60 p-6 text-center backdrop-blur-md",
                "transition-all duration-300 hover:border-warning/40 hover:shadow-lg hover:shadow-warning/20",
                PODIUM_CELL[position],
            )}
        >
            <span className="absolute left-4 top-4 flex size-7 items-center justify-center rounded-full bg-warning/15 text-sm font-bold tabular-nums text-warning">
                {position + 1}
            </span>
            <div className="rounded-full border border-warning/30 p-2">
                <AchieverPortrait src={achiever.imageUrl} name={name} zoomFace={achiever.poster} className="w-28" />
            </div>
            <MaybeLink href={achiever.href}>
                <GoldName name={name} size="card" />
            </MaybeLink>
            {/* Long highlights ("CÓC VÀNG · SP25") drop a size so they never wrap inside the card. */}
            <span
                className={cn(
                    "whitespace-nowrap font-semibold text-warning",
                    achiever.highlight.length > 9 ? "text-2xl" : "text-3xl",
                )}
            >
                {achiever.highlight}
            </span>
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

/**
 * One list row — used from rank 4 down, where the board turns into a plain leaderboard: rank number
 * → name → highlight chip → lines. No portrait: the podium above owns the faces.
 */
const HonorRow = ({ achiever, rank }: { achiever: Achiever; rank: number }) => {
    const t = useTranslations("homeLanding")
    const name = t(`honor.people.${achiever.key}.name`)
    const lines = Array.from({ length: achiever.lineCount }, (_, li) => li)
    return (
        <li className="flex items-start gap-3 p-4 transition-colors duration-300 hover:bg-warning/5 sm:gap-4 sm:px-5">
            <span className="w-6 shrink-0 pt-0.5 text-center text-base font-semibold tabular-nums text-muted">
                {rank}
            </span>
            <div className="flex min-w-0 flex-col gap-2">
                <MaybeLink href={achiever.href}>
                    <Typography type="body" weight="semibold">
                        {name}
                    </Typography>
                </MaybeLink>
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
 * "Bảng vàng FTES" — podium for ranks 1–3, plain list from rank 4 down.
 *
 * The board went all-list on 2026-08-10 and the team pushed back the same day: ranks 1–3 keep the
 * card treatment ("hiện như cũ"), only rank 4 onward becomes a list. Gold = the theme-aware
 * `warning` token. `featured` seeds the order; the podium is always the first THREE, so adding a
 * fourth featured achiever promotes them into the list rather than widening the podium.
 *
 * All text lives in the DOM — nothing depends on the baked-in poster typography. Links to
 * `/leaderboard`; hides when empty.
 */
export const HonorBoardSection = () => {
    const t = useTranslations("homeLanding")
    const router = useRouter()

    if (ACHIEVERS.length === 0) return null

    const ranked = [
        ...ACHIEVERS.filter((achiever) => achiever.featured),
        ...ACHIEVERS.filter((achiever) => !achiever.featured),
    ]
    const podium = ranked.slice(0, 3)
    const rest = ranked.slice(3)

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

            {podium.length > 0 && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {podium.map((achiever, position) => (
                        <PodiumCard key={achiever.key} achiever={achiever} position={position} />
                    ))}
                </div>
            )}

            {rest.length > 0 && (
                <ol
                    start={podium.length + 1}
                    className="mx-auto mt-6 flex max-w-3xl flex-col divide-y divide-separator overflow-hidden rounded-2xl border border-separator bg-surface/60 backdrop-blur-md"
                >
                    {rest.map((achiever, index) => (
                        <HonorRow key={achiever.key} achiever={achiever} rank={podium.length + index + 1} />
                    ))}
                </ol>
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
