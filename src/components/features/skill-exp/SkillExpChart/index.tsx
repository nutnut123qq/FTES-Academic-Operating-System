"use client"

import React, { useMemo } from "react"
import { Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { RankedBarChart } from "@/components/blocks/stats/RankedBarChart"
import { useQuerySkillExpSwr } from "../hooks/useQuerySkillExpSwr"
import { SkillExpChartSkeleton } from "./SkillExpChartSkeleton"

/** Props for {@link SkillExpChart}. */
export interface SkillExpChartProps extends WithClassNames<undefined> {
    /** Skeleton row count while loading — the seeded catalogue has ten categories. */
    barCount?: number
}

/**
 * Skill-EXP chart (change `course-skill-exp`): one horizontal bar per skill category
 * showing the RAW EXP the learner has accumulated there. EXP is uncapped by design —
 * every course studied keeps adding — so nothing is normalised to 0–100: the axis
 * auto-scales to the learner's own strongest category and its top is printed under
 * the bars. A learner who has not earned anything yet gets the empty state rather
 * than a stack of zero-width bars on a meaningless axis.
 *
 * Owns SWR + i18n; the drawing is delegated to the {@link RankedBarChart} block.
 *
 * @param props - {@link SkillExpChartProps}
 */
export const SkillExpChart = ({ barCount = 10, className }: SkillExpChartProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const { chart, error, mutate } = useQuerySkillExpSwr()

    const bars = useMemo(
        () =>
            (chart?.bars ?? []).map((bar) => ({
                key: bar.slug,
                // Admins can add categories, so an untranslated slug falls back to the
                // backend label instead of leaking a raw i18n key.
                label: t.has(`skillExp.categories.${bar.slug}`)
                    ? t(`skillExp.categories.${bar.slug}`)
                    : bar.fallbackLabel,
                value: bar.exp,
                valueLabel: t("skillExp.expValue", { exp: bar.exp.toLocaleString(locale) }),
            })),
        [chart, locale, t],
    )

    return (
        <div className={className}>
            <AsyncContent
                isLoading={!chart && !error}
                skeleton={<SkillExpChartSkeleton barCount={barCount} />}
                error={!chart ? error : undefined}
                errorContent={{
                    title: t("skillExp.error"),
                    onRetry: () => void mutate(),
                    retryLabel: t("skillExp.retry"),
                }}
                isEmpty={!!chart && chart.isEmpty}
                emptyContent={{
                    title: t("skillExp.empty.title"),
                    description: t("skillExp.empty.description"),
                }}
            >
                {chart ? (
                    <div className="flex flex-col gap-3">
                        <RankedBarChart
                            bars={bars}
                            max={chart.axisMax}
                            axisMaxLabel={t("skillExp.expValue", {
                                exp: chart.axisMax.toLocaleString(locale),
                            })}
                        />
                        <Typography type="body-xs" color="muted">
                            {t("skillExp.axisHint")}
                        </Typography>
                    </div>
                ) : null}
            </AsyncContent>
        </div>
    )
}
