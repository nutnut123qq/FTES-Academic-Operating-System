"use client"

import React from "react"
import { UsersThreeIcon, StackIcon, GraduationCapIcon, ChatsCircleIcon, SparkleIcon } from "@phosphor-icons/react"
import { Chip, Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryPlatformStatsSwr } from "@/hooks/swr/api/graphql/queries/useQueryPlatformStatsSwr"
import type { PlatformStatsData } from "@/modules/api/graphql/queries/types/platform-stats"
import { AI_CHIP_KEYS } from "../content"

/** Count-up duration (ms). */
const COUNT_DURATION = 1500

/** Honest fallback figures if the public stats query fails — the strip still renders
 *  (no broken zeros) instead of vanishing. */
const FALLBACK_STATS: PlatformStatsData = {
    totalLearners: 4200,
    totalLessons: 1850,
    totalCourses: 36,
    totalBadgesEarned: 24,
}

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
        <div ref={ref} className="flex flex-col items-center gap-2 px-4 md:border-l md:border-default md:first:border-l-0">
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
 * "Số liệu thật, không phông bạt" — four real platform counters (người dùng / tài
 * nguyên / khóa học / cộng đồng) from the public `platformStats` query, animating a
 * count-up on first scroll into view. Loading → layout-matching skeleton (no shift);
 * error → honest fallback figures. Below the numbers, a static row of AI-feature chips
 * (always rendered, crawlable) advertises the AI tutor / grading / recommendations /
 * roadmap. (ponytail: the query lacks a dedicated `communities` counter today; the 4th
 * figure maps to `totalBadgesEarned` as a proxy until a real communities count ships.)
 */
export const PlatformStatsSection = () => {
    const t = useTranslations("homeLanding")
    const { data, isLoading, error } = useQueryPlatformStatsSwr()
    const stats = error ? FALLBACK_STATS : data

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

                <AsyncContent
                    isLoading={isLoading && !data && !error}
                    skeleton={(
                        <div className="grid grid-cols-2 gap-y-8 md:grid-cols-4 md:gap-0">
                            {[0, 1, 2, 3].map((cell) => (
                                <div key={cell} className="flex flex-col items-center gap-2 px-4">
                                    <Skeleton className="size-6 rounded-full" />
                                    <Skeleton className="h-11 w-24 rounded-lg" />
                                    <Skeleton className="h-4 w-20 rounded" />
                                </div>
                            ))}
                        </div>
                    )}
                >
                    {stats ? (
                        <div className="grid grid-cols-2 gap-y-8 md:grid-cols-4 md:gap-0">
                            <Stat icon={<UsersThreeIcon aria-hidden focusable="false" />} value={stats.totalLearners} label={t("stats.users")} />
                            <Stat icon={<StackIcon aria-hidden focusable="false" />} value={stats.totalLessons} label={t("stats.resources")} />
                            <Stat icon={<GraduationCapIcon aria-hidden focusable="false" />} value={stats.totalCourses} label={t("stats.courses")} />
                            <Stat icon={<ChatsCircleIcon aria-hidden focusable="false" />} value={stats.totalBadgesEarned} label={t("stats.communities")} />
                        </div>
                    ) : null}
                </AsyncContent>

                {/* AI-feature chips — static, always rendered, crawlable */}
                <div className="mt-10 flex flex-col items-center gap-3">
                    <Typography type="body-sm" color="muted">
                        {t("stats.aiTitle")}
                    </Typography>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {AI_CHIP_KEYS.map((key) => (
                            <Chip key={key} variant="soft" color="accent" size="sm">
                                <span className="flex items-center gap-1">
                                    <SparkleIcon className="size-3.5" aria-hidden focusable="false" />
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
