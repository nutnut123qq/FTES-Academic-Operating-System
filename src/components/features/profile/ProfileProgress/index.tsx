"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useQueryProfileProgressSwr } from "../hooks/useQueryProfileProgressSwr"

/**
 * Progress section of the profile (§2/§11). DEFAULT on-canon layout: a stat-card
 * grid (XP / Level / FTES Coin / Reputation). ponytail: tiles hand-rolled; mock,
 * display-only.
 */
export const ProfileProgress = () => {
    const t = useTranslations("profile")
    const { progress } = useQueryProfileProgressSwr()

    if (!progress) {
        return null
    }

    const stats: Array<{ key: string; value: number }> = [
        { key: "xp", value: progress.xp },
        { key: "level", value: progress.level },
        { key: "coin", value: progress.coin },
        { key: "reputation", value: progress.reputation },
    ]

    return (
        <div className="flex flex-col gap-3">
            <Typography type="h6" weight="bold">
                {t("sections.progress")}
            </Typography>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map((stat) => (
                    <div key={stat.key} className="flex flex-col gap-1 rounded-large bg-default/40 p-4">
                        <Typography type="body-xs" color="muted">
                            {t(`progressBoard.${stat.key}`)}
                        </Typography>
                        <Typography type="h4" weight="bold">
                            {stat.value.toLocaleString()}
                        </Typography>
                    </div>
                ))}
            </div>
        </div>
    )
}
