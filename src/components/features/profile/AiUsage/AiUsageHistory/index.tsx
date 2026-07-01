"use client"

import React, {
    useMemo,
    useState,
} from "react"
import {
    Chip,
    Label,
    ListBox,
    ScrollShadow,
    Select,
    Typography,
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import dayjs from "dayjs"
import {
    BarChart,
    Bar,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import { useQueryMyCreditUsageHistoryInfiniteSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyCreditUsageHistoryInfiniteSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { InfiniteScrollSentinel } from "@/components/blocks/async/InfiniteScrollSentinel"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { SegmentBar } from "@/components/blocks/stats/SegmentBar"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Days shown in the per-day spend chart (matches the chart title copy). */
const CHART_DAYS = 14

/** Display label per provider key; null = the free Auto lane. */
const PROVIDER_LABELS: Record<string, string> = {
    openai: "OpenAI",
    gemini: "Gemini",
}

/** Lane filter values, in display order. */
const LANES = ["all", "auto", "premium", "byok"] as const
type LaneFilter = (typeof LANES)[number]

/** Props for {@link AiUsageHistory}. */
export type AiUsageHistoryProps = WithClassNames<undefined>

/**
 * AI usage insight for the `/profile/ai-usage` page: a per-day spend chart, a
 * "by provider" {@link SegmentBar} breakdown, a lane filter, and the charge
 * history as an infinite-scroll list. Self-contained: drives its own
 * `useSWRInfinite` over `myCreditUsageHistory` (offset paginated) + a local lane
 * filter. Chart/breakdown are computed client-side from the loaded rows.
 *
 * NOTE: linking a charge back to its challenge needs the backend to expose
 * `attemptId` on the history item — not surfaced yet, so rows are read-only.
 *
 * @param props - optional className (placement only).
 */
export const AiUsageHistory = ({ className }: AiUsageHistoryProps) => {
    const t = useTranslations()
    const [lane, setLane] = useState<LaneFilter>("all")

    const {
        data,
        isLoading,
        isValidating,
        error,
        size,
        setSize,
        mutate,
    } = useQueryMyCreditUsageHistoryInfiniteSwr()

    const pages = useMemo(() => data ?? [], [data])
    const items = useMemo(() => pages.flatMap((page) => page.items), [pages])
    const total = pages[0]?.total ?? 0
    const hasMore = items.length < total
    const isLoadingMore = isValidating && size > 0

    // per-day spend buckets (last CHART_DAYS days), from all loaded rows
    const chartData = useMemo(() => {
        const today = dayjs().startOf("day")
        const buckets = new Map<string, number>()
        for (let offset = CHART_DAYS - 1; offset >= 0; offset--) {
            buckets.set(today.subtract(offset, "day").format("DD/MM"), 0)
        }
        for (const item of items) {
            const key = dayjs(item.createdAt).startOf("day").format("DD/MM")
            if (buckets.has(key)) {
                buckets.set(key, (buckets.get(key) ?? 0) + item.credits)
            }
        }
        return [...buckets.entries()].map(([day, credits]) => ({ day, credits }))
    }, [items])

    // credits spent per provider (null provider = free Auto lane)
    const providerSegments = useMemo(() => {
        const byProvider = new Map<string, number>()
        for (const item of items) {
            const key = item.provider ?? "free"
            byProvider.set(key, (byProvider.get(key) ?? 0) + item.credits)
        }
        return [...byProvider.entries()]
            .filter(([, credits]) => credits > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([key, credits]) => ({
                key,
                label: key === "free" ? t("aiQuota.freeTier") : PROVIDER_LABELS[key] ?? key,
                value: credits,
            }))
    }, [items, t])

    // lane filter applies only to the list (chart/breakdown stay overall)
    const filtered = useMemo(
        () => (lane === "all" ? items : items.filter((item) => item.mode === lane)),
        [items, lane],
    )

    return (
        <AsyncContent
            isLoading={isLoading && items.length === 0}
            skeleton={(
                <div className="flex flex-col gap-6">
                    <LabeledCard label={t("aiQuota.history.chartTitle")}>
                        <Skeleton className="h-44 w-full rounded-xl" />
                    </LabeledCard>
                    <LabeledCard label={t("aiQuota.history.breakdownTitle")}>
                        <Skeleton.SegmentBar legendItems={3} />
                    </LabeledCard>
                    <LabeledCard label={t("aiQuota.history.title")}>
                        <div className="flex flex-col gap-2">
                            {[0, 1, 2, 3].map((row) => (
                                <Skeleton key={row} className="h-12 w-full rounded-xl" />
                            ))}
                        </div>
                    </LabeledCard>
                </div>
            )}
            isEmpty={items.length === 0}
            emptyContent={{ title: t("aiQuota.history.empty") }}
            error={error}
            errorContent={{
                title: t("aiQuota.history.title"),
                onRetry: () => { void mutate() },
                retryLabel: t("dashboard.retry"),
            }}
        >
            <div className={cn("flex flex-col gap-6", className)}>
                {/* card 1 — per-day spend chart */}
                <LabeledCard label={t("aiQuota.history.chartTitle")}>
                    <div className="h-44 w-full text-accent">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="currentColor"
                                    className="text-divider"
                                    vertical={false}
                                />
                                <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={1} tickLine={false} axisLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={28} />
                                <Tooltip
                                    cursor={{ fill: "currentColor", opacity: 0.08 }}
                                    formatter={(value) => [`${value} ${t("aiQuota.history.creditsUnit")}`, ""]}
                                />
                                <Bar dataKey="credits" fill="currentColor" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </LabeledCard>

                {/* card 2 — by-provider breakdown (credits) */}
                {providerSegments.length > 0 ? (
                    <LabeledCard label={t("aiQuota.history.breakdownTitle")}>
                        <SegmentBar
                            ariaLabel={t("aiQuota.history.breakdownTitle")}
                            segments={providerSegments}
                        />
                    </LabeledCard>
                ) : null}

                {/* card 3 — charge history list; the lane filter sits in the card's
                    action slot (right of the label) instead of a separate row */}
                <LabeledCard
                    label={t("aiQuota.history.title")}
                    action={(
                        <>
                            <Label className="sr-only">{t("aiQuota.history.lane.all")}</Label>
                            <Select.Root<{ id: string }, "single">
                                aria-label={t("aiQuota.history.lane.all")}
                                selectedKey={lane}
                                onSelectionChange={(key) => setLane(String(key) as LaneFilter)}
                            >
                                <Select.Trigger aria-label={t("aiQuota.history.lane.all")} className="w-fit min-w-40">
                                    <Select.Value>
                                        {() => (
                                            <Typography type="body-sm">
                                                {t(`aiQuota.history.lane.${lane}`)}
                                            </Typography>
                                        )}
                                    </Select.Value>
                                    <Select.Indicator />
                                </Select.Trigger>
                                <Select.Popover>
                                    <ListBox.Root aria-label={t("aiQuota.history.lane.all")}>
                                        {LANES.map((value) => (
                                            <ListBox.Item
                                                key={value}
                                                id={value}
                                                textValue={t(`aiQuota.history.lane.${value}`)}
                                            >
                                                {t(`aiQuota.history.lane.${value}`)}
                                            </ListBox.Item>
                                        ))}
                                    </ListBox.Root>
                                </Select.Popover>
                            </Select.Root>
                        </>
                    )}
                >
                    <ScrollShadow className="flex max-h-96 flex-col divide-y divide-divider">
                        {filtered.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 py-2">
                                <div className="flex min-w-0 flex-col gap-0">
                                    <Typography type="body-sm" weight="medium" truncate>
                                        {item.model ?? t("aiQuota.history.autoModel")}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {t("aiQuota.history.purposeGrade")}
                                        {" · "}
                                        {dayjs(item.createdAt).format("HH:mm DD/MM")}
                                    </Typography>
                                </div>
                                <Chip
                                    size="sm"
                                    variant="soft"
                                    color={item.credits > 0 ? "warning" : "success"}
                                >
                                    <Chip.Label>
                                        {`${item.credits} ${t("aiQuota.history.creditsUnit")}`}
                                    </Chip.Label>
                                </Chip>
                            </div>
                        ))}
                        {/* grow the list as the sentinel scrolls into view */}
                        <InfiniteScrollSentinel
                            onReach={() => setSize((current) => current + 1)}
                            disabled={!hasMore || isLoadingMore}
                        />
                    </ScrollShadow>
                </LabeledCard>
            </div>
        </AsyncContent>
    )
}
