"use client"

import React from "react"
import { TrophyIcon, StarIcon, ArrowRightIcon } from "@phosphor-icons/react"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { ACHIEVERS } from "../content"

/**
 * Award cover — the branded "bảng vàng" graphic shown WHOLE (object-contain, no crop
 * of the gold laurel / baked-in name) on a neutral framed panel. On load failure it
 * falls back to a trophy + the name so the identity is never lost.
 */
const AchieverCover = ({ src, name }: { src: string; name: string }) => {
    const [failed, setFailed] = React.useState(false)
    if (failed || !src) {
        return (
            <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-default/60 text-warning">
                <TrophyIcon className="size-8" aria-hidden focusable="false" />
                <Typography type="body-sm" weight="bold">
                    {name}
                </Typography>
            </div>
        )
    }
    return (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-default/60">
            <img
                src={src}
                alt={name}
                loading="lazy"
                onError={() => setFailed(true)}
                className="max-h-full max-w-full object-contain"
            />
        </div>
    )
}

/**
 * "Bảng vàng FTES" — direction A (chosen 2026-07-03): premium honor cards that make the
 * branded gold award graphic the HERO (full-width cover, no crop, name lives in the
 * graphic so it isn't repeated), with a gold highlight chip (rank/GPA) and star-marked
 * achievement lines. Cards stretch to equal height per row; the "gold" accent uses the
 * theme-aware `warning` token so it works in light + dark. Links to `/leaderboard`;
 * hides when there are no achievers.
 */
export const HonorBoardSection = () => {
    const t = useTranslations("homeLanding")
    const router = useRouter()

    if (ACHIEVERS.length === 0) return null

    return (
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <div className="mb-10 flex flex-col items-center gap-2 text-center">
                <TrophyIcon className="size-6 text-warning" aria-hidden focusable="false" />
                <Typography type="h3" weight="bold">
                    {t("honor.title")}
                </Typography>
                <Typography type="body" color="muted" className="max-w-2xl">
                    {t("honor.subline")}
                </Typography>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ACHIEVERS.map((achiever) => {
                    const lines = Array.from({ length: achiever.lineCount }, (_, li) => li)
                    const name = t(`honor.people.${achiever.key}.name`)
                    return (
                        <div
                            key={achiever.key}
                            className="flex h-full flex-col overflow-hidden rounded-large border border-separator bg-surface transition-colors hover:border-warning/40"
                        >
                            <AchieverCover src={achiever.imageUrl} name={name} />
                            <div className="flex flex-1 flex-col gap-3 p-4">
                                <Chip size="sm" variant="soft" color="warning" className="self-start">
                                    {achiever.highlight}
                                </Chip>
                                <ul className="flex flex-1 flex-col gap-2">
                                    {lines.map((li) => (
                                        <li key={li} className="flex items-start gap-2">
                                            <StarIcon
                                                weight="fill"
                                                className="mt-0.5 size-4 shrink-0 text-warning"
                                                aria-hidden
                                                focusable="false"
                                            />
                                            <Typography type="body-sm" color="muted">
                                                {t(`honor.people.${achiever.key}.lines.${li}`)}
                                            </Typography>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="mt-8 flex justify-center">
                <Button variant="secondary" onPress={() => router.push("/leaderboard")}>
                    {t("honor.cta")}
                    <ArrowRightIcon className="size-4" aria-hidden focusable="false" />
                </Button>
            </div>
        </section>
    )
}
