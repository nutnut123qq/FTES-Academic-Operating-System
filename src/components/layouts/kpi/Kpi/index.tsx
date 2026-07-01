"use client"

import React, {
    useCallback,
    useMemo,
    useState,
} from "react"
import {
    Button,
    ProgressBar,
    Skeleton,
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    KPI_META,
} from "../kpiMeta"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useQueryMyKpisSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyKpisSwr"
import { useMutateSetKpiTargetSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSetKpiTargetSwr"
import type { KpiKey, QueryKpiItemData } from "@/modules/api/graphql/queries/types/my-kpis"
import { useGraphQLWithToast } from "@/modules/toast/hooks"
import { InfoTooltip } from "@/components/blocks/feedback/InfoTooltip"

/** Props for {@link Kpi}. */
export type KpiProps = WithClassNames<undefined>

/**
 * The `/kpi` editor page body: the composite score header, then one row per
 * weekly KPI (icon · label · current/target · progress · preset target
 * buttons). Picking a preset writes the target via `setKpiTarget` and
 * revalidates. Self-fetches the KPIs + owns the mutation.
 *
 * @param props - optional className for the root element.
 */
export const Kpi = ({
    className,
}: KpiProps) => {
    const t = useTranslations()
    const { data, mutate } = useQueryMyKpisSwr()
    const { trigger: triggerSetTarget } = useMutateSetKpiTargetSwr()
    const runGraphQL = useGraphQLWithToast()
    // the `${key}:${preset}` currently being saved, or null when idle
    const [savingKey, setSavingKey] = useState<string | null>(null)

    /** Index the KPI items by key for O(1) lookup while rendering meta order. */
    const itemByKey = useMemo(
        () => {
            const map = new Map<KpiKey, QueryKpiItemData>()
            for (const item of data?.items ?? []) {
                map.set(item.key, item)
            }
            return map
        },
        [
            data,
        ],
    )

    /** Persist a chosen target for one KPI, then revalidate. */
    const onChoose = useCallback(
        async (key: KpiKey, target: number) => {
            setSavingKey(`${key}:${target}`)
            try {
                const ok = await runGraphQL(async () => {
                    const result = await triggerSetTarget({
                        key,
                        target,
                    })
                    const env = result?.data?.setKpiTarget
                    if (!env) {
                        throw new Error(t("dashboard.kpi.error"))
                    }
                    // returned envelope drives the success / error toast
                    return env
                })
                if (ok) {
                    await mutate()
                }
            } finally {
                setSavingKey(null)
            }
        },
        [
            triggerSetTarget,
            mutate,
            runGraphQL,
        ],
    )

    // first load — placeholder rows so the page never jumps
    if (!data) {
        return (
            <div className={cn("mx-auto flex w-full max-w-2xl flex-col gap-6 p-3", className)}>
                <Skeleton className="h-8 w-40 rounded-medium" />
                {Array.from({
                    length: 6,
                }).map((_, index) => (
                    <Skeleton
                        key={index}
                        className="h-20 w-full rounded-3xl"
                    />
                ))}
            </div>
        )
    }

    const { percent, completed, total } = data.composite

    return (
        <div className={cn("mx-auto flex w-full max-w-2xl flex-col gap-6 p-3", className)}>
            {/* title + composite score */}
            <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-bold text-foreground">
                    <InfoTooltip
                        title={t("dashboard.kpi.title")}
                        description={t("dashboard.kpi.help")}
                    >
                        {t("dashboard.kpi.title")}
                    </InfoTooltip>
                </h1>
                <span className="text-sm text-muted">
                    {total > 0
                        ? t("dashboard.kpi.summary", {
                            percent,
                            completed,
                            total,
                        })
                        : t("dashboard.kpi.subtitle")}
                </span>
            </div>

            {/* one editable row per KPI */}
            <div className="flex flex-col gap-3">
                {KPI_META.map(({ key, Icon, labelKey, presets }) => {
                    const item = itemByKey.get(key)
                    const current = item?.current ?? 0
                    const target = item?.target ?? null
                    return (
                        <div
                            key={key}
                            className="flex flex-col gap-3 rounded-3xl border border-divider p-3"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5">
                                    <Icon className="size-5 shrink-0 text-accent" />
                                    <span className="text-sm font-medium text-foreground">
                                        {t(`dashboard.kpi.labels.${labelKey}`)}
                                    </span>
                                </div>
                                <span className="shrink-0 text-sm text-muted">
                                    {current}
                                    {target !== null ? `/${target}` : null}
                                </span>
                            </div>

                            {/* progress toward the target (only when a target is set) */}
                            {target !== null ? (
                                <ProgressBar
                                    aria-label={t(`dashboard.kpi.labels.${labelKey}`)}
                                    value={current}
                                    maxValue={target || 1}
                                    color="accent"
                                    size="sm"
                                >
                                    <ProgressBar.Track>
                                        <ProgressBar.Fill />
                                    </ProgressBar.Track>
                                </ProgressBar>
                            ) : null}

                            {/* preset target buttons (primary = the active target) */}
                            <div className="flex flex-wrap items-center gap-1.5">
                                {presets.map((preset) => (
                                    <Button
                                        key={preset}
                                        variant={preset === target ? "primary" : "tertiary"}
                                        size="sm"
                                        // spinner on the exact button being saved; the rest of the
                                        // row stays disabled to block a concurrent second submit
                                        isPending={savingKey === `${key}:${preset}`}
                                        isDisabled={savingKey !== null && savingKey !== `${key}:${preset}`}
                                        onPress={() => void onChoose(key, preset)}
                                    >
                                        {preset}
                                    </Button>
                                ))}
                                {/* clear the target (set to 0) */}
                                <Button
                                    variant="tertiary"
                                    size="sm"
                                    isPending={savingKey === `${key}:0`}
                                    isDisabled={
                                        target === null
                                        || (savingKey !== null && savingKey !== `${key}:0`)
                                    }
                                    onPress={() => void onChoose(key, 0)}
                                >
                                    {t("dashboard.kpi.clear")}
                                </Button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
