"use client"

import React, { useCallback, useState } from "react"
import { Button, Checkbox, Label } from "@heroui/react"
import { useTranslations } from "next-intl"
import { RichTextEditor } from "@/components/reuseable/RichTextEditor"

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

/** Shared field styling — mirrors the hand-rolled inputs in the Discussion composer. */
const FIELD_CLASS =
    "w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"

/**
 * Announcement composer/editor — title + content + "pin to top". Used both for the
 * owner's new-announcement composer and for the inline edit of an existing card, so
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
    const [title, setTitle] = useState(initialValues?.title ?? "")
    const [content, setContent] = useState(initialValues?.content ?? "")
    const [pinned, setPinned] = useState(initialValues?.pinned ?? false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const isValid = title.trim() !== "" && content.trim() !== ""
    const pinnedId = `announcement-pinned-${formId}`

    const submit = useCallback(async () => {
        if (!isValid || isSubmitting) {
            return
        }
        setIsSubmitting(true)
        const saved = await onSubmit({
            title: title.trim(),
            content: content.trim(),
            pinned,
        })
        setIsSubmitting(false)
        if (saved && initialValues == null) {
            setTitle("")
            setContent("")
            setPinned(false)
        }
    }, [content, initialValues, isSubmitting, isValid, onSubmit, pinned, title])

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
            <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("announcements.titleField")}
                aria-label={t("announcements.titleField")}
                className={FIELD_CLASS}
            />
            <RichTextEditor
                value={content}
                onChange={setContent}
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
