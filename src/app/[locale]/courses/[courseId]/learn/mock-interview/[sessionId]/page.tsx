"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { Scorecard } from "@/components/features/learn/MockInterview/Scorecard"
import { useGetMockInterviewAttemptBySessionSwr } from "@/hooks/swr/api/rest/queries/useGetMockInterviewAttemptBySessionSwr"

/**
 * `/courses/[courseId]/learn/mock-interview/[sessionId]` — refresh-safe,
 * shareable graded scorecard for a completed mock-interview session.
 */
const Page = () => {
    const t = useTranslations("learn")
    const router = useRouter()
    const { courseId, sessionId } = useParams<{ courseId: string; sessionId: string }>()
    const swr = useGetMockInterviewAttemptBySessionSwr(sessionId)
    const scorecard = swr.data

    const backToPractice = () => {
        router.push(`/courses/${courseId}/learn/mock-interview`)
    }

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <Typography type="h4">{t("mockInterview.title")}</Typography>
                <Typography type="body-sm" color="muted">{t("mockInterview.subtitle")}</Typography>
            </div>

            <AsyncContent
                isLoading={!swr.data && !swr.error}
                skeleton={<Skeleton className="h-96 w-full rounded-2xl" />}
                isEmpty={scorecard === null}
                emptyContent={{
                    title: t("mockInterview.scorecardEmptyTitle"),
                    description: t("mockInterview.scorecardEmptyBody"),
                    action: (
                        <Button variant="primary" size="sm" onPress={backToPractice}>
                            {t("mockInterview.retryPractice")}
                        </Button>
                    ),
                }}
                error={!swr.data ? swr.error : undefined}
                errorContent={{
                    title: t("mockInterview.errorTitle"),
                    onRetry: () => { void swr.mutate() },
                    retryLabel: t("mockInterview.retry"),
                }}
            >
                {scorecard ? (
                    <Scorecard scorecard={scorecard} onRetry={backToPractice} />
                ) : null}
            </AsyncContent>
        </div>
    )
}

export default Page
