"use client"

import React, {
    useMemo,
} from "react"
import {
    cn,
    Chip,
    ScrollShadow,
    Skeleton,
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
import {
    useAiQuotaHistorySwr,
} from "../hooks"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** One day bucket for the usage history chart. */
interface AiQuotaHistoryChartPoint {
    /** Day label on the X axis (`DD/MM`). */
    day: string
    /** Credits consumed that day. */
    credits: number
}

/** Props for {@link AiQuotaHistoryTab}. */
export interface AiQuotaHistoryTabProps extends WithClassNames<undefined> {
    /** When true, load history even outside the modal (full usage page). */
    alwaysLoad?: boolean
}

/**
 * AI quota modal — history tab (chart + recent charges).
 * @param props - {@link AiQuotaHistoryTabProps}
 */
export const AiQuotaHistoryTab = ({
    alwaysLoad = false,
    className,
}: AiQuotaHistoryTabProps) => {
    const t = useTranslations()
    const { data: history, isLoading } = useAiQuotaHistorySwr({
        enabled: alwaysLoad,
    })

    const chartData = useMemo((): Array<AiQuotaHistoryChartPoint> => {
        const today = dayjs().startOf("day")
        const buckets = new Map<string, number>()
        for (let offset = 7 - 1; offset >= 0; offset--) {
            buckets.set(today.subtract(offset, "day").format("DD/MM"), 0)
        }
        for (const item of history?.items ?? []) {
            const key = dayjs(item.createdAt).startOf("day").format("DD/MM")
            if (buckets.has(key)) {
                buckets.set(key, (buckets.get(key) ?? 0) + item.credits)
            }
        }
        return [...buckets.entries()].map(([day, credits]) => ({
            day,
            credits,
        }))
    }, [history])

    return (
        <div className={cn("flex flex-col gap-6", className)}>
            <div className="flex flex-col gap-1.5">
                <div className="text-sm font-semibold text-foreground">
                    {t("aiQuota.history.chartTitle")}
                </div>
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
                            <Bar
                                dataKey="credits"
                                fill="currentColor"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <div className="text-sm font-semibold text-foreground">
                    {t("aiQuota.history.title")}
                </div>
                {isLoading ? (
                    <Skeleton className="h-24 w-full rounded-xl" />
                ) : (history?.items.length ?? 0) === 0 ? (
                    <div className="py-4 text-center text-sm text-muted">
                        {t("aiQuota.history.empty")}
                    </div>
                ) : (
                    <ScrollShadow className="flex max-h-64 flex-col divide-y divide-divider">
                        {history?.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-1.5 py-2">
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-medium text-foreground">
                                        {item.model ?? t("aiQuota.history.autoModel")}
                                    </div>
                                    <div className="text-xs text-muted">
                                        {t("aiQuota.history.purposeGrade")}
                                        {" · "}
                                        {dayjs(item.createdAt).format("HH:mm DD/MM")}
                                    </div>
                                </div>
                                <Chip size="sm" variant="soft" color={item.credits > 0 ? "warning" : "success"}>
                                    {`${item.credits} ${t("aiQuota.history.creditsUnit")}`}
                                </Chip>
                            </div>
                        ))}
                    </ScrollShadow>
                )}
            </div>
        </div>
    )
}
