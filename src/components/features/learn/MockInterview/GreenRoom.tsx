"use client"

import React, { useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { SegmentedControl } from "@/components/blocks/navigation/SegmentedControl"
import { useGetMockInterviewInProgressSwr } from "@/hooks/swr/api/rest/queries/useGetMockInterviewInProgressSwr"
import { usePostDrawMockInterviewSessionSwr } from "@/hooks/swr/api/rest/mutations/usePostDrawMockInterviewSessionSwr"
import type {
    MockInterviewTier,
    SessionDrawView,
    SessionView,
} from "@/modules/api/rest/mockinterview"

/** Props for {@link GreenRoom}. */
export interface GreenRoomProps {
    courseId: string
    onStarted: (draw: SessionDrawView) => void
    onResume: (session: SessionView) => void
}

const TIERS: Array<MockInterviewTier> = ["junior", "middle", "senior"]
const COUNTS: Array<number> = [3, 5, 10]

/**
 * Green room: pick tier + question count and draw a session (server-side). Offers to resume an
 * in-progress session when one exists. A 403 draw shows an enroll CTA (enrolled-only, BE-gated).
 *
 * @param props - {@link GreenRoomProps}
 */
export const GreenRoom = ({ courseId, onStarted, onResume }: GreenRoomProps) => {
    const t = useTranslations("learn")
    const inProgress = useGetMockInterviewInProgressSwr(courseId)
    const draw = usePostDrawMockInterviewSessionSwr()
    const [tier, setTier] = useState<MockInterviewTier>("middle")
    const [count, setCount] = useState<number>(5)
    const [forbidden, setForbidden] = useState(false)
    const [failed, setFailed] = useState(false)

    const start = async () => {
        setForbidden(false)
        setFailed(false)
        try {
            const result = await draw.trigger({ courseRef: courseId, tier, questionCount: count })
            onStarted(result)
        } catch (error) {
            const message = error instanceof Error ? error.message : ""
            if (message.includes("MOCK_INTERVIEW_FORBIDDEN")) {
                setForbidden(true)
            } else {
                setFailed(true)
            }
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

            {forbidden ? (
                <div className="flex flex-col gap-2 rounded-2xl border border-warning bg-warning/10 p-4">
                    <Typography type="body-sm" weight="semibold">{t("mockInterview.forbiddenTitle")}</Typography>
                    <Typography type="body-xs" color="muted">{t("mockInterview.forbiddenBody")}</Typography>
                </div>
            ) : null}
            {failed ? (
                <Typography type="body-xs" className="text-danger">{t("mockInterview.startFailed")}</Typography>
            ) : null}

            <div>
                <Button
                    variant="primary"
                    onPress={() => void start()}
                    isDisabled={draw.isMutating}
                    isPending={draw.isMutating}
                >
                    {t("mockInterview.start")}
                </Button>
            </div>
        </div>
    )
}

export default GreenRoom
