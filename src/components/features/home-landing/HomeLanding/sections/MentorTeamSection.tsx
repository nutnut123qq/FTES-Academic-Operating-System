"use client"

import React from "react"
import { QuotesIcon } from "@phosphor-icons/react"
import { Avatar, AvatarFallback, AvatarImage, Link, Typography } from "@heroui/react"
import { FaFacebook, FaGithub, FaLinkedin } from "react-icons/fa6"
import { useTranslations } from "next-intl"
import { FOUNDER } from "../content"

/** Founder social proof links (brand-icon row in the byline). */
const FOUNDER_SOCIALS = [
    { key: "github", href: FOUNDER.github, icon: FaGithub, label: "GitHub" },
    { key: "linkedin", href: FOUNDER.linkedin, icon: FaLinkedin, label: "LinkedIn" },
    { key: "facebook", href: FOUNDER.facebook, icon: FaFacebook, label: "Facebook" },
] as const

/**
 * "Đội ngũ FTES" — founder beat (mirrors StarCi's Founder section): a single blunt
 * quote as the hero, closed by a byline (avatar · name · role · social proof). No
 * carousel, no autoplay. Avatar failures fall back to initials.
 */
export const MentorTeamSection = () => {
    const t = useTranslations("homeLanding")
    const name = t("mentors.founder.name")

    return (
        <section className="w-full border-y border-separator bg-default/20">
            <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
                <div className="mb-10 flex flex-col gap-2">
                    <Typography type="body-sm" color="muted">
                        {t("mentors.eyebrow")}
                    </Typography>
                    <Typography type="h3" weight="bold">
                        {t("mentors.title")}
                    </Typography>
                </div>

                <div className="overflow-hidden rounded-2xl border border-separator bg-surface">
                    {/* the quote is the hero; the founder recedes to a byline (who's saying this) */}
                    <div className="flex flex-col gap-4 px-6 py-8 sm:px-8">
                        <QuotesIcon className="size-6 text-accent" aria-hidden focusable="false" />
                        <Typography type="body" className="italic sm:text-lg">
                            {t("mentors.founder.quote")}
                        </Typography>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 border-t border-separator px-6 py-4 sm:px-8">
                        <Avatar size="lg" className="shrink-0">
                            {FOUNDER.avatarUrl ? <AvatarImage src={FOUNDER.avatarUrl} alt={name} /> : null}
                            <AvatarFallback className="bg-accent/10 font-bold text-accent">
                                {name.slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <Typography type="body" weight="bold" truncate>
                                {name}
                            </Typography>
                            <Typography type="body-sm" color="muted">
                                {t("mentors.founder.role")}
                            </Typography>
                        </div>
                        <div className="flex items-center gap-3 sm:ml-auto">
                            {FOUNDER_SOCIALS.map(({ key, href, icon: Icon, label }) => (
                                <Link
                                    key={key}
                                    href={href}
                                    target="_blank"
                                    aria-label={label}
                                    className="text-muted transition-colors hover:text-accent"
                                >
                                    <Icon aria-hidden className="size-5" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
