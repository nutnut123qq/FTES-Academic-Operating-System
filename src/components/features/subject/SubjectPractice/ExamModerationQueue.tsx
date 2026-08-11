"use client"

import React, { useCallback, useMemo, useState } from "react"
import { Button, Chip, Input, Typography, TextField } from "@heroui/react"
import { useTranslations } from "next-intl"

import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useGetResourceModerationQueueSwr } from "@/hooks/swr/api/rest/queries/useGetResourceModerationQueueSwr"
import { usePostApproveResourceSwr } from "@/hooks/swr/api/rest/mutations/usePostApproveResourceSwr"
import { usePostRejectResourceSwr } from "@/hooks/swr/api/rest/mutations/usePostRejectResourceSwr"
import { useRestWithToast } from "@/modules/toast/hooks"
import { BE_EXAM_TYPE, type SubjectExamKind } from "../hooks/useQuerySubjectExamsSwr"

/** Props for {@link ExamModerationQueue}. */
export interface ExamModerationQueueProps {
    /** Subject **UUID** the queue is narrowed to; `null` until the subject resolves. */
    subjectUuid: string | null
    /** Which exam flavour this queue moderates. */
    kind: SubjectExamKind
    /** Re-read the published list after an approval lands. */
    onModerated: () => void
}

/**
 * The CTV/admin review queue for contributed PE papers / FE albums.
 *
 * `GET /api/v1/resources/moderation/pending` is global, so the rows are narrowed
 * client-side to THIS subject and THIS exam type — a moderator working inside a subject
 * workspace should not be handed another subject's backlog. Approving/rejecting goes
 * through the existing `POST /resources/{id}/approve` / `/reject` wrappers; a rejection
 * requires a reason (BE `RejectRequest.reason`), typed inline on the row.
 *
 * Rendered only for a viewer who holds a resource-moderation permission — the caller
 * owns that gate, and the server re-checks.
 *
 * @param props - {@link ExamModerationQueueProps}
 */
export const ExamModerationQueue = ({
    subjectUuid,
    kind,
    onModerated,
}: ExamModerationQueueProps) => {
    const t = useTranslations("subjects")
    const runRest = useRestWithToast()
    const queueSwr = useGetResourceModerationQueueSwr({ size: 50 })
    const approve = usePostApproveResourceSwr()
    const reject = usePostRejectResourceSwr()

    /** Row whose "reject" reason box is open, plus the typed reason. */
    const [rejectingId, setRejectingId] = useState<string | null>(null)
    const [reason, setReason] = useState("")
    /** Row with a write in flight — only that row's buttons spin. */
    const [busyId, setBusyId] = useState<string | null>(null)

    const beType = BE_EXAM_TYPE[kind]
    const pending = useMemo(
        () =>
            (queueSwr.data?.items ?? []).filter(
                (item) =>
                    (!subjectUuid || item.subjectId === subjectUuid) &&
                    (item.type ?? "").toUpperCase() === beType,
            ),
        [queueSwr.data, subjectUuid, beType],
    )

    const afterWrite = useCallback(async () => {
        await queueSwr.mutate().catch(() => undefined)
        onModerated()
    }, [queueSwr, onModerated])

    const onApprove = useCallback(
        async (id: string) => {
            setBusyId(id)
            const ok = await runRest(() => approve.trigger(id), {
                successMessage: t("practice.exam.moderation.approved"),
            })
            setBusyId(null)
            if (ok !== null) {
                await afterWrite()
            }
        },
        [approve, runRest, t, afterWrite],
    )

    const onReject = useCallback(
        async (id: string) => {
            const trimmed = reason.trim()
            if (trimmed === "") {
                return
            }
            setBusyId(id)
            const ok = await runRest(
                () => reject.trigger({ id, request: { reason: trimmed } }),
                { successMessage: t("practice.exam.moderation.rejected") },
            )
            setBusyId(null)
            if (ok !== null) {
                setRejectingId(null)
                setReason("")
                await afterWrite()
            }
        },
        [reject, reason, runRest, t, afterWrite],
    )

    // Không gate bằng permission ở client (xem ghi chú trong ExamList): server mới quyết ai thấy
    // gì — người không có quyền duyệt luôn nhận danh sách RỖNG. Nên khối này chỉ xuất hiện khi
    // THỰC SỰ có bài chờ duyệt: học viên thường không thấy gì, và cũng không bị nháy một hộp
    // cảnh báo rỗng trong lúc request bay. Không cần skeleton — đây là surface phụ.
    if (pending.length === 0) {
        return null
    }

    return (
        <section className="flex flex-col gap-3 rounded-2xl border border-warning/40 bg-warning/5 p-4">
            <div className="flex items-center gap-2">
                <Typography type="body" weight="semibold">
                    {t("practice.exam.moderation.title")}
                </Typography>
                <Chip size="sm" variant="soft" color="warning">
                    {t("practice.exam.moderation.count", { count: pending.length })}
                </Chip>
            </div>

            <AsyncContent
                isLoading={!queueSwr.data && !queueSwr.error}
                skeleton={
                    <div className="flex flex-col gap-2">
                        {[0, 1].map((row) => (
                            <Skeleton key={row} className="h-14 w-full rounded-2xl" />
                        ))}
                    </div>
                }
                isEmpty={pending.length === 0}
                emptyContent={{ title: t("practice.exam.moderation.empty") }}
                error={!queueSwr.data ? queueSwr.error : undefined}
                errorContent={{
                    title: t("practice.exam.moderation.loadError"),
                    onRetry: () => {
                        void queueSwr.mutate()
                    },
                    retryLabel: t("practice.exam.retry"),
                }}
            >
                <div className="flex flex-col gap-2">
                    {pending.map((item) => (
                        <div
                            key={item.id}
                            className="flex flex-col gap-2 rounded-2xl border border-separator bg-background p-3"
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <Typography
                                    type="body-sm"
                                    weight="medium"
                                    className="min-w-0 flex-1"
                                    truncate
                                >
                                    {item.title}
                                </Typography>
                                <Button
                                    size="sm"
                                    variant="primary"
                                    isDisabled={busyId === item.id}
                                    isPending={busyId === item.id && rejectingId !== item.id}
                                    onPress={() => {
                                        void onApprove(item.id)
                                    }}
                                >
                                    {t("practice.exam.moderation.approve")}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="tertiary"
                                    isDisabled={busyId === item.id}
                                    onPress={() => {
                                        setRejectingId(
                                            rejectingId === item.id ? null : item.id,
                                        )
                                        setReason("")
                                    }}
                                >
                                    {t("practice.exam.moderation.reject")}
                                </Button>
                            </div>

                            {rejectingId === item.id ? (
                                <div className="flex flex-wrap items-end gap-2">
                                    <TextField
                                        variant="primary"
                                        className="min-w-0 flex-1"
                                        isDisabled={busyId === item.id}
                                    >
                                        <Input
                                            variant="primary"
                                            value={reason}
                                            placeholder={t(
                                                "practice.exam.moderation.reasonPlaceholder",
                                            )}
                                            aria-label={t(
                                                "practice.exam.moderation.reasonPlaceholder",
                                            )}
                                            onChange={(event) => setReason(event.target.value)}
                                        />
                                    </TextField>
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        isDisabled={reason.trim() === "" || busyId === item.id}
                                        isPending={busyId === item.id}
                                        onPress={() => {
                                            void onReject(item.id)
                                        }}
                                    >
                                        {t("practice.exam.moderation.confirmReject")}
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    ))}
                </div>
            </AsyncContent>
        </section>
    )
}
