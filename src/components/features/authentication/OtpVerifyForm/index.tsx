"use client"

import React, { useEffect, useRef, useState } from "react"
import { Button, Spinner, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { CheckCircleIcon } from "@phosphor-icons/react"
import { useOtpVerify } from "@/hooks/auth"
import { useResendCooldown } from "@/hooks/reuseables/useResendCooldown"

const OTP_LENGTH = 6

/** Single OTP box — plain `<input>`, tokens only, centered digit. */
const BOX_CLASS =
    "size-12 rounded-large border border-separator bg-transparent text-center text-lg text-foreground outline-none focus:border-accent"

/**
 * OtpVerifyForm (§1 Identity, spec `auth-otp-verification`). Centered auth card:
 * 6 single-char OTP boxes (auto-advance + backspace), for the email OR phone
 * channel (`?channel=phone`), with expiry messaging and resend-with-cooldown.
 * Verification runs through the mock {@link useOtpVerify} service.
 * ponytail: mock BE — any 6-digit code verifies.
 */
export const OtpVerifyForm = () => {
    const t = useTranslations("authFlows")
    const searchParams = useSearchParams()
    const isPhoneChannel = searchParams.get("channel") === "phone"
    const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(""))
    const [done, setDone] = useState(false)
    const inputsRef = useRef<Array<HTMLInputElement | null>>([])
    const { verify, resend, isVerifying, isResending } = useOtpVerify()
    const { remaining, isCoolingDown, start } = useResendCooldown()

    // a code was just dispatched when the user landed here — gate the first resend too
    useEffect(() => {
        start()
    }, [start])

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

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!filled) {
            return
        }
        const ok = await verify(digits.join(""))
        if (ok) {
            setDone(true)
        }
    }

    const onResend = async () => {
        if (isCoolingDown || isResending) {
            return
        }
        await resend()
        setDigits(Array(OTP_LENGTH).fill(""))
        start()
    }

    return (
        <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-large border border-separator p-6">
            <div className="flex flex-col gap-1">
                <Typography type="h4" weight="bold">
                    {isPhoneChannel ? t("otp.titlePhone") : t("otp.title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {isPhoneChannel ? t("otp.subtitlePhone") : t("otp.subtitle")}
                </Typography>
                <Typography type="body-xs" color="muted">
                    {t("otp.expiryHint")}
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
                <form className="flex flex-col gap-4" onSubmit={(event) => void onSubmit(event)} noValidate>
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

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        isDisabled={!filled || isVerifying}
                        isPending={isVerifying}
                    >
                        {({ isPending }) => (
                            <>
                                {isPending ? <Spinner color="current" size="sm" /> : null}
                                {t("otp.verify")}
                            </>
                        )}
                    </Button>

                    <button
                        type="button"
                        onClick={() => void onResend()}
                        disabled={isCoolingDown || isResending}
                        className="text-center text-accent enabled:hover:underline disabled:text-muted"
                    >
                        <Typography type="body-sm" className="text-inherit">
                            {isCoolingDown
                                ? t("otp.resendCooldown", { seconds: remaining })
                                : t("otp.resend")}
                        </Typography>
                    </button>
                </form>
            )}
        </div>
    )
}
