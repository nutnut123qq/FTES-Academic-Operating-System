"use client"

import React, { useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { SegmentedControl } from "@/components/blocks/navigation/SegmentedControl"
import { useGetMockInterviewInProgressSwr } from "@/hooks/swr/api/rest/queries/useGetMockInterviewInProgressSwr"
import { usePostDrawMockInterviewSessionSwr } from "@/hooks/swr/api/rest/mutations/usePostDrawMockInterviewSessionSwr"
import { RestError } from "@/modules/api/rest/client"
import type {
    MockInterviewTier,
    SessionDrawView,
    SessionView,
} from "@/modules/api/rest/mockinterview"
import { isAiDownError } from "./errors"

/** Props for {@link GreenRoom}. */
export interface GreenRoomProps {
    /**
     * RAW `course.id` UUID — NOT the route slug. Every mock-interview endpoint resolves
     * enrolment by this id, so a slug always reads as "not enrolled". Empty while the
     * course detail is still loading (the SWR key gates on it and Start stays disabled).
     */
    courseRef: string
    onStarted: (draw: SessionDrawView) => void
    onResume: (session: SessionView) => void
}

/** Draw outcome that needs its own message (null = no error shown). */
type DrawFailure = "forbidden" | "aiDown" | "generic"

const TIERS: Array<MockInterviewTier> = ["junior", "middle", "senior"]
const COUNTS: Array<number> = [3, 5, 10]

/**
 * Maps a failed `POST /ai/mock-interview/sessions` to the message the learner should see.
 *
 * `MOCK_INTERVIEW_INVALID_PAYLOAD` counts as "AI down" here: on the draw path the backend
 * catches every ftes-ai-service failure and re-raises it as that code
 * (`MockInterviewSessionService.drawSeedQuestions`), and the only other trigger — a blank
 * `courseRef` — is already prevented client-side by the disabled Start button.
 */
const classifyDrawError = (error: unknown): DrawFailure => {
    if (error instanceof RestError) {
        // Only the domain code (or a bare 403 with no code) means "not enrolled" — a 403 from
        // the permission guard carries its own code and must not claim a missing enrolment.
        if (
            error.errorCode === "MOCK_INTERVIEW_FORBIDDEN" ||
            (!error.errorCode && error.status === 403)
        ) {
            return "forbidden"
        }
        if (isAiDownError(error) || error.errorCode === "MOCK_INTERVIEW_INVALID_PAYLOAD") {
            return "aiDown"
        }
    }
    return "generic"
}

/**
 * Green room: pick tier + question count and draw a session (server-side). Offers to resume an
 * in-progress session when one exists. A 403 draw shows an enroll CTA (enrolled-only, BE-gated);
 * a dead ftes-ai-service shows its own "AI is unavailable" notice instead of the generic retry
 * line, because there is nothing the learner can fix by retrying immediately.
 *
 * @param props - {@link GreenRoomProps}
 */
export const GreenRoom = ({ courseRef, onStarted, onResume }: GreenRoomProps) => {
    const t = useTranslations("learn")
    const inProgress = useGetMockInterviewInProgressSwr(courseRef)
    const draw = usePostDrawMockInterviewSessionSwr()
    const [tier, setTier] = useState<MockInterviewTier>("middle")
    const [count, setCount] = useState<number>(5)
    const [failure, setFailure] = useState<DrawFailure | null>(null)

    const start = async () => {
        setFailure(null)
        try {
            const result = await draw.trigger({ courseRef, tier, questionCount: count })
            onStarted(result)
        } catch (error) {
            setFailure(classifyDrawError(error))
        }
    }

    const resumable = inProgress.data ?? null

    return (
        <div className="flex flex-col gap-6">
            {resumable ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-default bg-surface p-4">
                    <Typography type="body-sm" weight="semibold">{t("mockInterview.resumeTitle")}</Typography>
                    <Typography type="body-xs" color="muted">{t("mockInterview.resumeBody")}</Typography>
                    <div>
                        <Button variant="secondary" size="sm" onPress={() => onResume(resumable)}>
                            {t("mockInterview.resume")}
                        </Button>
                    </div>
                </div>
            ) : null}

            <div className="flex flex-col gap-3">
                <Typography type="body-sm" weight="semibold">{t("mockInterview.tierLabel")}</Typography>
                <SegmentedControl<MockInterviewTier>
                    ariaLabel={t("mockInterview.tierLabel")}
                    value={tier}
                    onChange={setTier}
                    items={TIERS.map((value) => ({ value, label: t(`mockInterview.tier.${value}`) }))}
                />
            </div>

            <div className="flex flex-col gap-3">
                <Typography type="body-sm" weight="semibold">{t("mockInterview.countLabel")}</Typography>
                <SegmentedControl<string>
                    ariaLabel={t("mockInterview.countLabel")}
                    value={String(count)}
                    onChange={(value) => setCount(Number(value))}
                    items={COUNTS.map((n) => ({ value: String(n), label: String(n) }))}
                />
            </div>

            {failure === "forbidden" ? (
                <div className="flex flex-col gap-2 rounded-2xl border border-warning bg-warning/10 p-4">
                    <Typography type="body-sm" weight="semibold">{t("mockInterview.forbiddenTitle")}</Typography>
                    <Typography type="body-xs" color="muted">{t("mockInterview.forbiddenBody")}</Typography>
                </div>
            ) : null}
            {failure === "aiDown" ? (
                <div className="flex flex-col gap-2 rounded-2xl border border-warning bg-warning/10 p-4">
                    <Typography type="body-sm" weight="semibold">{t("mockInterview.aiDownTitle")}</Typography>
                    <Typography type="body-xs" color="muted">{t("mockInterview.aiDownBody")}</Typography>
                </div>
            ) : null}
            {failure === "generic" ? (
                <Typography type="body-xs" className="text-danger">{t("mockInterview.startFailed")}</Typography>
            ) : null}

            <div>
                <Button
                    variant="primary"
                    onPress={() => void start()}
                    isDisabled={draw.isMutating || !courseRef}
                    isPending={draw.isMutating}
                >
                    {t("mockInterview.start")}
                </Button>
            </div>
        </div>
    )
}

export default GreenRoom
