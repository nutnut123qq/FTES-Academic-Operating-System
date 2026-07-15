"use client"

import React, { useEffect, useRef, useState } from "react"
import { Button, Spinner, Typography, toast } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CheckCircleIcon, CopyIcon, QrCodeIcon, ShieldCheckIcon } from "@phosphor-icons/react"
import { use2fa, type TwoFactorEnrolment } from "@/hooks/auth"

const CODE_LENGTH = 6

/** House text-input class — plain `<input>`, tokens only (see canon). */
const INPUT_CLASS =
    "w-full rounded-large border border-separator bg-transparent px-4 py-2 text-center text-lg tracking-[0.4em] text-foreground outline-none focus:border-accent"

/**
 * TwoFactorSetup (§1 Identity, spec `auth-two-factor`). Centered auth card
 * backed by the real MFA endpoints (`/api/v1/identity/mfa/**`, access token
 * required): enrolment fetches a server-generated secret
 * (`POST .../totp/enroll`), the 6-digit confirm activates it
 * (`POST .../totp/activate`) and shows the single-use recovery codes; when 2FA
 * is already enabled the card offers disable-with-code (`DELETE .../totp`).
 * No QR is rendered (no QR lib in deps) — the manual-entry secret is the
 * enrolment path; the `otpauth://` URI is available on the enrolment payload.
 */
export const TwoFactorSetup = () => {
    const t = useTranslations("authFlows")
    const {
        isEnabled,
        isStatusLoading,
        enrol,
        verifyEnrolment,
        disable,
        isVerifying,
        isDisabling,
    } = use2fa()
    const [enrolment, setEnrolment] = useState<TwoFactorEnrolment | null>(null)
    const [enrolFailed, setEnrolFailed] = useState(false)
    const [code, setCode] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [recoveryCodes, setRecoveryCodes] = useState<Array<string> | null>(null)
    // guards the enrol effect against StrictMode double-invoke / status revalidation re-runs
    const enrolStartedRef = useRef(false)

    // fetch the server-generated secret once we know 2FA is not enabled yet
    useEffect(() => {
        if (isStatusLoading || isEnabled || enrolStartedRef.current) {
            return
        }
        enrolStartedRef.current = true
        void (async () => {
            const result = await enrol()
            if (result) {
                setEnrolment(result)
            } else {
                setEnrolFailed(true)
            }
        })()
    }, [isStatusLoading, isEnabled, enrol])

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
        setError(null)
        const codes = await verifyEnrolment(code)
        if (!codes) {
            setError(t("twoFactor.invalidCode"))
            return
        }
        setRecoveryCodes(codes)
    }

    const onDisable = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!filled) {
            return
        }
        setError(null)
        const ok = await disable(code)
        if (!ok) {
            setError(t("twoFactor.invalidCode"))
            return
        }
        // status refetch flips isEnabled → the effect above re-fires (isEnabled is a dep and the
        // enrol guard was never taken while 2FA was on) and fetches a fresh secret for re-enrolment
        setCode("")
        toast.success(t("twoFactor.disabledSuccess"))
    }

    const renderBody = () => {
        // activation success — show the single-use recovery codes (they are never shown again)
        if (recoveryCodes) {
            return (
                <div className="flex flex-col items-center gap-4 py-4 text-center" role="status">
                    <CheckCircleIcon className="size-10 text-accent" weight="fill" aria-hidden />
                    <Typography type="body-sm" weight="medium">
                        {t("twoFactor.success")}
                    </Typography>
                    <div className="flex w-full flex-col gap-2">
                        <Typography type="body-xs" color="muted">
                            {t("twoFactor.recoveryCodesHint")}
                        </Typography>
                        <div className="grid grid-cols-2 gap-2">
                            {recoveryCodes.map((recoveryCode) => (
                                <code
                                    key={recoveryCode}
                                    className="rounded-large border border-separator px-2 py-1 font-mono text-sm text-foreground"
                                >
                                    {recoveryCode}
                                </code>
                            ))}
                        </div>
                    </div>
                </div>
            )
        }

        if (isStatusLoading) {
            return (
                <div className="flex justify-center py-10">
                    <Spinner size="sm" />
                </div>
            )
        }

        // already enabled — offer disable-with-code
        if (isEnabled) {
            return (
                <form className="flex flex-col gap-4" onSubmit={(event) => void onDisable(event)} noValidate>
                    <div className="flex flex-col items-center gap-2 text-center">
                        <ShieldCheckIcon className="size-10 text-accent" weight="fill" aria-hidden />
                        <Typography type="body-sm" weight="medium">
                            {t("twoFactor.alreadyEnabled")}
                        </Typography>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="two-factor-disable-code">
                            <Typography type="body-sm" weight="medium">
                                {t("twoFactor.confirmCode")}
                            </Typography>
                        </label>
                        <input
                            id="two-factor-disable-code"
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

                    {error ? (
                        <Typography type="body-xs" className="text-danger" role="alert">
                            {error}
                        </Typography>
                    ) : null}

                    <Button
                        type="submit"
                        variant="danger"
                        className="w-full"
                        isDisabled={!filled || isDisabling}
                        isPending={isDisabling}
                    >
                        {({ isPending }) => (
                            <>
                                {isPending ? <Spinner color="current" size="sm" /> : null}
                                {t("twoFactor.disable")}
                            </>
                        )}
                    </Button>
                </form>
            )
        }

        if (enrolFailed) {
            return (
                <div className="flex flex-col items-center gap-2 py-6 text-center" role="alert">
                    <Typography type="body-sm" className="text-danger">
                        {t("twoFactor.enrolFailed")}
                    </Typography>
                </div>
            )
        }

        return (
            <form className="flex flex-col gap-4" onSubmit={(event) => void onSubmit(event)} noValidate>
                {/* Placeholder QR frame — the manual-entry secret below is the enrolment path. */}
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

                {error ? (
                    <Typography type="body-xs" className="text-danger" role="alert">
                        {error}
                    </Typography>
                ) : null}

                <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    isDisabled={!filled || !enrolment || isVerifying}
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
        )
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

            {renderBody()}
        </div>
    )
}
