"use client"

import React, { useState } from "react"
import { Button, Chip, Input, Label, TextArea, TextField, Typography } from "@heroui/react"
import { PencilSimpleIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { LessonFlashcardView } from "@/modules/api/rest/course"
import {
    useDeleteLessonFlashcardSwr,
    usePatchLessonFlashcardSwr,
    usePostLessonFlashcardSwr,
} from "@/hooks/swr/api/rest/mutations"
import { useRestWithToast } from "@/modules/toast/hooks"

/** Props for {@link LessonFlashcardManager}. */
export interface LessonFlashcardManagerProps {
    /** Bài đang soạn thẻ. */
    lessonId: string
    /** Thẻ hiện có — người quản nhận CẢ `DRAFT` lẫn `PUBLISHED` từ cùng endpoint đọc. */
    cards: Array<LessonFlashcardView>
    /** Nạp lại danh sách sau mỗi lần ghi. */
    onChanged: () => void
}

/** Bản nháp đang gõ trong form (thêm mới hoặc sửa). */
interface Draft {
    front: string
    back: string
    hint: string
}

const EMPTY: Draft = { front: "", back: "", hint: "" }

/**
 * Màn SOẠN thẻ ghi nhớ của một bài — chỉ mở cho người quản khoá (`canManage` từ
 * `GET /courses/lessons/{id}/flashcards`).
 *
 * Đây là lõi mà góp ý website 2026-07-26 đòi: "vẫn nên để là tính năng AI nhưng lõi bên trong
 * nên để instructor tạo tay câu hỏi và đáp án". Thẻ tay có mặt là học viên dùng bộ đó, AI
 * không được gọi nữa (xem `LessonAiFlashcards`).
 *
 * Trạng thái thẻ: `DRAFT` chỉ người soạn thấy, `PUBLISHED` mới tới tay học viên — nên nút
 * xuất bản/ẩn là công tắc chính của màn này, không phải nút phụ.
 *
 * @param props - {@link LessonFlashcardManagerProps}
 */
export const LessonFlashcardManager = ({
    lessonId,
    cards,
    onChanged,
}: LessonFlashcardManagerProps) => {
    const t = useTranslations("contentAi")
    const runRest = useRestWithToast()
    const { trigger: create, isMutating: creating } = usePostLessonFlashcardSwr(lessonId)
    const { trigger: patch } = usePatchLessonFlashcardSwr()
    const { trigger: remove } = useDeleteLessonFlashcardSwr()

    /** id thẻ đang sửa; `null` = form đang ở chế độ thêm mới. */
    const [editingId, setEditingId] = useState<string | null>(null)
    const [draft, setDraft] = useState<Draft>(EMPTY)

    const trimmed = { front: draft.front.trim(), back: draft.back.trim(), hint: draft.hint.trim() }
    const canSubmit = trimmed.front.length > 0 && trimmed.back.length > 0 && !creating

    const resetForm = () => {
        setEditingId(null)
        setDraft(EMPTY)
    }

    const submit = async () => {
        if (!canSubmit) {
            return
        }
        // hint rỗng gửi null để BE xoá gợi ý cũ, không phải lưu chuỗi rỗng.
        const body = { front: trimmed.front, back: trimmed.back, hint: trimmed.hint || null }
        const result = await runRest(
            () => (editingId ? patch({ cardId: editingId, request: body }) : create(body)),
            { successMessage: t("flashcard.manage.saved") },
        )
        if (result !== null) {
            resetForm()
            onChanged()
        }
    }

    const startEdit = (card: LessonFlashcardView) => {
        setEditingId(card.id)
        setDraft({ front: card.front, back: card.back, hint: card.hint ?? "" })
    }

    /** Bật/tắt xuất bản — công tắc quyết định học viên có thấy thẻ hay không. */
    const togglePublish = async (card: LessonFlashcardView) => {
        const next = card.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"
        const result = await runRest(
            () => patch({ cardId: card.id, request: { status: next } }),
            { successMessage: t("flashcard.manage.saved") },
        )
        if (result !== null) {
            onChanged()
        }
    }

    const destroy = async (card: LessonFlashcardView) => {
        const result = await runRest(() => remove(card.id), {
            successMessage: t("flashcard.manage.deleted"),
        })
        if (result !== null) {
            // Đang sửa đúng thẻ vừa xoá thì form phải nhả ra, kẻo lưu tiếp vào thẻ đã archived.
            if (editingId === card.id) {
                resetForm()
            }
            onChanged()
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
                <Typography type="body-sm" weight="semibold">
                    {editingId ? t("flashcard.manage.editTitle") : t("flashcard.manage.addTitle")}
                </Typography>

                <TextField variant="secondary">
                    <Label className="text-xs text-muted">{t("flashcard.questionLabel")}</Label>
                    <TextArea
                        rows={2}
                        value={draft.front}
                        onChange={(event) => setDraft((d) => ({ ...d, front: event.target.value }))}
                        className="resize-none"
                    />
                </TextField>

                <TextField variant="secondary">
                    <Label className="text-xs text-muted">{t("flashcard.answerLabel")}</Label>
                    <TextArea
                        rows={3}
                        value={draft.back}
                        onChange={(event) => setDraft((d) => ({ ...d, back: event.target.value }))}
                        className="resize-none"
                    />
                </TextField>

                <TextField variant="secondary">
                    <Label className="text-xs text-muted">{t("flashcard.manage.hintLabel")}</Label>
                    <Input
                        value={draft.hint}
                        onChange={(event) => setDraft((d) => ({ ...d, hint: event.target.value }))}
                    />
                </TextField>

                <div className="flex items-center gap-2">
                    <Button variant="primary" size="sm" isDisabled={!canSubmit} onPress={() => void submit()}>
                        <PlusIcon aria-hidden focusable="false" className="size-4" />
                        {editingId ? t("flashcard.manage.save") : t("flashcard.manage.add")}
                    </Button>
                    {editingId ? (
                        <Button variant="tertiary" size="sm" onPress={resetForm}>
                            {t("flashcard.manage.cancel")}
                        </Button>
                    ) : null}
                </div>
            </div>

            {cards.length === 0 ? (
                <Typography type="body-sm" color="muted">
                    {t("flashcard.manage.empty")}
                </Typography>
            ) : (
                <div className="flex flex-col gap-2">
                    {cards.map((card) => (
                        <div
                            key={card.id}
                            className="flex items-start gap-3 rounded-2xl border border-separator p-3"
                        >
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Typography type="body-sm" weight="medium">
                                        {card.front}
                                    </Typography>
                                    <Chip
                                        size="sm"
                                        variant="soft"
                                        color={card.status === "PUBLISHED" ? "success" : "default"}
                                    >
                                        {card.status === "PUBLISHED"
                                            ? t("flashcard.manage.published")
                                            : t("flashcard.manage.draft")}
                                    </Chip>
                                </div>
                                <Typography type="body-xs" color="muted">
                                    {card.back}
                                </Typography>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                                <Button
                                    variant="tertiary"
                                    size="sm"
                                    onPress={() => void togglePublish(card)}
                                >
                                    {card.status === "PUBLISHED"
                                        ? t("flashcard.manage.unpublish")
                                        : t("flashcard.manage.publish")}
                                </Button>
                                <Button
                                    variant="tertiary"
                                    size="sm"
                                    isIconOnly
                                    aria-label={t("flashcard.manage.edit")}
                                    onPress={() => startEdit(card)}
                                >
                                    <PencilSimpleIcon aria-hidden focusable="false" className="size-4" />
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    isIconOnly
                                    aria-label={t("flashcard.manage.delete")}
                                    onPress={() => void destroy(card)}
                                >
                                    <TrashIcon aria-hidden focusable="false" className="size-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
