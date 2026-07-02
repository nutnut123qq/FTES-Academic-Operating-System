"use client"

import React, { useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CheckCircleIcon } from "@phosphor-icons/react"
import { Link } from "@/i18n/navigation"

/** House text-input class — plain `<input>`, tokens only (see canon). */
const INPUT_CLASS =
    "w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"

/** Minimal client-side email shape check (mock validation only). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * RegisterForm (§1 Identity) — FE MOCK. Centered auth card: name / email /
 * password / confirm. Client validation only (email format + password match);
 * submit is a no-op that flips to a local success state. No real auth / Keycloak
 * / fetch. ponytail: plain inputs + local state, mock success.
 */
export const RegisterForm = () => {
    const t = useTranslations("authFlows")
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [done, setDone] = useState(false)

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        if (!EMAIL_RE.test(email)) {
            setError(t("register.invalidEmail"))
            return
        }
        if (password !== confirmPassword) {
            setError(t("register.passwordMismatch"))
            return
        }
        // MOCK: no fetch / no real account creation — just show success.
        setError(null)
        setDone(true)
    }

    return (
        <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-large border border-separator p-6">
            <div className="flex flex-col gap-1">
                <Typography type="h4" weight="bold">
                    {t("register.title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("register.subtitle")}
                </Typography>
            </div>

            {done ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center" role="status">
                    <CheckCircleIcon className="size-10 text-accent" weight="fill" aria-hidden />
                    <Typography type="body-sm" weight="medium">
                        {t("register.success")}
                    </Typography>
                </div>
            ) : (
                <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="register-name">
                            <Typography type="body-sm" weight="medium">
                                {t("register.name")}
                            </Typography>
                        </label>
                        <input
                            id="register-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className={INPUT_CLASS}
                            autoComplete="name"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="register-email">
                            <Typography type="body-sm" weight="medium">
                                {t("register.email")}
                            </Typography>
                        </label>
                        <input
                            id="register-email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className={INPUT_CLASS}
                            autoComplete="email"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="register-password">
                            <Typography type="body-sm" weight="medium">
                                {t("register.password")}
                            </Typography>
                        </label>
                        <input
                            id="register-password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className={INPUT_CLASS}
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="register-confirm">
                            <Typography type="body-sm" weight="medium">
                                {t("register.confirmPassword")}
                            </Typography>
                        </label>
                        <input
                            id="register-confirm"
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
                        {t("register.submit")}
                    </Button>
                </form>
            )}

            <Typography type="body-sm" color="muted" className="text-center">
                {t("register.haveAccount")}{" "}
                <Link href="/" className="text-accent no-underline hover:underline">
                    {t("register.signIn")}
                </Link>
            </Typography>
        </div>
    )
}
