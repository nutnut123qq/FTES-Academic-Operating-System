"use client"

import React, { useState } from "react"
import { Button, Modal, Spinner, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ShieldCheckIcon } from "@phosphor-icons/react"
import { useRouter } from "@/i18n/navigation"
import { useRestWithToast } from "@/modules/toast/hooks"
import { usePostSetPasswordSwr } from "@/hooks/swr/api/rest/mutations/usePostSetPasswordSwr"
import { useForcedSetPasswordOverlayState } from "@/hooks/zustand/overlay/hooks"

/**
 * House text-input class — plain `<input>`, tokens only. Copied verbatim from
 * `ResetPasswordForm` so the forced set-password fields look and validate identically.
 */
const INPUT_CLASS =
    "w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"

/** Minimum password length (mirrors the sign-up rule + `ResetPasswordForm`). */
const PASSWORD_MIN_LENGTH = 8

/**
 * ForcedSetPasswordModal — the REQUIRED "create a password" step shown right after a
 * Google/GitHub login for an account that has none (`hasPassword === false`).
 *
 * Non-dismissable on purpose (owner: "bắt tạo mật khẩu"): there is no close button, no
 * skip, and both backdrop-click (`isDismissable={false}`) and Esc (the controlled
 * `onOpenChange` ignores every close request) are inert — the only way out is a
 * successful `POST /identity/password/set`. Mounted globally in `ModalContainer`, so the
 * SAME modal serves both the Google in-modal flow and the full-page GitHub callback; the
 * overlay context carries `redirectTo` for the callback so the user lands home only after
 * completing the step.
 */
export const ForcedSetPasswordModal = () => {
    const t = useTranslations()
    const router = useRouter()
    const runRest = useRestWithToast()
    const { isOpen, close, context } = useForcedSetPasswordOverlayState()
    const { trigger, isMutating } = usePostSetPasswordSwr()

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState<string | null>(null)

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (isMutating) {
            return
        }
        if (password.length < PASSWORD_MIN_LENGTH) {
            setError(t("auth.setPassword.passwordMinLength", { min: PASSWORD_MIN_LENGTH }))
            return
        }
        if (password !== confirmPassword) {
            setError(t("auth.setPassword.passwordMismatch"))
            return
        }
        setError(null)

        // `runRest` returns the payload on success, `null` on failure — the toast already
        // explains a failure (e.g. 409 credential-already-set), so branch on the sentinel.
        const result = await runRest(
            () => trigger({ newPassword: password }),
            { successMessage: t("auth.setPassword.success") },
        )
        if (result === null) {
            return
        }

        // Clear the secrets, drop the gate, then honour the deferred navigation (if any).
        setPassword("")
        setConfirmPassword("")
        const redirectTo = context?.redirectTo ?? null
        close()
        if (redirectTo) {
            router.replace(redirectTo)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            // Non-dismissable: swallow every close request so Esc / programmatic close can't skip it.
            onOpenChange={() => undefined}
        >
            <Modal.Backdrop isDismissable={false}>
                <Modal.Container>
                    <Modal.Dialog
                        aria-label={t("auth.setPassword.title")}
                        className="w-full max-w-md"
                    >
                        <Modal.Header>
                            <div className="flex items-center gap-2">
                                <ShieldCheckIcon
                                    className="size-6 text-accent"
                                    weight="fill"
                                    aria-hidden
                                    focusable="false"
                                />
                                <div className="flex flex-col gap-0.5">
                                    <Typography type="h6" weight="bold">
                                        {t("auth.setPassword.title")}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {t("auth.setPassword.body")}
                                    </Typography>
                                </div>
                            </div>
                        </Modal.Header>

                        <form
                            className="flex flex-col gap-4"
                            onSubmit={(event) => void onSubmit(event)}
                            noValidate
                        >
                            <Modal.Body className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="forced-set-password">
                                        <Typography type="body-sm" weight="medium">
                                            {t("auth.setPassword.password")}
                                        </Typography>
                                    </label>
                                    <input
                                        id="forced-set-password"
                                        type="password"
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        className={INPUT_CLASS}
                                        autoComplete="new-password"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="forced-set-password-confirm">
                                        <Typography type="body-sm" weight="medium">
                                            {t("auth.setPassword.confirmPassword")}
                                        </Typography>
                                    </label>
                                    <input
                                        id="forced-set-password-confirm"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(event) => setConfirmPassword(event.target.value)}
                                        className={INPUT_CLASS}
                                        autoComplete="new-password"
                                    />
                                </div>

                                {error ? (
                                    <Typography type="body-xs" className="text-danger" role="alert">
                                        {error}
                                    </Typography>
                                ) : null}
                            </Modal.Body>

                            <Modal.Footer className="justify-end">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    fullWidth
                                    isPending={isMutating}
                                    isDisabled={isMutating}
                                >
                                    {({ isPending }) => (
                                        <>
                                            {isPending ? <Spinner color="current" size="sm" /> : null}
                                            {t("auth.setPassword.submit")}
                                        </>
                                    )}
                                </Button>
                            </Modal.Footer>
                        </form>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
