"use client"

import React, { useCallback, useState } from "react"
import { Button, Checkbox, Label } from "@heroui/react"
import { useTranslations } from "next-intl"
import { RichTextEditor } from "@/components/reuseable/RichTextEditor"
import {
    joinTitleIntoMarkdown,
    splitTitleFromMarkdown,
} from "@/components/reuseable/RichTextEditor/title"

/** The editable shape of an announcement (create + edit share it). */
export interface AnnouncementFormValues {
    title: string
    content: string
    pinned: boolean
}

/** Props for {@link AnnouncementForm}. */
export interface AnnouncementFormProps {
    /** Prefill — the edited announcement, or blanks when composing a new one. */
    initialValues?: AnnouncementFormValues
    /** Label of the submit button (already localized). */
    submitLabel: string
    /** Distinguishes the pinned checkbox across simultaneously open forms. */
    formId: string
    /** Runs the write; resolve `true` to let the form reset/close. */
    onSubmit: (values: AnnouncementFormValues) => Promise<boolean>
    /** Close without writing. */
    onCancel: () => void
}

/**
 * Announcement composer/editor — a SINGLE body editor + "pin to top" (no separate
 * title field). Used both for the owner's new-announcement composer and for the
 * inline edit of an existing card. The stored `title` + `content` are re-joined
 * into one Markdown value (title as a leading H1) so the author edits them
 * together, then split back apart on save (the H1 stays out of the stored body);
 * a PATCH always round-trips `pinned` instead of dropping it.
 *
 * @param props - {@link AnnouncementFormProps}
 */
export const AnnouncementForm = ({
    initialValues,
    submitLabel,
    formId,
    onSubmit,
    onCancel,
}: AnnouncementFormProps) => {
    const t = useTranslations("groupsHub")
    const [draft, setDraft] = useState(() =>
        joinTitleIntoMarkdown(initialValues?.title ?? "", initialValues?.content ?? ""),
    )
    const [pinned, setPinned] = useState(initialValues?.pinned ?? false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const isValid = draft.trim() !== ""
    const pinnedId = `announcement-pinned-${formId}`

    const submit = useCallback(async () => {
        if (!isValid || isSubmitting) {
            return
        }
        setIsSubmitting(true)
        // `fallbackTitle` vì `AnnouncementRequest` phía BE gắn `@NotBlank title` — thông báo không
        // có H1 dẫn đầu mà gửi tiêu đề rỗng là 400. Đây là bề mặt DUY NHẤT cần opt-in; các composer
        // còn lại ghi qua endpoint có title tuỳ chọn nên để rỗng, tránh in lặp một dòng thành hai.
        const { title, body: content } = splitTitleFromMarkdown(draft, { fallbackTitle: true })
        const saved = await onSubmit({ title, content, pinned })
        setIsSubmitting(false)
        if (saved && initialValues == null) {
            setDraft("")
            setPinned(false)
        }
    }, [draft, initialValues, isSubmitting, isValid, onSubmit, pinned])

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
            <RichTextEditor
                value={draft}
                onChange={setDraft}
                toolbar="full"
                placeholder={t("announcements.contentField")}
                ariaLabel={t("announcements.contentField")}
                minHeight={96}
            />
            <Checkbox
                id={pinnedId}
                variant="secondary"
                isSelected={pinned}
                onChange={() => setPinned((previous) => !previous)}
            >
                <Checkbox.Control>
                    <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Content>
                    <Label htmlFor={pinnedId}>{t("announcements.pinned")}</Label>
                </Checkbox.Content>
            </Checkbox>
            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={!isValid}
                    isPending={isSubmitting}
                    onPress={() => void submit()}
                >
                    {submitLabel}
                </Button>
                <Button size="sm" variant="ghost" isDisabled={isSubmitting} onPress={onCancel}>
                    {t("announcements.cancel")}
                </Button>
            </div>
        </div>
    )
}
