"use client"

import React from "react"
import { CaretLeftIcon, CaretRightIcon, QuotesIcon } from "@phosphor-icons/react"
import { Avatar, AvatarFallback, AvatarImage, Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { MENTORS } from "../content"

/** One mentor card — avatar (initials fallback), name, role, and their real quote. */
const MentorCard = ({ mentorKey, avatarUrl }: { mentorKey: string; avatarUrl: string }) => {
    const t = useTranslations("homeLanding")
    const name = t(`mentors.people.${mentorKey}.name`)
    return (
        <article className="flex min-w-[16rem] max-w-xs shrink-0 snap-start flex-col gap-4 rounded-3xl border border-separator bg-surface p-6 sm:min-w-0 sm:max-w-none">
            <div className="flex items-center gap-3">
                <Avatar size="lg" className="shrink-0">
                    {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
                    <AvatarFallback className="bg-accent/10 font-bold text-accent">
                        {name.replace(/^Mentor\s+/i, "").slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <Typography type="body" weight="bold" truncate>
                        {name}
                    </Typography>
                    <Typography type="body-sm" color="muted">
                        {t(`mentors.people.${mentorKey}.role`)}
                    </Typography>
                </div>
            </div>
            <QuotesIcon className="size-5 text-accent" aria-hidden focusable="false" />
            <Typography type="body-sm" color="muted" className="italic">
                {t(`mentors.people.${mentorKey}.quote`)}
            </Typography>
        </article>
    )
}

/**
 * "Đội ngũ FTES" — the five real mentors (Anh Khoa · Đức Hải · Thanh Huy · Nhật Huy ·
 * Ngọc Hiếu) with avatar, name, role, and their personal "chia sẻ" quote as crawlable
 * text. A snap-scroll carousel on small screens with keyboard-operable prev/next (scroll
 * by one card); a plain grid from `lg`. No autoplay (respects reduced motion by design —
 * nothing moves on its own). Avatar failures fall back to initials.
 */
export const MentorTeamSection = () => {
    const t = useTranslations("homeLanding")
    const scroller = React.useRef<HTMLDivElement>(null)

    const scrollBy = (dir: -1 | 1) => {
        const el = scroller.current
        if (!el) return
        el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" })
    }

    return (
        <section className="w-full border-y border-separator bg-default/20">
            <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
                <div className="mb-10 flex items-end justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <Typography type="body-sm" color="muted">
                            {t("mentors.eyebrow")}
                        </Typography>
                        <Typography type="h3" weight="bold">
                            {t("mentors.title")}
                        </Typography>
                    </div>
                    <div className="hidden shrink-0 gap-2 sm:flex lg:hidden">
                        <Button isIconOnly variant="secondary" aria-label={t("mentors.prev")} onPress={() => scrollBy(-1)}>
                            <CaretLeftIcon className="size-4" aria-hidden focusable="false" />
                        </Button>
                        <Button isIconOnly variant="secondary" aria-label={t("mentors.next")} onPress={() => scrollBy(1)}>
                            <CaretRightIcon className="size-4" aria-hidden focusable="false" />
                        </Button>
                    </div>
                </div>

                <div
                    ref={scroller}
                    className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible xl:grid-cols-5"
                >
                    {MENTORS.map((mentor) => (
                        <MentorCard key={mentor.key} mentorKey={mentor.key} avatarUrl={mentor.avatarUrl} />
                    ))}
                </div>
            </div>
        </section>
    )
}
