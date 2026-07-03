"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ChartBarIcon, TrendDownIcon, TrendUpIcon } from "@phosphor-icons/react"
import { useQueryAnalyticsSwr } from "../hooks/useQueryAnalyticsSwr"

/**
 * Analytics dashboard (§20) — the `/analytics` page. A metrics dashboard: a grid of
 * headline metric cards (label + big number + colored delta) over a row of category
 * tiles (placeholder "chart coming soon" cards per domain). Feature owns data (mock);
 * tokens own the look. Mirrors the house dashboard archetype (`LeaderboardShell`).
 * ponytail: hand-rolled metric cards + placeholder tiles, mock data.
 */
export const AnalyticsDashboard = () => {
    const t = useTranslations("analytics")
    const { metrics, sections } = useQueryAnalyticsSwr()

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
                <Typography type="h4" weight="bold">
                    {t("title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("subtitle")}
                </Typography>
            </div>

            {/* metric cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {metrics.map((metric) => {
                    const up = metric.delta >= 0
                    return (
                        <div key={metric.id} className="flex flex-col gap-2 rounded-2xl bg-default/40 p-4">
                            <Typography type="body-xs" color="muted">
                                {t(`metrics.${metric.key}`)}
                            </Typography>
                            <Typography type="h4" weight="bold">
                                {Math.round(metric.value).toLocaleString()}
                            </Typography>
                            <div
                                className={`flex items-center gap-1 ${up ? "text-success" : "text-danger"}`}
                                aria-label={t("deltaLabel", { value: metric.delta.toFixed(1) })}
                            >
                                {up ? (
                                    <TrendUpIcon className="size-4" aria-hidden />
                                ) : (
                                    <TrendDownIcon className="size-4" aria-hidden />
                                )}
                                <Typography type="body-xs" weight="medium" className="text-inherit">
                                    {up ? "+" : ""}
                                    {metric.delta.toFixed(1)}%
                                </Typography>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* category tiles — placeholder charts */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sections.map((section) => (
                    <div
                        key={section.id}
                        className="flex flex-col gap-3 rounded-2xl border border-separator p-4"
                    >
                        <div className="flex items-center gap-2 text-muted">
                            <ChartBarIcon className="size-5" aria-hidden />
                            <Typography type="body-sm" weight="medium" className="text-foreground">
                                {t(`sections.${section.key}`)}
                            </Typography>
                        </div>
                        <div className="flex h-24 items-center justify-center rounded-large bg-default/40">
                            <Typography type="body-xs" color="muted">
                                {t("chartSoon")}
                            </Typography>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
