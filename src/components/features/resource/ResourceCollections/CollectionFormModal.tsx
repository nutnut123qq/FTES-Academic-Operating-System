"use client"

import React, { useEffect, useState } from "react"
import { Button, Input, Label, Modal, TextField, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { resolveResourceErrorKey } from "../hooks/useQueryCollectionsSwr"

/** Props for {@link CollectionFormModal}. */
export interface CollectionFormModalProps {
    /** Whether the modal is open. */
    isOpen: boolean
    /** `create` → `POST /collections`; `edit` → `PATCH /collections/{id}`. */
    mode: "create" | "edit"
    /** Close handler (backdrop, cancel, or after a successful submit). */
    onClose: () => void
    /**
     * Persists the draft. Rejects on failure so the modal can keep what was typed
     * and show the mapped error message.
     */
    onSubmit: (input: { title: string; description?: string }) => Promise<unknown>
    /** Current title, prefilled in `edit` mode. */
    initialTitle?: string
    /** Current description, prefilled in `edit` mode. */
    initialDescription?: string
}

/**
 * The collection name/description form (§5), shared by BOTH writes so the two
 * flows read identically: "Tạo bộ sưu tập" (`POST /api/v1/resources/collections`)
 * and "Sửa bộ sưu tập" (`PATCH /api/v1/resources/collections/{id}`). The caller
 * owns the optimistic list update; this modal only owns the draft, the pending
 * state and the mapped error line (403/404/429/401 → their own copy).
 *
 * In `edit` mode the fields are re-seeded from `initialTitle`/`initialDescription`
 * every time the modal opens, so re-opening on another row never shows the previous
 * row's draft.
 */
export const CollectionFormModal = ({
    isOpen,
    mode,
    onClose,
    onSubmit,
    initialTitle = "",
    initialDescription = "",
}: CollectionFormModalProps) => {
    const t = useTranslations("resourceHub")
    const [title, setTitle] = useState(initialTitle)
    const [description, setDescription] = useState(initialDescription)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorKey, setErrorKey] = useState<string | null>(null)

    // fresh draft every time the modal opens: `create` starts blank, `edit` starts
    // from the row being edited (a kept draft would look like the write failed)
    useEffect(() => {
        if (isOpen) {
            setErrorKey(null)
            setTitle(initialTitle)
            setDescription(initialDescription)
        }
    }, [initialDescription, initialTitle, isOpen])

    const canSubmit = title.trim() !== "" && !isSubmitting

    const onSubmitPress = async () => {
        if (!canSubmit) {
            return
        }
        setIsSubmitting(true)
        setErrorKey(null)
        try {
            await onSubmit({ title, description })
            if (mode === "create") {
                setTitle("")
                setDescription("")
            }
            onClose()
        } catch (error) {
            setErrorKey(resolveResourceErrorKey(error))
        } finally {
            setIsSubmitting(false)
        }
    }

    const isCreate = mode === "create"
    const pendingLabel = isCreate ? t("collections.creating") : t("collections.saving")
    const submitLabel = isCreate ? t("collections.submitCreate") : t("collections.submitSave")

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open && !isSubmitting) {
                    onClose()
                }
            }}
        >
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className="w-full max-w-md">
                        <Modal.Header>
                            <Typography type="body" weight="bold">
                                {isCreate ? t("collections.createTitle") : t("collections.editTitle")}
                            </Typography>
                        </Modal.Header>
                        <Modal.Body className="flex flex-col gap-4">
                            <TextField
                                variant="primary"
                                className="w-full"
                                isDisabled={isSubmitting}
                            >
                                <Label htmlFor="collection-title" className="text-sm">
                                    {t("collections.nameLabel")}
                                </Label>
                                <Input
                                    id="collection-title"
                                    variant="primary"
                                    placeholder={t("collections.namePlaceholder")}
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                />
                            </TextField>
                            <TextField
                                variant="primary"
                                className="w-full"
                                isDisabled={isSubmitting}
                            >
                                <Label htmlFor="collection-description" className="text-sm">
                                    {t("collections.descriptionLabel")}
                                </Label>
                                <Input
                                    id="collection-description"
                                    variant="primary"
                                    placeholder={t("collections.descriptionPlaceholder")}
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                />
                            </TextField>
                            {errorKey ? (
                                <div role="alert" className="text-xs text-danger">
                                    {t(`apiErrors.${errorKey}`)}
                                </div>
                            ) : null}
                        </Modal.Body>
                        <Modal.Footer className="justify-end gap-2">
                            <Button variant="ghost" isDisabled={isSubmitting} onPress={onClose}>
                                {t("collections.cancel")}
                            </Button>
                            <Button
                                variant="primary"
                                isDisabled={!canSubmit}
                                onPress={() => void onSubmitPress()}
                            >
                                {isSubmitting ? pendingLabel : submitLabel}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
