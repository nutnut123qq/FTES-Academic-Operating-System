"use client"

import React, { useState } from "react"
import { Button, Spinner, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react"
import { Link } from "@/i18n/navigation"
import { usePasswordRecovery } from "@/hooks/auth"

/** House text-input class — plain `<input>`, tokens only (see canon). */
const INPUT_CLASS =
    "w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"

/** Minimum password length (mirrors the sign-up rule). */
const PASSWORD_MIN_LENGTH = 8

/**
 * ResetPasswordForm (§1 Identity, spec `auth-password-recovery`). Centered auth
 * card: new password + confirm, completed against the `?token=` from the reset
 * email. Without a token the card shows an invalid-link notice instead of the
 * form. ponytail: mock BE via usePasswordRecovery (any present token is valid).
 */
export const ResetPasswordForm = () => {
    const t = useTranslations("authFlows")
    const searchParams = useSearchParams()
    const token = searchParams.get("token") ?? ""
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [done, setDone] = useState(false)
    const { resetPassword, isResetting } = usePasswordRecovery()

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (password.length < PASSWORD_MIN_LENGTH) {
            setError(t("reset.passwordMinLength"))
            return
        }
        if (password !== confirmPassword) {
            setError(t("reset.passwordMismatch"))
            return
        }
        setError(null)
        const ok = await resetPassword(token, password)
        if (!ok) {
            setError(t("reset.missingToken"))
            return
        }
        setDone(true)
    }

    const renderContent = () => {
        if (done) {
            return (
                <div className="flex flex-col items-center gap-2 py-6 text-center" role="status">
                    <CheckCircleIcon className="size-10 text-accent" weight="fill" aria-hidden />
                    <Typography type="body-sm" weight="medium">
                        {t("reset.success")}
                    </Typography>
                    <Link
                        href="/"
                        className="text-accent no-underline hover:underline"
                    >
                        <Typography type="body-sm" className="text-accent">
                            {t("reset.backToLogin")}
                        </Typography>
                    </Link>
                </div>
            )
        }
        if (!token) {
            return (
                <div className="flex flex-col items-center gap-2 py-6 text-center" role="alert">
                    <WarningCircleIcon className="size-10 text-danger" weight="fill" aria-hidden />
                    <Typography type="body-sm" weight="medium">
                        {t("reset.missingToken")}
                    </Typography>
                    <Link
                        href="/authentication/forgot-password"
                        className="text-accent no-underline hover:underline"
                    >
                        <Typography type="body-sm" className="text-accent">
                            {t("reset.requestNewLink")}
                        </Typography>
                    </Link>
                </div>
            )
        }
        return (
            <form className="flex flex-col gap-4" onSubmit={(event) => void onSubmit(event)} noValidate>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="reset-password">
                        <Typography type="body-sm" weight="medium">
                            {t("reset.password")}
                        </Typography>
                    </label>
                    <input
                        id="reset-password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className={INPUT_CLASS}
                        autoComplete="new-password"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="reset-confirm">
                        <Typography type="body-sm" weight="medium">
                            {t("reset.confirmPassword")}
                        </Typography>
                    </label>
                    <input
                        id="reset-confirm"
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

                <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    isDisabled={isResetting}
                    isPending={isResetting}
                >
                    {({ isPending }) => (
                        <>
                            {isPending ? <Spinner color="current" size="sm" /> : null}
                            {t("reset.submit")}
                        </>
                    )}
                </Button>
            </form>
        )
    }

    return (
        <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border border-separator p-6">
            <div className="flex flex-col gap-1">
                <Typography type="h4" weight="bold">
                    {t("reset.title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("reset.subtitle")}
                </Typography>
            </div>
            {renderContent()}
        </div>
    )
}
