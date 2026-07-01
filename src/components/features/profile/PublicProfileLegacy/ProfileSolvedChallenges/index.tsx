"use client"

import React from "react"
import {
    cn,
    Link,
    Typography,
} from "@heroui/react"
import {
    Link as LinkIcon,
} from "@gravity-ui/icons"
import {
    useTranslations,
} from "next-intl"
import {
    useProfileUsername,
} from "../useProfileUsername"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { useQueryUserSolvedChallengesSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserSolvedChallengesSwr"
import { SectionCard } from "@/components/reuseable/SectionCard"
import { ListRow } from "@/components/blocks/lists/ListRow"
import { StatPair } from "@/components/blocks/stats/StatPair"

/** Maximum number of solved-challenge rows shown before the list is capped. */
const MAX_LIST_ROWS = 6

/** Props for {@link ProfileSolvedChallenges}. */
export type ProfileSolvedChallengesProps = WithClassNames<undefined>

/**
 * Skills-tab section that surfaces the user's graded challenge submissions as
 * a signal of breadth and verified effort. Shows a total count via
 * {@link StatPair}, then a short {@link ListRow} list (capped at
 * {@link MAX_LIST_ROWS}) where each row links out to the submitted repo /
 * document. Returns null when the user has no solved challenges so sparse
 * profiles stay clean.
 *
 * Self-contained container: reads the username from the route, resolves it to
 * the entity id, and drives its own SWR (projection-backed, deduped with
 * {@link import("../ProfileCapstone").ProfileCapstone}).
 *
 * @param props - {@link ProfileSolvedChallengesProps}
 */
export const ProfileSolvedChallenges = ({
    className,
}: ProfileSolvedChallengesProps) => {
    const t = useTranslations()
    const username = useProfileUsername()
    const { data: user } = useQueryUserProfileSwr(username)
    const userId = user?.id ?? null
    const { data } = useQueryUserSolvedChallengesSwr(userId)

    const challenges = data ?? []

    // no solved challenges yet → hide entirely (keeps sparse profiles clean)
    if (challenges.length === 0) {
        return null
    }

    const visible = challenges.slice(0, MAX_LIST_ROWS)
    const overflow = challenges.length - visible.length

    return (
        <SectionCard
            title={t("publicProfile.solvedChallengesTitle")}
            className={cn(className)}
        >
            {/* summary row: total count stat */}
            <div className="flex flex-wrap items-center gap-3">
                <StatPair
                    value={challenges.length}
                    label={t("publicProfile.challengesCount")}
                />
            </div>

            {/* short list of solved challenges — title + repo link */}
            <div className="flex flex-col">
                {visible.map((challenge, index) => (
                    <ListRow
                        key={`${challenge.submissionUrl}-${index}`}
                        title={challenge.title}
                        subtitle={challenge.selectedLang ?? undefined}
                        trailing={
                            challenge.submissionUrl ? (
                                <Link
                                    href={challenge.submissionUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex shrink-0 items-center gap-2 text-accent underline"
                                    aria-label={t("publicProfile.openRepo", {
                                        title: challenge.title,
                                    })}
                                >
                                    <LinkIcon
                                        className="size-5"
                                        aria-hidden="true"
                                        focusable="false"
                                    />
                                    <Typography type="body-xs">
                                        {t("publicProfile.repoLink")}
                                    </Typography>
                                </Link>
                            ) : null
                        }
                        divider={index < visible.length - 1}
                    />
                ))}
                {overflow > 0 ? (
                    <Typography type="body-xs" color="muted" className="pt-2">
                        {t("publicProfile.moreChallenges", { count: overflow })}
                    </Typography>
                ) : null}
            </div>
        </SectionCard>
    )
}
