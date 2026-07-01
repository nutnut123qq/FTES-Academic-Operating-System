"use client"

import React, { useMemo } from "react"
import {
    Surface,
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    TaskResultsSkeleton,
} from "../TaskResultsSkeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { Score } from "@/components/reuseable/Score"
import { StarCiAIBadge } from "@/components/reuseable/StarCiAIBadge"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { useQueryUserPersonalTaskAttemptsSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserPersonalTaskAttemptsSwr"

/** Props for {@link TaskResults}. */
export type TaskResultsProps = WithClassNames<undefined>

/**
 * Grading results block: AI badge, score, and short feedback.
 *
 * Self-contained: reads the latest attempt from its own SWR query.
 * Renders nothing when there are no attempts yet.
 * @param props - optional className for the root element
 */
export const TaskResults = ({
    className,
}: TaskResultsProps = {}) => {
    const t = useTranslations()
    const attemptsSwr = useQueryUserPersonalTaskAttemptsSwr()

    const attemptRows = useMemo(
        () => attemptsSwr.data?.data ?? [],
        [attemptsSwr.data?.data],
    )
    const latestAttempt = attemptRows[0]

    const shortFeedback = useMemo(() => {
        const raw = latestAttempt?.shortFeedback?.trim() ?? ""
        return raw || t("finalProject.page.attemptsDrawer.feedbackEmpty")
    }, [latestAttempt?.shortFeedback, t])

    // first load → mirror skeleton; once resolved with no attempt → self-hide (null)
    return (
        <AsyncContent
            isLoading={attemptsSwr.isLoading}
            skeleton={<TaskResultsSkeleton className={className} />}
            isEmpty={!latestAttempt}
        >
            <div className={cn("flex flex-col gap-3", className)}>
                <div className="flex items-center gap-2">
                    <div className="font-semibold">{t("task.resultsTitle")}</div>
                    <StarCiAIBadge />
                </div>
                <Surface className="p-3 rounded-3xl">
                    <div className="text-4xl font-bold text-foreground">
                        <Score current={latestAttempt?.score ?? 0} max={20} />
                    </div>
                    <div className="mt-3 text-sm text-muted">
                        {shortFeedback}
                    </div>
                </Surface>
            </div>
        </AsyncContent>
    )
}
