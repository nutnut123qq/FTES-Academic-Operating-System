"use client"

import React, { useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CheckCircleIcon, QrCodeIcon } from "@phosphor-icons/react"

const CODE_LENGTH = 6

/** House text-input class — plain `<input>`, tokens only (see canon). */
const INPUT_CLASS =
    "w-full rounded-large border border-separator bg-transparent px-4 py-2 text-center text-lg tracking-[0.4em] text-foreground outline-none focus:border-accent"

/**
 * TwoFactorSetup (§1 Identity) — FE MOCK. Centered auth card: a placeholder QR
 * box (bordered square + icon + scan hint) and a 6-digit confirm input. "Enable
 * 2FA" is a no-op that flips to a local success state. No real auth / TOTP /
 * fetch. ponytail: static placeholder QR + local state.
 */
export const TwoFactorSetup = () => {
    const t = useTranslations("authFlows")
    const [code, setCode] = useState("")
    const [done, setDone] = useState(false)

    const filled = code.length === CODE_LENGTH

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        if (!filled) {
            return
        }
        // MOCK: no TOTP enrolment — show success.
        setDone(true)
    }

    return (
        <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-large border border-separator p-6">
            <div className="flex flex-col gap-1">
                <Typography type="h4" weight="bold">
                    {t("twoFactor.title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("twoFactor.subtitle")}
                </Typography>
            </div>

            {done ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center" role="status">
                    <CheckCircleIcon className="size-10 text-accent" weight="fill" aria-hidden />
                    <Typography type="body-sm" weight="medium">
                        {t("twoFactor.success")}
                    </Typography>
                </div>
            ) : (
                <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
                    {/* Placeholder QR — bordered square + icon (mock, no real secret). */}
                    <div className="flex flex-col items-center gap-2">
                        <div
                            className="flex size-40 items-center justify-center rounded-large border border-separator bg-default/40"
                            role="img"
                            aria-label={t("twoFactor.scanHint")}
                        >
                            <QrCodeIcon className="size-20 text-muted" aria-hidden />
                        </div>
                        <Typography type="body-xs" color="muted" className="text-center">
                            {t("twoFactor.scanHint")}
                        </Typography>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="two-factor-code">
                            <Typography type="body-sm" weight="medium">
                                {t("twoFactor.confirmCode")}
                            </Typography>
                        </label>
                        <input
                            id="two-factor-code"
                            value={code}
                            onChange={(event) =>
                                setCode(event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))
                            }
                            className={INPUT_CLASS}
                            inputMode="numeric"
                            maxLength={CODE_LENGTH}
                            autoComplete="one-time-code"
                        />
                    </div>

                    <Button type="submit" variant="primary" className="w-full" isDisabled={!filled}>
                        {t("twoFactor.enable")}
                    </Button>
                </form>
            )}
        </div>
    )
}
