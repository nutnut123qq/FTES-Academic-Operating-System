"use client"

import React, { useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useGetInterviewTemplateSwr } from "@/hooks/swr/api/rest/queries/useGetInterviewTemplateSwr"
import { usePostStartInterviewAttemptSwr } from "@/hooks/swr/api/rest/mutations/usePostStartInterviewAttemptSwr"
import type { StartAttemptView } from "@/modules/api/rest/interview"

/** Props for {@link GreenRoom}. */
export interface GreenRoomProps {
    courseId: string
    onStarted: (attempt: StartAttemptView, questionSetId: string) => void
}

/**
 * Course interview intake: shows the template overview and a ready question set,
 * then starts the attempt. The backend enforces enrollment (a 403 surfaces an
 * enroll CTA).
 */
export const GreenRoom = ({ courseId, onStarted }: GreenRoomProps) => {
    const t = useTranslations("learn")
    const template = useGetInterviewTemplateSwr(courseId)
    const start = usePostStartInterviewAttemptSwr()
    const [forbidden, setForbidden] = useState(false)
    const [failed, setFailed] = useState(false)

    const questionSet = template.data?.questionSet
    // The REST envelope wraps data under `data`; degrade gracefully if absent.
    const questionSetId = questionSet?.id
    const questionCount = questionSet?.questions?.length ?? 0

    const handleStart = async () => {
        if (!questionSetId) return
        setForbidden(false)
        setFailed(false)
        try {
            const attempt = await start.trigger({ questionSetId })
            onStarted(attempt, questionSetId)
        } catch (error) {
            const message = error instanceof Error ? error.message : ""
            if (message.includes("INTERVIEW_FORBIDDEN") || message.includes("403")) {
                setForbidden(true)
            } else {
                setFailed(true)
            }
        }
    }

    const skeleton = (
        <div className="flex flex-col gap-6">
            <Skeleton className="h-8 w-2/3 rounded-large" />
            <Skeleton.Paragraph lines={4} />
            <Skeleton className="h-10 w-32 rounded-large" />
        </div>
    )

    return (
        <AsyncContent
            isLoading={!template.data && !template.error}
            skeleton={skeleton}
            error={!template.data ? template.error : undefined}
            errorContent={{
                title: t("courseInterview.errorTitle"),
                onRetry: () => { void template.mutate() },
                retryLabel: t("courseInterview.retry"),
            }}
        >
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3 rounded-2xl border border-default bg-surface p-4">
                    <Typography type="body-sm" weight="semibold">{t("courseInterview.overviewTitle")}</Typography>
                    <Typography type="body-xs" color="muted">{t("courseInterview.overviewBody")}</Typography>
                    <Typography type="body-xs" color="muted">
                        {t("courseInterview.questionCount", { count: questionCount })}
                    </Typography>
                </div>

                {!questionSetId && template.data ? (
                    <div className="flex flex-col gap-2 rounded-2xl border border-warning bg-warning/10 p-4">
                        <Typography type="body-sm" weight="semibold">{t("courseInterview.notReadyTitle")}</Typography>
                        <Typography type="body-xs" color="muted">{t("courseInterview.notReadyBody")}</Typography>
                    </div>
                ) : null}

                {forbidden ? (
                    <div className="flex flex-col gap-2 rounded-2xl border border-warning bg-warning/10 p-4">
                        <Typography type="body-sm" weight="semibold">{t("courseInterview.forbiddenTitle")}</Typography>
                        <Typography type="body-xs" color="muted">{t("courseInterview.forbiddenBody")}</Typography>
                    </div>
                ) : null}
                {failed ? (
                    <Typography type="body-xs" className="text-danger">{t("courseInterview.startFailed")}</Typography>
                ) : null}

                <div>
                    <Button
                        variant="primary"
                        onPress={() => void handleStart()}
                        isDisabled={start.isMutating || !questionSetId}
                        isPending={start.isMutating}
                    >
                        {t("courseInterview.start")}
                    </Button>
                </div>
            </div>
        </AsyncContent>
    )
}
