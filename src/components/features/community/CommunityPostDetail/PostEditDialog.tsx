"use client"

import React, { useEffect, useState } from "react"
import {
    Button,
    Modal,
    Typography,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { RichTextEditor } from "@/components/reuseable/RichTextEditor"
import {
    joinTitleIntoMarkdown,
    splitTitleFromMarkdown,
} from "@/components/reuseable/RichTextEditor/title"

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
 * Minimal owner editor for a community post: a SINGLE markdown editor (no
 * separate title field). The stored `title` + `content` are re-joined into one
 * Markdown value on open (title as a leading H1 via {@link joinTitleIntoMarkdown})
 * so the author edits both together, then split back apart on save
 * ({@link splitTitleFromMarkdown} — the H1 stays out of the stored body). Prefilled
 * from the post's REST metadata; the composer itself is a much richer flow (media,
 * poll, audience) and reusing it for an edit would drag all of that in for what the
 * BE `PATCH` accepts (title + content).
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
    const [draft, setDraft] = useState(() => joinTitleIntoMarkdown(title, content))
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setDraft(joinTitleIntoMarkdown(title, content))
            setIsSaving(false)
        }
    }, [isOpen, title, content])

    const save = async () => {
        if (isSaving || draft.trim().length === 0) {
            return
        }
        setIsSaving(true)
        const { title: nextTitle, body: nextContent } = splitTitleFromMarkdown(draft)
        const ok = await onSave({ title: nextTitle, content: nextContent })
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
                                    {t("engagement.editContentLabel")}
                                </Typography>
                                <RichTextEditor
                                    value={draft}
                                    onChange={setDraft}
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
                                isDisabled={isSaving || draft.trim().length === 0}
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
