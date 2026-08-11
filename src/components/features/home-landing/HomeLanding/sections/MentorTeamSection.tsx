"use client"

import React from "react"
import {
    ArrowRightIcon,
    CaretLeftIcon,
    CaretRightIcon,
    FacebookLogoIcon,
    GithubLogoIcon,
    LinkedinLogoIcon,
    QuotesIcon,
} from "@phosphor-icons/react"
import { Avatar, AvatarFallback, AvatarImage, Link, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useCarousel } from "@/components/blocks/carousel/useCarousel"
// Link nội bộ phải qua next-intl để giữ prefix locale (link ngoài vẫn dùng Link của HeroUI).
import { Link as NextIntlLink } from "@/i18n/navigation"
import { TESTIMONIALS } from "../content"
import type { Testimonial } from "../content"

/** Slower cadence than the course hero — testimonials need reading time. */
const TESTIMONIAL_INTERVAL_MS = 6_000

/** Social brand-icon columns, rendered only for the links a testimonial actually has. */
const SOCIAL_ICONS = [
    { key: "github", icon: GithubLogoIcon, label: "GitHub" },
    { key: "linkedin", icon: LinkedinLogoIcon, label: "LinkedIn" },
    { key: "facebook", icon: FacebookLogoIcon, label: "Facebook" },
] as const

/** One testimonial slide — quote card + byline (avatar · name · role · socials · profile). */
const TestimonialSlide = ({ person }: { person: Testimonial }) => {
    const t = useTranslations("homeLanding")
    const name = t(`mentors.quotes.${person.key}.name`)
    // keep only the socials this person has, carrying the resolved href for typing
    const socials = SOCIAL_ICONS.map((social) => ({ ...social, href: person[social.key] })).filter(
        (social): social is typeof social & { href: string } => Boolean(social.href),
    )

    return (
        <figure className="w-full shrink-0 snap-center">
            <div className="overflow-hidden rounded-2xl border border-separator bg-surface">
                {/* the quote is the hero; the mentor recedes to a byline (who's saying this) */}
                <div className="flex flex-col gap-4 px-6 py-8 sm:px-8">
                    <QuotesIcon className="size-6 text-accent" aria-hidden focusable="false" />
                    <Typography type="body" className="italic sm:text-lg">
                        {t(`mentors.quotes.${person.key}.quote`)}
                    </Typography>
                </div>
                <figcaption className="flex flex-wrap items-center gap-3 border-t border-separator px-6 py-4 sm:px-8">
                    <Avatar size="lg" className="shrink-0">
                        {person.avatarUrl ? <AvatarImage src={person.avatarUrl} alt={name} /> : null}
                        <AvatarFallback className="bg-accent/10 font-bold text-accent">
                            {name.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <Typography type="body" weight="bold" truncate>
                            {name}
                        </Typography>
                        <Typography type="body-sm" color="muted">
                            {t(`mentors.quotes.${person.key}.role`)}
                        </Typography>
                    </div>
                    <div className="flex items-center gap-3 sm:ml-auto">
                        {socials.map(({ key, href, icon: SocialIcon, label }) => (
                            <Link
                                key={key}
                                href={href}
                                target="_blank"
                                aria-label={label}
                                className="text-muted transition-colors hover:text-accent"
                            >
                                <SocialIcon aria-hidden focusable="false" className="size-5" />
                            </Link>
                        ))}
                        {/* môn đang dạy — chỉ render khi content.ts có khai `courseSlugs`; không
                            có dữ liệu thì cụm này biến mất chứ không hiện số 0 */}
                        {person.courseSlugs?.length ? (
                            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                                <Typography type="body-sm" color="muted">
                                    {t("mentors.teaching", { count: person.courseSlugs.length })}
                                </Typography>
                                {person.courseSlugs.map((slug) => (
                                    <NextIntlLink
                                        key={slug}
                                        href={`/courses/${slug}`}
                                        className="text-sm font-medium text-accent no-underline hover:underline"
                                    >
                                        {slug.toUpperCase()}
                                    </NextIntlLink>
                                ))}
                            </div>
                        ) : null}
                        {/* profile = "go meet + judge this mentor yourself" CTA */}
                        <Link
                            href={person.profileUrl}
                            target="_blank"
                            className="inline-flex items-center gap-2 text-accent"
                        >
                            {t("mentors.viewProfile")}
                            <ArrowRightIcon aria-hidden focusable="false" className="size-4" />
                        </Link>
                    </div>
                </figcaption>
            </div>
        </figure>
    )
}

/**
 * "Đội ngũ FTES" — the team beat, now a CAROUSEL of the five real FTES mentors (founder
 * Nguyễn Anh Khoa + team), each a quote card with a byline. Built on the shared
 * {@link useCarousel} hook (native CSS scroll-snap, NO carousel dependency): one
 * testimonial shows at a time, prev/next arrows + dots drive `scrollTo`, autoplay
 * (~6s) wraps around and pauses on hover / focus-within / hidden tab and under
 * `prefers-reduced-motion`. Keeps the original band + card styling for a drop-in swap.
 * ARIA follows the WAI-ARIA carousel pattern (labeled region, labeled controls,
 * ArrowLeft/ArrowRight on the region, aria-live off while autoplaying).
 */
export const MentorTeamSection = () => {
    const t = useTranslations("homeLanding")
    const slideCount = TESTIMONIALS.length
    const { trackRef, activeIndex, isAutoplaying, scrollToIndex, next, prev, pauseHandlers } = useCarousel(
        slideCount,
        { intervalMs: TESTIMONIAL_INTERVAL_MS },
    )
    const hasMultiple = slideCount > 1

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

                <div
                    role="region"
                    aria-roledescription="carousel"
                    aria-label={t("mentors.regionLabel")}
                    onKeyDown={(event) => {
                        if (!hasMultiple) return
                        if (event.key === "ArrowRight") {
                            event.preventDefault()
                            next()
                        } else if (event.key === "ArrowLeft") {
                            event.preventDefault()
                            prev()
                        }
                    }}
                    {...pauseHandlers}
                >
                    <div
                        ref={trackRef}
                        // announce slide changes only when the user drives them
                        aria-live={isAutoplaying ? "off" : "polite"}
                        className="flex w-full snap-x snap-mandatory overflow-x-auto rounded-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        {TESTIMONIALS.map((person) => (
                            <TestimonialSlide key={person.key} person={person} />
                        ))}
                    </div>

                    {/* controls row (arrows + dots) sits under the card — no overlap with the quote */}
                    {hasMultiple ? (
                        <div className="mt-6 flex items-center justify-center gap-4">
                            <button
                                type="button"
                                aria-label={t("mentors.prev")}
                                onClick={prev}
                                className="flex size-10 items-center justify-center rounded-full border border-separator bg-surface text-foreground shadow-sm transition hover:bg-default"
                            >
                                <CaretLeftIcon className="size-5" aria-hidden focusable="false" />
                            </button>
                            <div className="flex items-center gap-2">
                                {TESTIMONIALS.map((person, index) => (
                                    <button
                                        key={person.key}
                                        type="button"
                                        aria-label={t("mentors.goToSlide", { index: index + 1 })}
                                        aria-current={index === activeIndex ? "true" : undefined}
                                        onClick={() => scrollToIndex(index)}
                                        className={cn(
                                            "size-2.5 rounded-full transition-colors",
                                            index === activeIndex ? "bg-accent" : "bg-default hover:bg-muted",
                                        )}
                                    />
                                ))}
                            </div>
                            <button
                                type="button"
                                aria-label={t("mentors.next")}
                                onClick={next}
                                className="flex size-10 items-center justify-center rounded-full border border-separator bg-surface text-foreground shadow-sm transition hover:bg-default"
                            >
                                <CaretRightIcon className="size-5" aria-hidden focusable="false" />
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </section>
    )
}
