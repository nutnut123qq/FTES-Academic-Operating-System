"use client"

import React, { useState } from "react"
import { Typography, cn } from "@heroui/react"
import { CaretRightIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useQueryPollSwr } from "../hooks/useQueryPollSwr"

/** One discovery panel shell: title row (+ optional see-all link) over content. */
const RailPanel = ({
    title,
    seeAllHref,
    seeAllLabel,
    children,
}: {
    title: string
    seeAllHref?: string
    seeAllLabel?: string
    children: React.ReactNode
}) => (
    <section className="flex flex-col gap-2 rounded-3xl border border-separator bg-surface p-4">
        <Typography type="body-sm" weight="semibold">
            {title}
        </Typography>
        {children}
        {seeAllHref && seeAllLabel ? (
            <Link
                href={seeAllHref}
                className="group flex items-center gap-0.5 self-start text-xs text-accent no-underline hover:underline"
            >
                {seeAllLabel}
                <CaretRightIcon
                    aria-hidden
                    focusable="false"
                    className="size-3 transition-transform group-hover:translate-x-0.5"
                />
            </Link>
        ) : null}
    </section>
)

/** Compact in-place poll — same local-vote reveal behavior as the poll page. */
const QuickPoll = () => {
    const { poll } = useQueryPollSwr()
    const [votedId, setVotedId] = useState<string | null>(null)

    if (!poll) {
        return null
    }

    const extra = votedId ? 1 : 0
    const total = poll.options.reduce((sum, option) => sum + option.votes, 0) + extra
    const percentOf = (option: { id: string; votes: number }) => {
        const votes = option.votes + (votedId === option.id ? 1 : 0)
        return total === 0 ? 0 : Math.round((votes / total) * 100)
    }
    const revealed = votedId !== null

    return (
        <div className="flex flex-col gap-2">
            <Typography type="body-sm">{poll.question}</Typography>
            {poll.options.map((option) => (
                <button
                    key={option.id}
                    type="button"
                    onClick={() => !revealed && setVotedId(option.id)}
                    className={cn(
                        "relative overflow-hidden rounded-large border p-2 text-left transition-colors",
                        votedId === option.id ? "border-accent" : "border-separator",
                        !revealed && "hover:bg-default/40",
                    )}
                >
                    {revealed ? (
                        <div
                            className="absolute inset-y-0 left-0 bg-accent/10"
                            style={{ width: `${percentOf(option)}%` }}
                        />
                    ) : null}
                    <div className="relative flex items-center justify-between gap-2">
                        <Typography type="body-xs" weight="medium">
                            {option.label}
                        </Typography>
                        {revealed ? (
                            <Typography type="body-xs" color="muted">
                                {percentOf(option)}%
                            </Typography>
                        ) : null}
                    </div>
                </button>
            ))}
        </div>
    )
}

/**
 * Right community rail (`xl`+): surfaces the community poll with in-place
 * voting next to the feed, reusing the EXISTING mock hook (no new data).
 * ponytail: pure composition.
 */
export const DiscoveryRail = () => {
    const t = useTranslations("communityHub")

    return (
        <div className="flex flex-col gap-3">
            <RailPanel
                title={t("rail.poll")}
                seeAllHref="/community/poll"
                seeAllLabel={t("rail.seeAll")}
            >
                <QuickPoll />
            </RailPanel>
        </div>
    )
}
