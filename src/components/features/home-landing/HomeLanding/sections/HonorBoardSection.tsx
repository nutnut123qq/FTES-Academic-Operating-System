"use client"

import React from "react"
import { TrophyIcon, CheckCircleIcon, ArrowRightIcon } from "@phosphor-icons/react"
import { Button, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { ACHIEVERS } from "../content"

/** Achiever portrait with a graceful initials fallback on image load failure. */
const AchieverImage = ({ src, name }: { src: string; name: string }) => {
    const [failed, setFailed] = React.useState(false)
    if (failed || !src) {
        return (
            <div className="flex aspect-square w-full items-center justify-center rounded-large bg-accent/10 text-3xl font-bold text-accent">
                {name.slice(0, 1).toUpperCase()}
            </div>
        )
    }
    return (
        <img
            src={src}
            alt={name}
            loading="lazy"
            onError={() => setFailed(true)}
            className="aspect-square w-full rounded-large object-cover"
        />
    )
}

/**
 * "Bảng vàng FTES" — real honored learners (Kim Khoa, Hoàng Blue, Hoàng Duy, Hồng Phúc,
 * Phan Chi Thông, Trần Việt) with portrait, name, and achievement lines, linking to the
 * full `/leaderboard`. Portrait failures fall back to initials without breaking layout;
 * the whole section hides when there are no achievers.
 */
export const HonorBoardSection = () => {
    const t = useTranslations("homeLanding")
    const router = useRouter()

    if (ACHIEVERS.length === 0) return null

    return (
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <div className="mb-10 flex flex-col items-center gap-2 text-center">
                <span className="flex items-center gap-2 text-accent">
                    <TrophyIcon className="size-6" aria-hidden focusable="false" />
                </span>
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
                        <div key={achiever.key} className={cn("flex flex-col gap-4 rounded-large border border-separator bg-surface p-5")}>
                            <div className="w-full max-w-[8rem]">
                                <AchieverImage src={achiever.imageUrl} name={name} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Typography type="h6" weight="bold">
                                    {name}
                                </Typography>
                                <ul className="flex flex-col gap-1.5">
                                    {lines.map((li) => (
                                        <li key={li} className="flex items-start gap-2">
                                            <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-success" aria-hidden focusable="false" />
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
