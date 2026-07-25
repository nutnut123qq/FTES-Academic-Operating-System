"use client"

import React, { useEffect, useState } from "react"
import { Button, Input, Label, Modal, TextField, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { resolveResourceErrorKey } from "../hooks/useQueryCollectionsSwr"

/** Props for {@link CreateCollectionModal}. */
export interface CreateCollectionModalProps {
    /** Whether the modal is open. */
    isOpen: boolean
    /** Close handler (backdrop, cancel, or after a successful create). */
    onClose: () => void
    /**
     * Persists the collection. Rejects on failure so the modal can keep the draft
     * and show the mapped error message.
     */
    onCreate: (input: { title: string; description?: string }) => Promise<unknown>
}

/**
 * "Tạo bộ sưu tập" form (§5) — name (required) + optional description. Submits to
 * the real `POST /api/v1/resources/collections` through the caller's optimistic
 * `create`; on failure the draft is kept and the API error is mapped to a friendly
 * line (403/404/429/401 → their own copy).
 */
export const CreateCollectionModal = ({ isOpen, onClose, onCreate }: CreateCollectionModalProps) => {
    const t = useTranslations("resourceHub")
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorKey, setErrorKey] = useState<string | null>(null)

    // fresh draft every time the modal opens (a kept draft after a *successful*
    // create would look like the create failed)
    useEffect(() => {
        if (isOpen) {
            setErrorKey(null)
        }
    }, [isOpen])

    const canSubmit = title.trim() !== "" && !isSubmitting

    const onSubmit = async () => {
        if (!canSubmit) {
            return
        }
        setIsSubmitting(true)
        setErrorKey(null)
        try {
            await onCreate({ title, description })
            setTitle("")
            setDescription("")
            onClose()
        } catch (error) {
            setErrorKey(resolveResourceErrorKey(error))
        } finally {
            setIsSubmitting(false)
        }
    }

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
                                {t("collections.createTitle")}
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
                                onPress={() => void onSubmit()}
                            >
                                {isSubmitting
                                    ? t("collections.creating")
                                    : t("collections.submitCreate")}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
