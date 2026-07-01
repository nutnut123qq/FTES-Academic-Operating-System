"use client"

import React, { useEffect, useRef, useState } from "react"
import {
    BookOpenIcon,
    MedalIcon,
    StackIcon,
    UsersIcon,
} from "@phosphor-icons/react"
import { Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useQueryPlatformStatsSwr } from "@/hooks/swr/api/graphql/queries/useQueryPlatformStatsSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/** Props for {@link StatStrip}. */
export type StatStripProps = WithClassNames<undefined>

/** How long a figure counts up from 0 → its value (ms). */
const COUNT_DURATION = 1500

/** Fallback figures when the public stats query fails — show 99 for every counter
 * (teacher's choice) so the proof strip still renders instead of vanishing. */
const FALLBACK_STATS = {
    totalLearners: 99,
    totalLessons: 99,
    totalCourses: 99,
    totalBadgesEarned: 99,
} as const

/**
 * Counts a number from 0 → `target` the first time it scrolls into view, eased
 * out via requestAnimationFrame. Respects `prefers-reduced-motion` (snaps to the
 * final figure, no animation). Returns the ref to attach + the current value.
 */
const useCountUp = (target: number) => {
    const ref = useRef<HTMLDivElement>(null)
    const [value, setValue] = useState(0)

    useEffect(() => {
        const element = ref.current
        if (!element) {
            return
        }
        // reduced motion → show the final figure immediately
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setValue(target)
            return
        }
        let raf = 0
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) {
                    return
                }
                // fire once — the count-up should not replay on re-entry
                observer.disconnect()
                const start = performance.now()
                const tick = (now: number) => {
                    const progress = Math.min((now - start) / COUNT_DURATION, 1)
                    // ease-out cubic: fast then settling
                    const eased = 1 - Math.pow(1 - progress, 3)
                    setValue(Math.round(target * eased))
                    if (progress < 1) {
                        raf = requestAnimationFrame(tick)
                    }
                }
                raf = requestAnimationFrame(tick)
            },
            { threshold: 0.4 },
        )
        observer.observe(element)
        return () => {
            observer.disconnect()
            cancelAnimationFrame(raf)
        }
    }, [target])

    return { ref, value }
}

/**
 * One editorial stat — a small accent icon over a count-up number over a small
 * muted label, with a left divider on desktop so the four read as a flush strip.
 */
const Stat = ({ icon, value, label }: { icon: React.ReactNode, value: number, label: string }) => {
    const locale = useLocale()
    const { ref, value: shown } = useCountUp(value)

    return (
        <div
            ref={ref}
            className="flex flex-col items-center gap-2 px-4 md:border-l md:border-default md:first:border-l-0"
        >
            <span className="text-accent [&>svg]:size-6">{icon}</span>
            <div className="text-4xl font-semibold tracking-tight tabular-nums text-foreground md:text-5xl">
                {shown.toLocaleString(locale)}
            </div>
            <Typography type="body-sm" color="muted">
                {label}
            </Typography>
        </div>
    )
}

/**
 * Live platform proof strip — four real counters (learners / lessons / courses /
 * badges) from the public `platformStats` query, rendered EDITORIAL: a small icon
 * over a number that counts up from 0 over a small label, separated by vertical
 * dividers (no metric cards) so the figures carry it. On fetch error it falls back
 * to 99 for every figure (so the strip still renders).
 *
 * @param props - optional className (placement only).
 */
export const StatStrip = ({ className }: StatStripProps) => {
    const t = useTranslations()
    const { data, isLoading, error } = useQueryPlatformStatsSwr()

    // On fetch error, fall back to 99 for every figure instead of hiding the strip.
    const stats = error ? FALLBACK_STATS : data

    return (
        <div className={className}>
            <AsyncContent
                isLoading={isLoading && !data && !error}
                skeleton={(
                    <div className="grid grid-cols-2 gap-y-8 md:grid-cols-4 md:gap-0">
                        {[0, 1, 2, 3].map((cell) => (
                            <div key={cell} className="flex flex-col items-center gap-2 px-4">
                                <Skeleton className="size-6 rounded-full" />
                                <Skeleton className="h-11 w-20 rounded-lg" />
                                <Skeleton className="h-4 w-16 rounded" />
                            </div>
                        ))}
                    </div>
                )}
            >
                {stats ? (
                    <div className="grid grid-cols-2 gap-y-8 md:grid-cols-4 md:gap-0">
                        <Stat
                            icon={<UsersIcon aria-hidden focusable="false" />}
                            value={stats.totalLearners}
                            label={t("landing.stats.learners")}
                        />
                        <Stat
                            icon={<BookOpenIcon aria-hidden focusable="false" />}
                            value={stats.totalLessons}
                            label={t("landing.stats.lessons")}
                        />
                        <Stat
                            icon={<StackIcon aria-hidden focusable="false" />}
                            value={stats.totalCourses}
                            label={t("landing.stats.courses")}
                        />
                        <Stat
                            icon={<MedalIcon aria-hidden focusable="false" />}
                            value={stats.totalBadgesEarned}
                            label={t("landing.stats.badges")}
                        />
                    </div>
                ) : null}
            </AsyncContent>
        </div>
    )
}
