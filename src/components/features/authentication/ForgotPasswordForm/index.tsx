"use client"

import React, { useState } from "react"
import { Button, Spinner, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { EnvelopeSimpleIcon } from "@phosphor-icons/react"
import { Link } from "@/i18n/navigation"
import { usePasswordRecovery } from "@/hooks/auth"
import { Turnstile } from "@/components/reuseable/Turnstile"
import { publicEnv } from "@/resources/env/public"

/** House text-input class — plain `<input>`, tokens only (see canon). */
const INPUT_CLASS =
    "w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"

/** Minimal client-side email shape check (mock validation only). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * ForgotPasswordForm (§1 Identity, spec `auth-password-recovery`). Centered auth
 * card: email + captcha gate + "send reset link". On valid submit the mock
 * recovery service runs and the card swaps to a neutral "check your email"
 * confirmation (no account enumeration). ponytail: mock BE via usePasswordRecovery.
 */
export const ForgotPasswordForm = () => {
    const t = useTranslations("authFlows")
    const [email, setEmail] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [sent, setSent] = useState(false)
    const [captchaToken, setCaptchaToken] = useState<string | undefined>(undefined)
    const { requestReset, isRequesting } = usePasswordRecovery()

    const isSubmitDisabled = (publicEnv().captcha.enabled && !captchaToken) || isRequesting

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!EMAIL_RE.test(email)) {
            setError(t("forgot.invalidEmail"))
            return
        }
        setError(null)
        await requestReset(email)
        // neutral confirmation regardless of whether the account exists
        setSent(true)
    }

    return (
        <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-3xl border border-separator p-6">
            <div className="flex flex-col gap-1">
                <Typography type="h4" weight="bold">
                    {t("forgot.title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("forgot.subtitle")}
                </Typography>
            </div>

            {sent ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center" role="status">
                    <EnvelopeSimpleIcon className="size-10 text-accent" weight="fill" aria-hidden />
                    <Typography type="body-sm" weight="medium">
                        {t("forgot.sent")}
                    </Typography>
                </div>
            ) : (
                <form className="flex flex-col gap-4" onSubmit={(event) => void onSubmit(event)} noValidate>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="forgot-email">
                            <Typography type="body-sm" weight="medium">
                                {t("forgot.email")}
                            </Typography>
                        </label>
                        <input
                            id="forgot-email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className={INPUT_CLASS}
                            autoComplete="email"
                        />
                    </div>

                    {error ? (
                        <Typography type="body-xs" className="text-danger" role="alert">
                            {error}
                        </Typography>
                    ) : null}

                    {publicEnv().captcha.enabled && (
                        <Turnstile
                            onVerify={(token) => setCaptchaToken(token)}
                            onExpire={() => setCaptchaToken(undefined)}
                            onError={() => setCaptchaToken(undefined)}
                        />
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        isDisabled={isSubmitDisabled}
                        isPending={isRequesting}
                    >
                        {({ isPending }) => (
                            <>
                                {isPending ? <Spinner color="current" size="sm" /> : null}
                                {t("forgot.submit")}
                            </>
                        )}
                    </Button>
                </form>
            )}

            <Typography type="body-sm" color="muted" className="text-center">
                <Link href="/" className="text-accent no-underline hover:underline">
                    {t("forgot.backToLogin")}
                </Link>
            </Typography>
        </div>
    )
}
