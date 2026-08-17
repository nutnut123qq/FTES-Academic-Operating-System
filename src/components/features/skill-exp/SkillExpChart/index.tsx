"use client"

import React, { useMemo } from "react"
import { Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { Link } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { RankedBarChart } from "@/components/blocks/stats/RankedBarChart"
import { useQuerySkillExpSwr } from "../hooks/useQuerySkillExpSwr"
import { skillSetNotice } from "../hooks/skillExpModel"
import { SkillExpChartSkeleton } from "./SkillExpChartSkeleton"

/** Props for {@link SkillExpChart}. */
export interface SkillExpChartProps extends WithClassNames<undefined> {
    /** Skeleton row count while loading — a typical major has six to ten categories. */
    barCount?: number
}

/**
 * Skill-EXP chart (changes `course-skill-exp` + `default-skills-by-major`): one
 * horizontal bar per skill category showing the RAW EXP the learner has accumulated
 * there. EXP is uncapped by design — every course studied keeps adding — so nothing
 * is normalised to 0–100: the axis auto-scales to the learner's own strongest
 * category and its top is printed under the bars.
 *
 * The bars are the DEFAULT SKILL SET OF THE LEARNER'S MAJOR, so someone who has not
 * earned anything yet sees the skills they are working towards sitting at `0` rather
 * than a blank panel. Three states have to stay distinguishable here, and collapsing
 * any two of them is the bug this component was rewritten to fix:
 *
 * 1. **error** — a read failed for real (5xx / timeout / mạng). Retryable, and never dressed up
 *    as "no EXP".
 * 2. **no buckets at all** — an empty catalogue. Genuinely nothing to draw.
 * 3. **buckets, all at zero** — a new learner. Draws the bars plus a line saying so.
 *
 * Câu giải thích dưới các cột do {@link skillSetNotice} quyết định, KHÔNG phải `source` trần: BE cố
 * tình gộp "chưa chọn ngành" và "đã chọn ngành nhưng ngành chưa khai bộ mặc định" vào cùng một
 * `FULL_CATALOGUE`, nên chỉ nhìn `source` là nói sai với nhóm thứ hai (và mời họ chọn lại ngành mà
 * họ đã chọn). Thêm nhánh thứ tư: không đọc được EXP ⇒ nói thẳng là chưa đọc được, đừng để người
 * dùng tưởng mình vừa mất sạch EXP.
 *
 * Owns SWR + i18n; the drawing is delegated to the {@link RankedBarChart} block.
 *
 * @param props - {@link SkillExpChartProps}
 */
export const SkillExpChart = ({ barCount = 8, className }: SkillExpChartProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const { chart, error, mutate } = useQuerySkillExpSwr()
    // Một sự thật → một câu; xem `skillSetNotice` để biết vì sao không nhìn `source` trần.
    const notice = chart ? skillSetNotice(chart) : "NONE"

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
                            // No axis footer while every bar is zero: printing a top for
                            // an axis nothing is measured against invents a scale.
                            axisMaxLabel={
                                chart.hasEarnedExp
                                    ? t("skillExp.expValue", {
                                        exp: chart.axisMax.toLocaleString(locale),
                                    })
                                    : undefined
                            }
                        />
                        <Typography type="body-xs" color="muted">
                            {/* Chưa đọc được EXP thì KHÔNG được nói "bạn chưa tích được gì" — đó là
                                kết luận về dữ liệu mình còn chưa cầm trên tay. */}
                            {notice === "READ_UNAVAILABLE"
                                ? t("skillExp.readUnavailableHint")
                                : chart.hasEarnedExp
                                    ? t("skillExp.axisHint")
                                    : t("skillExp.zeroHint")}
                        </Typography>
                        {notice === "MAJOR_SET" && chart.majorLabel ? (
                            <Typography type="body-xs" color="muted">
                                {t("skillExp.majorSet", { major: chart.majorLabel })}
                            </Typography>
                        ) : null}
                        {notice === "MAJOR_WITHOUT_SET" ? (
                            <Typography type="body-xs" color="muted">
                                {/* Ngành đã chọn nhưng chưa khai bộ kỹ năng: nhãn có thể null khi
                                    danh mục ngành không với tới được, khi đó in tạm mã ngành. */}
                                {t("skillExp.majorWithoutSetHint", {
                                    major: chart.majorLabel ?? chart.majorCode ?? "",
                                })}
                            </Typography>
                        ) : null}
                        {notice === "NO_MAJOR" ? (
                            <Typography type="body-xs" color="muted">
                                {t("skillExp.noMajorHint")}{" "}
                                <Link
                                    href="/profile/edit"
                                    className="font-medium text-accent no-underline hover:underline"
                                >
                                    {t("skillExp.chooseMajor")}
                                </Link>
                            </Typography>
                        ) : null}
                    </div>
                ) : null}
            </AsyncContent>
        </div>
    )
}
