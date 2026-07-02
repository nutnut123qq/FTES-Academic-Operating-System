"use client"

import React, { useRef, useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CheckCircleIcon } from "@phosphor-icons/react"

const OTP_LENGTH = 6

/** Single OTP box — plain `<input>`, tokens only, centered digit. */
const BOX_CLASS =
    "size-12 rounded-large border border-separator bg-transparent text-center text-lg text-foreground outline-none focus:border-accent"

/**
 * OtpVerifyForm (§1 Identity) — FE MOCK. Centered auth card: 6 single-char OTP
 * boxes (auto-advance + backspace), Verify enabled only when all 6 filled, and a
 * mock "resend code" link. Submit is a no-op that flips to a local success state.
 * No real auth / Keycloak / fetch. ponytail: local state + refs.
 */
export const OtpVerifyForm = () => {
    const t = useTranslations("authFlows")
    const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(""))
    const [done, setDone] = useState(false)
    const inputsRef = useRef<Array<HTMLInputElement | null>>([])

    const filled = digits.every((digit) => digit !== "")

    const onChange = (index: number, value: string) => {
        const char = value.replace(/\D/g, "").slice(-1)
        setDigits((prev) => {
            const next = [...prev]
            next[index] = char
            return next
        })
        if (char && index < OTP_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus()
        }
    }

    const onKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Backspace" && digits[index] === "" && index > 0) {
            inputsRef.current[index - 1]?.focus()
        }
    }

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        if (!filled) {
            return
        }
        // MOCK: no verification — show success.
        setDone(true)
    }

    return (
        <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-large border border-separator p-6">
            <div className="flex flex-col gap-1">
                <Typography type="h4" weight="bold">
                    {t("otp.title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("otp.subtitle")}
                </Typography>
            </div>

            {done ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center" role="status">
                    <CheckCircleIcon className="size-10 text-accent" weight="fill" aria-hidden />
                    <Typography type="body-sm" weight="medium">
                        {t("otp.success")}
                    </Typography>
                </div>
            ) : (
                <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
                    <div className="flex justify-between gap-2" role="group" aria-label={t("otp.title")}>
                        {digits.map((digit, index) => (
                            <input
                                key={index}
                                ref={(node) => {
                                    inputsRef.current[index] = node
                                }}
                                value={digit}
                                onChange={(event) => onChange(index, event.target.value)}
                                onKeyDown={(event) => onKeyDown(index, event)}
                                className={BOX_CLASS}
                                inputMode="numeric"
                                maxLength={1}
                                aria-label={t("otp.digitLabel", { index: index + 1 })}
                                autoComplete="one-time-code"
                            />
                        ))}
                    </div>

                    <Button type="submit" variant="primary" className="w-full" isDisabled={!filled}>
                        {t("otp.verify")}
                    </Button>

                    <button
                        type="button"
                        onClick={() => {
                            // MOCK: no code dispatched.
                        }}
                        className="text-center text-accent hover:underline"
                    >
                        <Typography type="body-sm" className="text-accent">
                            {t("otp.resend")}
                        </Typography>
                    </button>
                </form>
            )}
        </div>
    )
}
