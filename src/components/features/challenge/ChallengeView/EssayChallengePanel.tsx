/**
 * Bề mặt làm bài của challenge TỰ LUẬN trên route `/challenges/[challengeId]`.
 *
 * Vì sao phải có riêng: `ChallengeSolveSurface` trước đây chỉ biết `uiux` và `coding`/`sql`,
 * mà `mapChallengeType` lại gộp mọi type lạ về `"coding"` — nên đề tự luận mở ra TRÌNH SOẠN
 * CODE kèm bộ chọn ngôn ngữ, và nút nộp gửi `{payloadType:"CODE"}` cho một bài văn. Route
 * học trong khoá (`features/learn/ChallengeSubmission`) đã giải đúng bài toán này từ lâu,
 * nhưng nó đọc `useParams()` của tuyến course/module/content nên không dùng lại nguyên khối
 * ở đây được; panel này lấy đúng phần tự luận và dùng CHUNG hook + chuỗi dịch với nó.
 *
 * Chấm bài chạy BẤT ĐỒNG BỘ (backend đẩy Kafka sang ftes-ai-service), nên danh sách lượt nộp
 * tự làm mới 5 giây một lần cho tới khi mọi lượt về trạng thái cuối —
 * {@link useQueryChallengeSubmissionSwr} lo phần đó, ở đây chỉ hiển thị.
 */
"use client"

import React, { useState } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { usePostSubmitChallengeSwr } from "@/hooks/swr/api/rest/mutations/usePostSubmitChallengeSwr"
import {
    isChallengeSubmissionPending,
    useQueryChallengeSubmissionSwr,
} from "@/components/features/learn/hooks/useQueryChallengeSubmissionSwr"
import type { SubmissionView } from "@/modules/api/rest/challenges"

/** Trần độ dài khớp `SubmissionService.MAX_ESSAY_LEN` của backend — chặn ở đây để người học
 *  thấy giới hạn TRƯỚC khi gõ xong 20.000 ký tự rồi mới ăn 400. */
const MAX_ESSAY_LEN = 20_000

/** Trạng thái bài nộp (đã chuẩn hoá ở lớp REST) → khoá dịch + màu chip. */
const STATUS_VIEW: Record<string, { key: string; color: "default" | "warning" | "success" | "danger" }> = {
    PENDING: { key: "pending", color: "default" },
    QUEUED: { key: "pending", color: "default" },
    GRADING: { key: "grading", color: "warning" },
    COMPLETED: { key: "completed", color: "success" },
    FAILED: { key: "failed", color: "danger" },
}

/** Props for {@link EssayChallengePanel}. */
export interface EssayChallengePanelProps {
    /** Slug (hoặc UUID) của challenge — đúng thứ route `/challenges/[challengeId]` mang theo. */
    challengeId: string
}

/** Một dòng lịch sử nộp. */
const AttemptRow = ({ submission }: { submission: SubmissionView }) => {
    const t = useTranslations("learn")
    const view = STATUS_VIEW[submission.status] ?? STATUS_VIEW.PENDING
    const score = submission.finalScore ?? submission.autoScore

    return (
        <li className="flex flex-wrap items-center justify-between gap-2 border-b border-separator py-2 last:border-b-0">
            <Typography type="body-sm">
                {t("exercises.challenge.attemptLine", { number: submission.attemptNo })}
            </Typography>
            <div className="flex items-center gap-2">
                {/* Điểm chỉ hiện khi ĐÃ có — bài đang chấm mà in "Điểm: —" thì trông như chấm 0. */}
                {score !== null && score !== "" ? (
                    <Typography type="body-sm" weight="medium">
                        {t("exercises.challenge.score", { score })}
                    </Typography>
                ) : null}
                <Chip size="sm" variant="soft" color={view.color}>
                    {t(`exercises.challenge.status.${view.key}`)}
                </Chip>
            </div>
        </li>
    )
}

/**
 * Ô soạn bài luận + nút nộp + lịch sử lượt nộp.
 *
 * Hết lượt (`maxSubmissions`) thì khoá ô nhập thay vì để người học gõ xong mới nhận lỗi từ
 * server.
 */
export const EssayChallengePanel = ({ challengeId }: EssayChallengePanelProps) => {
    const t = useTranslations("learn")
    const { guard } = useRequireAuth()
    const [essayText, setEssayText] = useState("")
    const { challenge, submissions, mutate } = useQueryChallengeSubmissionSwr(challengeId)
    const submit = usePostSubmitChallengeSwr()

    const maxSubmissions = challenge?.maxSubmissions ?? 0
    const used = submissions.length
    const outOfAttempts = maxSubmissions > 0 && used >= maxSubmissions
    const isPending = submissions.some(isChallengeSubmissionPending)
    const canSubmit = essayText.trim().length > 0 && !submit.isMutating && !outOfAttempts

    const onSubmit = guard(() => {
        if (!challenge || !canSubmit) {
            return
        }
        void submit
            .trigger({
                id: challenge.id,
                request: { payloadType: "ESSAY", essayText: essayText.trim() },
            })
            .then(() => {
                setEssayText("")
                // Kéo lại danh sách ngay để lượt vừa nộp hiện ra ở trạng thái "Đang chấm",
                // rồi hook tự poll cho tới khi có điểm.
                void mutate()
            })
            .catch(() => {
                // useSWRMutation giữ lỗi ở `submit.error`, render bên dưới.
            })
    }, "auth.context.generic")

    // Sắp xếp mới nhất trước; BE không cam kết thứ tự của `/submissions/me`.
    const ordered = [...submissions].sort((a, b) => b.attemptNo - a.attemptNo)

    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-separator p-4 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Typography type="body-sm" weight="semibold">
                    {t("exercises.challenge.submitTitle")}
                </Typography>
                {maxSubmissions > 0 ? (
                    <Typography type="body-xs" color="muted">
                        {t("exercises.challenge.submissionsCount", {
                            used,
                            max: maxSubmissions,
                        })}
                    </Typography>
                ) : null}
            </div>

            <label className="flex flex-col gap-1.5">
                <Typography type="body-sm" color="muted">
                    {t("exercises.challenge.essayLabel")}
                </Typography>
                <textarea
                    value={essayText}
                    onChange={(event) => setEssayText(event.target.value.slice(0, MAX_ESSAY_LEN))}
                    placeholder={t("exercises.challenge.essayPlaceholder")}
                    disabled={outOfAttempts}
                    rows={14}
                    className="w-full resize-y rounded-xl border border-separator bg-transparent p-3 text-sm leading-relaxed outline-none focus-visible:border-accent disabled:opacity-60"
                />
            </label>

            {outOfAttempts ? (
                <Typography type="body-sm" color="muted">
                    {t("exercises.challenge.maxReached", { max: maxSubmissions })}
                </Typography>
            ) : (
                <Button className="self-start" onPress={onSubmit} isDisabled={!canSubmit}>
                    {submit.isMutating
                        ? t("exercises.challenge.submitting")
                        : t("exercises.challenge.submit")}
                </Button>
            )}

            {submit.error ? (
                <Typography type="body-sm" className="text-danger" role="alert">
                    {t("exercises.challenge.error")}
                </Typography>
            ) : null}

            {ordered.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                    <Typography type="body-sm" weight="semibold">
                        {t("exercises.challenge.historyTitle")}
                    </Typography>
                    <ul className="flex flex-col">
                        {ordered.map((submission) => (
                            <AttemptRow key={submission.id} submission={submission} />
                        ))}
                    </ul>
                    {isPending ? (
                        <Typography type="body-xs" color="muted">
                            {t("exercises.challenge.pendingHint")}
                        </Typography>
                    ) : null}
                </div>
            ) : null}
        </div>
    )
}
