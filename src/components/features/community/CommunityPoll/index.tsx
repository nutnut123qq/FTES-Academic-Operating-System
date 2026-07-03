"use client"

import React, { useState } from "react"
import { Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useQueryPollSwr } from "../hooks/useQueryPollSwr"

/**
 * Community poll (§6). DEFAULT on-canon layout: a question + options with vote
 * percentage bars; voting reveals the result. ponytail: options are buttons with
 * a div percentage bar; vote adds locally; mock data.
 */
export const CommunityPoll = () => {
    const t = useTranslations("communityHub")
    const { poll } = useQueryPollSwr()
    const [votedId, setVotedId] = useState<string | null>(null)

    if (!poll) {
        return null
    }

    const extra = votedId ? 1 : 0
    const total = poll.options.reduce((sum, option) => sum + option.votes, 0) + extra
    const votesOf = (id: string, base: number) => base + (votedId === id ? 1 : 0)
    const percentOf = (votes: number) => (total === 0 ? 0 : Math.round((votes / total) * 100))

    return (
        <div className="flex flex-col gap-4">
            <Typography type="h5" weight="bold">
                {poll.question}
            </Typography>
            <div className="flex flex-col gap-2">
                {poll.options.map((option) => {
                    const votes = votesOf(option.id, option.votes)
                    const percent = percentOf(votes)
                    const revealed = votedId !== null
                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => !revealed && setVotedId(option.id)}
                            className={cn(
                                "relative overflow-hidden rounded-2xl border p-3 text-left transition-colors",
                                votedId === option.id ? "border-accent" : "border-separator",
                                !revealed && "hover:bg-default/40",
                            )}
                        >
                            {revealed ? (
                                <div
                                    className="absolute inset-y-0 left-0 bg-accent/10"
                                    style={{ width: `${percent}%` }}
                                />
                            ) : null}
                            <div className="relative flex items-center justify-between gap-3">
                                <Typography type="body-sm" weight="medium">
                                    {option.label}
                                </Typography>
                                {revealed ? (
                                    <Typography type="body-sm" color="muted">
                                        {percent}%
                                    </Typography>
                                ) : null}
                            </div>
                        </button>
                    )
                })}
            </div>
            <Typography type="body-xs" color="muted">
                {t("poll.totalVotes", { count: total })}
            </Typography>
        </div>
    )
}
