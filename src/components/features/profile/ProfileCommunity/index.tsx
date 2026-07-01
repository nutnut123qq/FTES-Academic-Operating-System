"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useQueryProfileCommunitySwr } from "../hooks/useQueryProfileCommunitySwr"

/**
 * Community section of the profile (§2/§18). DEFAULT on-canon layout: follower /
 * following count tiles + an activity timeline list. ponytail: tiles/rows
 * hand-rolled; mock data.
 */
export const ProfileCommunity = () => {
    const t = useTranslations("profile")
    const { community } = useQueryProfileCommunitySwr()

    if (!community) {
        return null
    }

    const counts: Array<{ key: string; value: number }> = [
        { key: "followers", value: community.followers },
        { key: "following", value: community.following },
    ]

    return (
        <div className="flex flex-col gap-6">
            {/* counts */}
            <div className="grid grid-cols-2 gap-3">
                {counts.map((count) => (
                    <div key={count.key} className="flex flex-col gap-1 rounded-large bg-default/40 p-4">
                        <Typography type="body-xs" color="muted">
                            {t(`communityBoard.${count.key}`)}
                        </Typography>
                        <Typography type="h4" weight="bold">
                            {count.value}
                        </Typography>
                    </div>
                ))}
            </div>

            {/* activity timeline */}
            <div className="flex flex-col gap-3 border-t border-separator pt-6">
                <Typography type="h6" weight="bold">
                    {t("communityBoard.activity")}
                </Typography>
                {community.activity.map((entry) => (
                    <div
                        key={entry.id}
                        className="flex items-center gap-3 rounded-large border border-separator p-4"
                    >
                        <Typography type="body-sm" className="min-w-0 flex-1" truncate>
                            {entry.text}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {entry.timeLabel}
                        </Typography>
                    </div>
                ))}
            </div>
        </div>
    )
}
