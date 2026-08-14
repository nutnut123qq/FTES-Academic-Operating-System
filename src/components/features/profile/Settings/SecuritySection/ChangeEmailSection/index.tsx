"use client"

import React, { useState } from "react"
import {
    Button,
    Input,
    Label,
    Modal,
    Spinner,
    TextField,
    Typography,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { EnvelopeSimpleIcon } from "@phosphor-icons/react"
import useSWR, { useSWRConfig } from "swr"
import { SectionCard } from "@/components/reuseable/SectionCard"
import { StatusChip } from "@/components/blocks/chips/StatusChip"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setUser } from "@/redux/slices/user"
import { getSelfProfile, updateSelfProfile } from "@/modules/api/rest/profile"
import { useGetMyVerificationStatusSwr } from "@/hooks/swr/api/rest/queries/useGetMyVerificationStatusSwr"
import { useRestWithToast } from "@/modules/toast/hooks"

const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

/**
 * ChangeEmailSection — email address management in the Security tab.
 * Displays current contact email address, verification status, and an action
 * button to open a modal dialog to update the email address.
 */
export const ChangeEmailSection = () => {
    const t = useTranslations()
    const dispatch = useAppDispatch()
    const { mutate } = useSWRConfig()
    const runRest = useRestWithToast()

    const currentUser = useAppSelector((state) => state.user.user)
    const { data: profile } = useSWR("GET_SELF_PROFILE_SWR", () => getSelfProfile(), {
        revalidateOnFocus: false,
    })
    const { data: verificationStatus } = useGetMyVerificationStatusSwr()

    const currentEmail = profile?.contactEmail || currentUser?.email || ""
    const isVerified = verificationStatus?.emailVerified ?? true

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newEmail, setNewEmail] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleClose = () => {
        if (isSubmitting) return
        setIsModalOpen(false)
        setNewEmail("")
        setError(null)
    }

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        const trimmed = newEmail.trim()
        if (!isValidEmail(trimmed)) {
            setError(t("security.email.invalid"))
            return
        }
        if (currentEmail && trimmed.toLowerCase() === currentEmail.toLowerCase()) {
            setError(t("security.email.sameEmail"))
            return
        }

        setError(null)
        setIsSubmitting(true)
        try {
            const updatedProfile = await runRest(
                () => updateSelfProfile({ contactEmail: trimmed }),
                { successMessage: t("security.email.success") },
            )
            if (updatedProfile) {
                if (currentUser) {
                    dispatch(
                        setUser({
                            ...currentUser,
                            email: trimmed,
                        }),
                    )
                }
                await mutate("GET_SELF_PROFILE_SWR", updatedProfile, { revalidate: false })
                await mutate("GET_MY_VERIFICATION_STATUS_SWR")
                handleClose()
            }
        } catch {
            setError(t("security.email.failed"))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <SectionCard
                title={t("security.email.title")}
                icon={<EnvelopeSimpleIcon className="size-5 text-muted" aria-hidden focusable="false" />}
                action={
                    <Button
                        size="sm"
                        variant="secondary"
                        onPress={() => {
                            setNewEmail("")
                            setError(null)
                            setIsModalOpen(true)
                        }}
                    >
                        {t("security.email.changeEmail")}
                    </Button>
                }
            >
                <div className="flex flex-col gap-2">
                    <Typography type="body-sm" color="muted">
                        {t("security.email.subtitle")}
                    </Typography>
                    <div className="flex items-center gap-3 pt-1">
                        <Typography type="body" className="font-mono text-foreground">
                            {currentEmail || "—"}
                        </Typography>
                        {isVerified ? (
                            <StatusChip tone="success">
                                {t("security.email.verified")}
                            </StatusChip>
                        ) : (
                            <StatusChip tone="warning">
                                {t("security.email.unverified")}
                            </StatusChip>
                        )}
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
                                        {t("security.email.modalTitle")}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {t("security.email.modalSubtitle")}
                                    </Typography>
                                </div>
                            </Modal.Header>

                            <form onSubmit={(event) => void onSubmit(event)} noValidate>
                                <Modal.Body className="flex flex-col gap-4">
                                    {currentEmail ? (
                                        <div className="flex flex-col gap-1.5">
                                            <Typography type="body-xs" color="muted">
                                                {t("security.email.currentEmail")}
                                            </Typography>
                                            <div className="rounded-large border border-separator bg-default/40 px-4 py-2 text-sm text-muted">
                                                {currentEmail}
                                            </div>
                                        </div>
                                    ) : null}

                                    <TextField
                                        variant="secondary"
                                        isInvalid={Boolean(error)}
                                    >
                                        <Label htmlFor="modal-change-email-input">
                                            {t("security.email.newEmail")}
                                        </Label>
                                        <Input
                                            id="modal-change-email-input"
                                            type="email"
                                            value={newEmail}
                                            placeholder={t("security.email.placeholder")}
                                            onChange={(event) => setNewEmail(event.target.value)}
                                            autoComplete="email"
                                            autoFocus
                                        />
                                    </TextField>

                                    <Typography type="body-xs" color="muted">
                                        {t("security.email.hint")}
                                    </Typography>

                                    {error ? (
                                        <Typography type="body-xs" className="text-danger" role="alert">
                                            {error}
                                        </Typography>
                                    ) : null}
                                </Modal.Body>

                                <Modal.Footer className="justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        isDisabled={isSubmitting}
                                        onPress={handleClose}
                                    >
                                        {t("security.email.cancel")}
                                    </Button>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="sm"
                                        isDisabled={!newEmail.trim() || isSubmitting}
                                        isPending={isSubmitting}
                                    >
                                        {({ isPending }) => (
                                            <>
                                                {isPending ? (
                                                    <Spinner color="current" size="sm" />
                                                ) : null}
                                                {t("security.email.save")}
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
