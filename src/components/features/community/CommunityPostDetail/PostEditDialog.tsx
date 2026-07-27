"use client"

import React, { useEffect, useState } from "react"
import {
    Button,
    Input,
    Modal,
    TextField,
    Typography,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { RichTextEditor } from "@/components/reuseable/RichTextEditor"

/** Props for {@link PostEditDialog}. */
export interface PostEditDialogProps {
    /** Whether the dialog is open. */
    isOpen: boolean
    /** Close without saving. */
    onClose: () => void
    /** Current title (prefill). */
    title: string
    /** Current markdown body (prefill). */
    content: string
    /**
     * Persist the edit. Resolves `true` on success (the dialog closes) and
     * `false` on failure (the draft is kept so the author can retry).
     */
    onSave: (input: { title: string; content: string }) => Promise<boolean>
}

/**
 * Minimal owner editor for a community post: title + markdown body, prefilled
 * from the post's REST metadata (the composer itself is a much richer flow —
 * media, poll, audience — and reusing it for an edit would drag all of that in
 * for two editable fields, which is exactly what the BE `PATCH` accepts).
 *
 * The draft resets every time the dialog opens, so a cancelled edit never leaks
 * into the next one.
 *
 * @param props - {@link PostEditDialogProps}
 */
export const PostEditDialog = ({
    isOpen,
    onClose,
    title,
    content,
    onSave,
}: PostEditDialogProps) => {
    const t = useTranslations("communityHub")
    const [draftTitle, setDraftTitle] = useState(title)
    const [draftContent, setDraftContent] = useState(content)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setDraftTitle(title)
            setDraftContent(content)
            setIsSaving(false)
        }
    }, [isOpen, title, content])

    const save = async () => {
        const nextContent = draftContent.trim()
        if (isSaving || nextContent.length === 0) {
            return
        }
        setIsSaving(true)
        const ok = await onSave({ title: draftTitle.trim(), content: nextContent })
        setIsSaving(false)
        if (ok) {
            onClose()
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    onClose()
                }
            }}
        >
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className="w-full max-w-xl">
                        <Modal.Header>
                            <Typography type="body" weight="bold">
                                {t("engagement.editPostTitle")}
                            </Typography>
                        </Modal.Header>
                        <Modal.Body className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Typography type="body-sm" weight="medium">
                                    {t("engagement.editTitleLabel")}
                                </Typography>
                                <TextField className="w-full" aria-label={t("engagement.editTitleLabel")}>
                                    <Input
                                        variant="secondary"
                                        value={draftTitle}
                                        onChange={(event) => setDraftTitle(event.target.value)}
                                        aria-label={t("engagement.editTitleLabel")}
                                        disabled={isSaving}
                                    />
                                </TextField>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Typography type="body-sm" weight="medium">
                                    {t("engagement.editContentLabel")}
                                </Typography>
                                <RichTextEditor
                                    value={draftContent}
                                    onChange={setDraftContent}
                                    toolbar="full"
                                    minHeight={200}
                                    ariaLabel={t("engagement.editContentLabel")}
                                    disabled={isSaving}
                                />
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="justify-end gap-2">
                            <Button size="sm" variant="ghost" onPress={onClose} isDisabled={isSaving}>
                                {t("engagement.cancel")}
                            </Button>
                            <Button
                                size="sm"
                                variant="primary"
                                onPress={() => void save()}
                                isPending={isSaving}
                                isDisabled={isSaving || draftContent.trim().length === 0}
                            >
                                {t("engagement.saveEdit")}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
