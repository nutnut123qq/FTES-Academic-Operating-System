"use client"

import React, { useState } from "react"
import { Controller } from "react-hook-form"
import {
    Button,
    FieldError,
    Input,
    Label,
    Modal,
    Spinner,
    TextField,
    Typography,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { KeyIcon } from "@phosphor-icons/react"
import { SectionCard } from "@/components/reuseable/SectionCard"
import { StatusChip } from "@/components/blocks/chips/StatusChip"
import { Callout } from "@/components/blocks/feedback/Callout"
import { useChangePasswordForm } from "@/hooks/rhf/useChangePasswordForm"

/** The three fields, in tab order, with the autocomplete token each one wants. */
const FIELDS = [
    { name: "currentPassword", autoComplete: "current-password" },
    { name: "newPassword", autoComplete: "new-password" },
    { name: "confirmPassword", autoComplete: "new-password" },
] as const

/**
 * ChangePasswordSection — discrete password management section.
 * Displays a clean summary card with password status and an action button
 * to open the Change Password {@link Modal} dialog.
 */
export const ChangePasswordSection = () => {
    const t = useTranslations()
    const [isModalOpen, setIsModalOpen] = useState(false)

    const { control, formState, reset, onSubmit } = useChangePasswordForm({
        onSuccess: () => {
            setIsModalOpen(false)
        },
    })

    const handleClose = () => {
        if (formState.isSubmitting) return
        setIsModalOpen(false)
        reset()
    }

    return (
        <>
            <SectionCard
                title={t("security.password.title")}
                icon={<KeyIcon className="size-5 text-muted" aria-hidden focusable="false" />}
                action={
                    <Button
                        size="sm"
                        variant="secondary"
                        onPress={() => setIsModalOpen(true)}
                    >
                        {t("security.password.changePassword")}
                    </Button>
                }
            >
                <div className="flex flex-col gap-2">
                    <Typography type="body-sm" color="muted">
                        {t("security.password.subtitle")}
                    </Typography>
                    <div className="flex items-center gap-3 pt-1">
                        <Typography type="body" className="font-mono tracking-widest text-foreground">
                            ••••••••••••
                        </Typography>
                        <StatusChip tone="success">
                            {t("security.password.statusSet")}
                        </StatusChip>
                    </div>
                </div>
            </SectionCard>

            <Modal
                isOpen={isModalOpen}
                onOpenChange={(open) => {
                    if (!open) handleClose()
                }}
            >
                <Modal.Backdrop>
                    <Modal.Container>
                        <Modal.Dialog className="w-full max-w-md">
                            <Modal.Header>
                                <div className="flex flex-col gap-0.5">
                                    <Typography type="h6" weight="bold">
                                        {t("security.password.modalTitle")}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {t("security.password.modalSubtitle")}
                                    </Typography>
                                </div>
                            </Modal.Header>

                            <form
                                className="flex flex-col gap-4"
                                onSubmit={(event) => {
                                    event.preventDefault()
                                    void onSubmit(event)
                                }}
                                noValidate
                            >
                                <Modal.Body className="flex flex-col gap-3">
                                    <Callout
                                        status="warning"
                                        title={t("security.password.signsOutOthers")}
                                    />

                                    {FIELDS.map((field) => (
                                        <Controller
                                            key={field.name}
                                            control={control}
                                            name={field.name}
                                            render={({ field: controlled, fieldState }) => (
                                                <TextField
                                                    variant="secondary"
                                                    isInvalid={fieldState.invalid && fieldState.isTouched}
                                                >
                                                    <Label htmlFor={`modal-change-password-${field.name}`}>
                                                        {t(`security.password.${field.name}`)}
                                                    </Label>
                                                    <Input
                                                        id={`modal-change-password-${field.name}`}
                                                        type="password"
                                                        autoComplete={field.autoComplete}
                                                        name={controlled.name}
                                                        ref={controlled.ref}
                                                        value={controlled.value}
                                                        onChange={(event) =>
                                                            controlled.onChange(event.target.value)
                                                        }
                                                        onBlur={controlled.onBlur}
                                                    />
                                                    <FieldError>{fieldState.error?.message}</FieldError>
                                                </TextField>
                                            )}
                                        />
                                    ))}
                                </Modal.Body>

                                <Modal.Footer className="justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        isDisabled={formState.isSubmitting}
                                        onPress={handleClose}
                                    >
                                        {t("security.password.cancel")}
                                    </Button>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="sm"
                                        isPending={formState.isSubmitting}
                                        isDisabled={formState.isSubmitting}
                                    >
                                        {({ isPending }) => (
                                            <>
                                                {isPending ? (
                                                    <Spinner color="current" size="sm" />
                                                ) : null}
                                                {t("security.password.submit")}
                                            </>
                                        )}
                                    </Button>
                                </Modal.Footer>
                            </form>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </>
    )
}
