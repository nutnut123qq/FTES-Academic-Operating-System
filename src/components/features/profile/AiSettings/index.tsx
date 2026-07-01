"use client"

import React, {
    useCallback,
    useMemo,
} from "react"
import {
    Label,
    Link,
    Spinner,
    Typography,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import { SettingsBreadcrumb } from "../Settings/SettingsBreadcrumb"
import { pathConfig } from "@/resources/path"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { FlexWrapButtonRadio } from "@/components/blocks/navigation/FlexWrapButtonRadio"
import { useQueryMyAiQuotaSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyAiQuotaSwr"
import { useMutateSetAiCeilSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSetAiCeilSwr"
import { AiModelCategory } from "@/modules/api/graphql/queries/query-ai-models"
import { AiCeilSurface } from "@/modules/api/graphql/mutations/types/set-ai-ceil"

/** Category ladder cheapest → strongest (mirrors backend CATEGORY_LADDER). */
const LADDER: Array<AiModelCategory> = [
    AiModelCategory.Free,
    AiModelCategory.Economy,
    AiModelCategory.Balanced,
    AiModelCategory.Premium,
    AiModelCategory.Frontier,
]

/** Per-surface override sentinel = follow the global default. */
const INHERIT = "__inherit__"

/** Surfaces the user can override (mirrors backend AiCeilSurface). */
const SURFACES: Array<AiCeilSurface> = [
    AiCeilSurface.Chatbot,
    AiCeilSurface.Grading,
    AiCeilSurface.Interview,
]

/**
 * AI settings page — set the model CEILING ("trần") the Auto router may climb to,
 * for cost control. BYOK was removed from the main flow; grading + the lesson
 * tutor run only on the StarCi System pool (the system auto-picks a model by
 * task difficulty + the user's plan). Here the user sets a *lower* ceiling: a
 * global default + per-surface overrides. The Auto chain climbs to the ceiling,
 * then stops (hard cap). Caps above the plan max are disabled (need an upgrade).
 */
export const AiSettings = () => {
    const t = useTranslations()
    const router = useRouter()
    const locale = useLocale()

    const quota = useQueryMyAiQuotaSwr()
    const { trigger, isMutating } = useMutateSetAiCeilSwr()

    const data = quota.data

    /** Categories the plan unlocks (the ceiling); default to the free allowance. */
    const allowed = data?.allowedCategories ?? [
        AiModelCategory.Free,
        AiModelCategory.Economy,
    ]
    /** Highest category the plan allows = the cap ceiling. */
    const planMax = LADDER[
        Math.max(...allowed.map((category) => LADDER.indexOf(category)), 0)
    ]
    const planMaxIndex = LADDER.indexOf(planMax)
    /** Free (no paid tier) caps at Economy → little to cap → show the upsell. */
    const isPaid = planMaxIndex > LADDER.indexOf(AiModelCategory.Economy)

    /** Human label for a category. */
    const label = useCallback(
        (category: AiModelCategory) => t(`aiSettings.categories.${category}`),
        [t],
    )

    /** Persist a ceiling then revalidate the quota snapshot. */
    const setCeil = useCallback(
        async (
            surface: AiCeilSurface | null,
            category: AiModelCategory | null,
        ) => {
            await trigger({
                surface,
                category,
            })
            await quota.mutate()
        },
        [trigger, quota],
    )

    /** Ladder buttons (above the plan max are disabled). */
    const ladderItems = useMemo(
        () => LADDER.map((category) => ({
            value: category,
            content: label(category),
            isDisabled: LADDER.indexOf(category) > planMaxIndex,
        })),
        [label, planMaxIndex],
    )

    /** Per-surface ladder = "follow default" + the ladder. */
    const surfaceItems = useMemo(
        () => [
            {
                value: INHERIT,
                content: t("aiSettings.ceil.inherit"),
            },
            ...ladderItems,
        ],
        [ladderItems, t],
    )

    const onNavigateSubscription = useCallback(
        () => router.push(`${pathConfig().locale(locale).profile().build()}/ai-subscription`),
        [router, locale],
    )

    return (
        <div className="flex flex-col gap-10">
            <PageHeader
                breadcrumb={<SettingsBreadcrumb current={t("aiSettings.title")} />}
                title={t("aiSettings.title")}
                description={t("aiSettings.ceil.description")}
            />

            {quota.isLoading
                ? (
                    <div className="flex items-center gap-2">
                        <Spinner size="sm" />
                        <Typography type="body-sm" color="muted">
                            {t("common.loading")}
                        </Typography>
                    </div>
                )
                : quota.error
                    ? (
                        <Typography type="body-sm" className="text-danger">
                            {t("aiSettings.ceil.error")}
                        </Typography>
                    )
                    : (
                        <div className="flex flex-col gap-6">
                            <div className="rounded-2xl border border-default bg-surface px-4 py-3">
                                <Typography type="body-sm" color="muted">
                                    {data?.tier
                                        ? t("aiSettings.ceil.plan", {
                                            tier: data.tier,
                                            max: label(planMax),
                                        })
                                        : t("aiSettings.ceil.planFree", {
                                            max: label(planMax),
                                        })}
                                </Typography>
                                {data
                                    ? (
                                        <Typography type="body-xs" color="muted">
                                            {t("aiSettings.ceil.creditLine", {
                                                used5h: data.credit.used5h,
                                                limit5h: data.credit.limit5h,
                                                usedWeek: data.credit.usedWeek,
                                                limitWeek: data.credit.limitWeek,
                                            })}
                                        </Typography>
                                    )
                                    : null}
                            </div>

                            <div className="flex flex-col gap-3">
                                <Label>{t("aiSettings.ceil.defaultLabel")}</Label>
                                <FlexWrapButtonRadio
                                    ariaLabel={t("aiSettings.ceil.defaultLabel")}
                                    items={ladderItems}
                                    value={data?.ceil.default ?? planMax}
                                    onChange={(category) =>
                                        setCeil(
                                            null,
                                            category === planMax
                                                ? null
                                                : (category as AiModelCategory),
                                        )}
                                />
                                <Typography type="body-xs" color="muted">
                                    {t("aiSettings.ceil.creditCaption")}
                                    {" · "}
                                    {t("aiSettings.ceil.hardStop")}
                                </Typography>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Label>{t("aiSettings.ceil.surfacesLabel")}</Label>
                                {SURFACES.map((surface) => (
                                    <div
                                        key={surface}
                                        className="flex flex-col gap-2"
                                    >
                                        <Typography type="body-sm">
                                            {t(`aiSettings.ceil.surface.${surface}`)}
                                        </Typography>
                                        <FlexWrapButtonRadio
                                            ariaLabel={t(`aiSettings.ceil.surface.${surface}`)}
                                            items={surfaceItems}
                                            value={data?.ceil[surface] ?? INHERIT}
                                            onChange={(value) =>
                                                setCeil(
                                                    surface,
                                                    value === INHERIT
                                                        ? null
                                                        : (value as AiModelCategory),
                                                )}
                                        />
                                    </div>
                                ))}
                            </div>

                            {!isPaid
                                ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Typography type="body-sm" color="muted">
                                            {t("aiSettings.upgradePrompt")}
                                        </Typography>
                                        <Link onPress={onNavigateSubscription}>
                                            {t("aiSettings.byok.upsellCta")}
                                        </Link>
                                    </div>
                                )
                                : null}

                            {isMutating
                                ? (
                                    <Typography type="body-xs" color="muted">
                                        {t("aiSettings.ceil.saving")}
                                    </Typography>
                                )
                                : null}
                        </div>
                    )}
        </div>
    )
}
