"use client"

import React from "react"
import { UsersThreeIcon, GraduationCapIcon, SparkleIcon } from "@phosphor-icons/react"
import { Chip, Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryPlatformStatsSwr } from "@/hooks/swr/api/graphql/queries/useQueryPlatformStatsSwr"
import { AI_CHIP_KEYS } from "../content"

/** Count-up duration (ms). */
const COUNT_DURATION = 1500

/**
 * Counts 0 → `target` the first time it scrolls into view (ease-out cubic via rAF).
 * Respects `prefers-reduced-motion` — snaps to the final figure. Returns the ref to
 * attach + the current value.
 */
const useCountUp = (target: number) => {
    const ref = React.useRef<HTMLDivElement>(null)
    const [value, setValue] = React.useState(0)

    React.useEffect(() => {
        const element = ref.current
        if (!element) return
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setValue(target)
            return
        }
        let raf = 0
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return
                observer.disconnect()
                const start = performance.now()
                const tick = (now: number) => {
                    const progress = Math.min((now - start) / COUNT_DURATION, 1)
                    const eased = 1 - Math.pow(1 - progress, 3)
                    setValue(Math.round(target * eased))
                    if (progress < 1) raf = requestAnimationFrame(tick)
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

/** One count-up stat: accent icon over a big number over a muted label. */
const Stat = ({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) => {
    const locale = useLocale()
    const { ref, value: shown } = useCountUp(value)
    return (
        <div ref={ref} className="flex flex-col items-center gap-2 px-8 sm:border-l sm:border-default sm:first:border-l-0">
            <span className="text-accent [&>svg]:size-6">{icon}</span>
            <div className="text-4xl font-semibold tracking-tight tabular-nums text-foreground md:text-5xl">
                {shown.toLocaleString(locale)}
            </div>
            <Typography type="body-sm" color="muted" align="center">
                {label}
            </Typography>
        </div>
    )
}

/**
 * "Số liệu thật, không phông bạt" — real platform counters DERIVED from the public
 * REST course catalog (`GET /api/v1/courses`), animating a count-up on first scroll
 * into view. Only figures the BE can back honestly are shown: published courses
 * (`totalCourses`) and total course enrollments (`totalEnrollments`). The FTES BE has
 * NO `platformStats` GraphQL query, so nothing here calls GraphQL — the legacy
 * lessons/badges/communities counters are intentionally dropped (hidden) rather than
 * faked. Loading → layout-matching skeleton (no shift); error → the numeric band is
 * hidden entirely (no fabricated fallback figures). Below the numbers, a static row of
 * AI-feature chips (always rendered, crawlable) advertises the AI tutor / grading /
 * recommendations / roadmap.
 */
export const PlatformStatsSection = () => {
    const t = useTranslations("homeLanding")
    const { data, isLoading, error } = useQueryPlatformStatsSwr()

    // Only the two BE-backed figures; each renders iff it derived a real value.
    const stats = data
        ? [
            { key: "courses", icon: <GraduationCapIcon aria-hidden focusable="false" />, value: data.totalCourses, label: t("stats.courses") },
            { key: "enrollments", icon: <UsersThreeIcon aria-hidden focusable="false" />, value: data.totalEnrollments, label: t("stats.enrollments") },
        ]
        : []

    return (
        <section className="w-full border-y border-separator bg-default/20">
            <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
                <div className="mb-10 flex flex-col items-center gap-2 text-center">
                    <Typography type="body-sm" color="muted">
                        {t("stats.eyebrow")}
                    </Typography>
                    <Typography type="h3" weight="bold">
                        {t("stats.title")}
                    </Typography>
                </div>

                {/* Numeric band — only when the derived stats are available; error hides it. */}
                {error ? null : (
                    <AsyncContent
                        isLoading={isLoading && !data}
                        skeleton={(
                            <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-center sm:gap-0">
                                {[0, 1].map((cell) => (
                                    <div key={cell} className="flex flex-col items-center gap-2 px-8">
                                        <Skeleton className="size-6 rounded-full" />
                                        <Skeleton className="h-11 w-24 rounded-lg" />
                                        <Skeleton className="h-4 w-20 rounded" />
                                    </div>
                                ))}
                            </div>
                        )}
                    >
                        {stats.length > 0 ? (
                            <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-center sm:gap-0">
                                {stats.map((stat) => (
                                    <Stat key={stat.key} icon={stat.icon} value={stat.value} label={stat.label} />
                                ))}
                            </div>
                        ) : null}
                    </AsyncContent>
                )}

                {/* AI-feature chips — static, always rendered, crawlable */}
                <div className="mt-10 flex flex-col items-center gap-3">
                    <Typography type="body-sm" color="muted">
                        {t("stats.aiTitle")}
                    </Typography>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {AI_CHIP_KEYS.map((key) => (
                            <Chip key={key} variant="soft" color="accent" size="sm">
                                <span className="flex items-center gap-2">
                                    <SparkleIcon className="size-4" aria-hidden focusable="false" />
                                    {t(`stats.aiChips.${key}`)}
                                </span>
                            </Chip>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
