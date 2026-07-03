"use client"

import React, { useEffect, useState } from "react"
import { Button, Spinner, Typography, toast } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CheckCircleIcon, CopyIcon, QrCodeIcon } from "@phosphor-icons/react"
import { use2fa, type TwoFactorEnrolment } from "@/hooks/auth"

const CODE_LENGTH = 6

/** House text-input class — plain `<input>`, tokens only (see canon). */
const INPUT_CLASS =
    "w-full rounded-large border border-separator bg-transparent px-4 py-2 text-center text-lg tracking-[0.4em] text-foreground outline-none focus:border-accent"

/**
 * TwoFactorSetup (§1 Identity, spec `auth-two-factor`). Centered auth card:
 * a mock enrolment secret (manual entry + copy) with a placeholder QR frame,
 * and a 6-digit confirm input verified through {@link use2fa} — success flips
 * the persisted enabled flag so the sign-in flow challenges for TOTP.
 * ponytail: secret is client-generated (demo only) and no QR is rendered
 * (no QR lib in deps) — the manual-entry secret is the enrolment path; real
 * secret/QR come from the BE `setupTwoFactor` contract later.
 */
export const TwoFactorSetup = () => {
    const t = useTranslations("authFlows")
    const { enrol, verifyEnrolment, isVerifying } = use2fa()
    const [enrolment, setEnrolment] = useState<TwoFactorEnrolment | null>(null)
    const [code, setCode] = useState("")
    const [done, setDone] = useState(false)

    // generate the mock secret on the client only (avoids SSR/hydration mismatch)
    useEffect(() => {
        setEnrolment(enrol())
    }, [enrol])

    const filled = code.length === CODE_LENGTH

    const onCopySecret = async () => {
        if (!enrolment) {
            return
        }
        await navigator.clipboard.writeText(enrolment.secret)
        toast.success(t("twoFactor.copied"))
    }

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!filled) {
            return
        }
        const ok = await verifyEnrolment(code)
        if (ok) {
            setDone(true)
        }
    }

    return (
        <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border border-separator p-6">
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
                <form className="flex flex-col gap-4" onSubmit={(event) => void onSubmit(event)} noValidate>
                    {/* Placeholder QR frame — the manual-entry secret below is the mock enrolment path. */}
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

                    <div className="flex flex-col gap-2">
                        <Typography type="body-xs" color="muted" className="text-center">
                            {t("twoFactor.secretLabel")}
                        </Typography>
                        <div className="flex items-center justify-center gap-2">
                            <code className="rounded-large border border-separator px-3 py-1 font-mono text-sm tracking-widest text-foreground">
                                {enrolment?.secret ?? "…"}
                            </code>
                            <Button
                                variant="tertiary"
                                isIconOnly
                                size="sm"
                                aria-label={t("twoFactor.copySecret")}
                                isDisabled={!enrolment}
                                onPress={() => void onCopySecret()}
                            >
                                <CopyIcon className="size-4" aria-hidden focusable="false" />
                            </Button>
                        </div>
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
                                {t("twoFactor.enable")}
                            </>
                        )}
                    </Button>
                </form>
            )}
        </div>
    )
}
