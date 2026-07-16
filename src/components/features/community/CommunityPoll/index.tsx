"use client"

import React, { useState } from "react"
import { Skeleton, Typography, cn, toast } from "@heroui/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { useQueryPollSwr } from "../hooks/useQueryPollSwr"
import { useMutatePollVoteSwr } from "../hooks/useMutatePollVoteSwr"

/** Props for {@link CommunityPoll}. */
export interface CommunityPollProps {
    /** POLL post to render; omitted → the latest poll from the viewer's feed. */
    postId?: string
}

/** Loading skeleton — mirrors the question + option bars so the layout never jumps. */
const PollSkeleton = () => (
    <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-64 rounded-full" />
        <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((index) => (
                <Skeleton key={index} className="h-12 w-full rounded-2xl" />
            ))}
        </div>
        <Skeleton className="h-3 w-32 rounded-full" />
    </div>
)

/**
 * Community poll (§6). DEFAULT on-canon layout: a question + options with vote
 * percentage bars; voting reveals the result. Data and votes are REAL: the poll
 * loads from `GET /community/posts/{postId}/poll` and a vote writes to
 * `POST /community/posts/{postId}/poll-votes` (optimistic reveal, rollback+toast
 * on failure, revalidate on success).
 */
export const CommunityPoll = ({ postId }: CommunityPollProps) => {
    const t = useTranslations("communityHub")
    const { poll, isLoading, error, mutate } = useQueryPollSwr(postId)
    const submitVote = useMutatePollVoteSwr()
    const [localVotedId, setLocalVotedId] = useState<string | null>(null)

    // Server truth wins once it lands (myOptionId after revalidate); the local id
    // only covers the optimistic window between click and revalidate.
    const votedId = poll?.myOptionId ?? localVotedId
    // While optimistic (server tallies do not include the click yet) add the +1
    // locally; after revalidate the server voteCount already carries it.
    const pending = localVotedId !== null && !poll?.myOptionId

    const onVote = (optionId: string) => {
        if (!poll || votedId !== null) {
            return
        }
        setLocalVotedId(optionId)
        submitVote(poll.postId, optionId)
            .then((ok) => {
                if (!ok) {
                    // Guest — the auth modal opened; undo the reveal.
                    setLocalVotedId(null)
                }
            })
            .catch(() => {
                setLocalVotedId(null)
                toast.danger(t("poll.voteFailed"))
            })
    }

    const extra = pending ? 1 : 0
    const total = (poll?.options ?? []).reduce((sum, option) => sum + option.votes, 0) + extra
    const votesOf = (id: string, base: number) => base + (pending && localVotedId === id ? 1 : 0)
    const percentOf = (votes: number) => (total === 0 ? 0 : Math.round((votes / total) * 100))

    return (
        <AsyncContent
            isLoading={isLoading && !poll}
            skeleton={<PollSkeleton />}
            isEmpty={!isLoading && !error && !poll}
            emptyContent={{ title: t("poll.empty") }}
            error={!poll ? error : undefined}
            errorContent={{
                title: t("poll.error"),
                onRetry: () => void mutate(),
                retryLabel: t("states.retry"),
            }}
        >
            {poll ? (
                <div className="flex flex-col gap-3">
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
                                    onClick={() => onVote(option.id)}
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
            ) : null}
        </AsyncContent>
    )
}
