"use client"

import React, { useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CheckCircleIcon } from "@phosphor-icons/react"
import { Link } from "@/i18n/navigation"

/** House text-input class — plain `<input>`, tokens only (see canon). */
const INPUT_CLASS =
    "w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"

/**
 * ResetPasswordForm (§1 Identity) — FE MOCK. Centered auth card: new password +
 * confirm. Client validation (match); submit is a no-op that flips to a local
 * success state. No real auth / Keycloak / fetch. ponytail: local state.
 */
export const ResetPasswordForm = () => {
    const t = useTranslations("authFlows")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [done, setDone] = useState(false)

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        if (password !== confirmPassword) {
            setError(t("reset.passwordMismatch"))
            return
        }
        // MOCK: no password update — show success.
        setError(null)
        setDone(true)
    }

    return (
        <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-large border border-separator p-6">
            <div className="flex flex-col gap-1">
                <Typography type="h4" weight="bold">
                    {t("reset.title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("reset.subtitle")}
                </Typography>
            </div>

            {done ? (
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
            ) : (
                <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
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

                    <Button type="submit" variant="primary" className="w-full">
                        {t("reset.submit")}
                    </Button>
                </form>
            )}
        </div>
    )
}
