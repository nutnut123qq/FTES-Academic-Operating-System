"use client"

import React, { useState } from "react"
import {
    Button,
    Input,
    Label,
    Spinner,
    TextField,
    Typography,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    DeviceMobileIcon,
    EnvelopeSimpleIcon,
    ShieldCheckIcon,
} from "@phosphor-icons/react"
import { SectionCard } from "@/components/reuseable/SectionCard"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { StatusChip } from "@/components/blocks/chips/StatusChip"
import { useGetMfaStatusSwr } from "@/hooks/swr/api/rest/queries/useGetMfaStatusSwr"
import { usePostEnableMfaEmailSwr } from "@/hooks/swr/api/rest/mutations/usePostEnableMfaEmailSwr"
import { useDeleteDisableMfaEmailSwr } from "@/hooks/swr/api/rest/mutations/useDeleteDisableMfaEmailSwr"
import { useRestWithToast } from "@/modules/toast/hooks"
import { use2fa } from "@/hooks/auth"
import { TwoFactorSectionSkeleton } from "./skeleton"

/** Number of digits in a TOTP code. */
const CODE_LENGTH = 6

/** Which control is currently expanded (inline disclosure, not an overlay). */
type ActivePanel = "none" | "totpEnrol" | "totpDisable" | "email"

/**
 * TwoFactorSection — turn each second factor on or off, from the true backend state.
 *
 * TOTP runs through the existing {@link use2fa} service (enrol → confirm with a code →
 * single-use recovery codes; disable takes a current code as proof). Email codes run
 * through `POST/DELETE /identity/mfa/email`, which require the CURRENT PASSWORD — a
 * bearer token alone must not be able to move a second factor.
 *
 * The email control renders ONLY when the backend actually reports `emailOtpEnabled`.
 * On a backend without the `identity-session-liveness-email-2fa` change the field is
 * absent, and the spec is explicit: a method whose state is unknown is NOT offered,
 * rather than shown in a made-up state whose toggle would 404.
 */
export const TwoFactorSection = () => {
    const t = useTranslations()
    const runRest = useRestWithToast()
    const statusSwr = useGetMfaStatusSwr()
    const {
        isEnabled: isTotpEnabled,
        enrol,
        verifyEnrolment,
        disable,
        isEnrolling,
        isVerifying,
        isDisabling,
    } = use2fa()
    const { trigger: enableEmail, isMutating: isEnablingEmail } = usePostEnableMfaEmailSwr()
    const { trigger: disableEmail, isMutating: isDisablingEmail } =
        useDeleteDisableMfaEmailSwr()

    const [panel, setPanel] = useState<ActivePanel>("none")
    const [secret, setSecret] = useState<string | null>(null)
    const [code, setCode] = useState("")
    const [password, setPassword] = useState("")
    const [recoveryCodes, setRecoveryCodes] = useState<Array<string> | null>(null)

    // `undefined` = this backend never reported the method → do not offer it at all
    const emailEnabled = statusSwr.data?.emailOtpEnabled
    const supportsEmail = typeof emailEnabled === "boolean"
    const isEmailPending = isEnablingEmail || isDisablingEmail

    /** Collapse whatever is open and forget every secret typed into it. */
    const closePanel = () => {
        setPanel("none")
        setCode("")
        setPassword("")
    }

    /**
     * Start TOTP enrolment: ask the backend for a fresh secret, then expand.
     *
     * `use2fa` swallows its own errors and answers `null`/`false`, so each call is
     * re-thrown inside {@link runRest} — that is what turns a rejected code into the
     * house error toast instead of a button that silently does nothing.
     */
    const onStartTotpEnrol = async () => {
        setRecoveryCodes(null)
        const enrolment = await runRest(
            async () => {
                const result = await enrol()
                if (!result) {
                    throw new Error(t("security.error"))
                }
                return result
            },
            { showSuccessToast: false },
        )
        if (enrolment === null) {
            return
        }
        setSecret(enrolment.secret)
        setPanel("totpEnrol")
    }

    /** Confirm enrolment with a code; on success show the single-use recovery codes. */
    const onConfirmTotpEnrol = async () => {
        const codes = await runRest(
            async () => {
                const result = await verifyEnrolment(code)
                if (!result) {
                    throw new Error(t("security.invalidCode"))
                }
                return result
            },
            { successMessage: t("security.enabledToast") },
        )
        if (codes === null) {
            return
        }
        setRecoveryCodes(codes)
        setSecret(null)
        closePanel()
    }

    /** Turn TOTP off, proving ownership with a current code. */
    const onConfirmTotpDisable = async () => {
        const ok = await runRest(
            async () => {
                if (!(await disable(code))) {
                    throw new Error(t("security.invalidCode"))
                }
                return true
            },
            { successMessage: t("security.disabledToast") },
        )
        if (ok === null) {
            return
        }
        closePanel()
    }

    /** Flip email codes on/off — both directions demand the current password. */
    const onSubmitEmail = async () => {
        if (!supportsEmail || isEmailPending) {
            return
        }
        // Both endpoints are VOID, so their payload is `null` — the same value
        // `runRest` returns on failure. The sentinel is what makes success detectable.
        const changed = await runRest(
            async () => {
                if (emailEnabled) {
                    await disableEmail({ password })
                } else {
                    await enableEmail({ password })
                }
                return true
            },
            {
                successMessage: emailEnabled
                    ? t("security.twoFactorEmail.disabled")
                    : t("security.twoFactorEmail.enabled"),
            },
        )
        if (changed === null) {
            return
        }
        closePanel()
        await statusSwr.mutate()
    }

    return (
        <SectionCard
            title={t("security.twoFactor")}
            icon={
                <ShieldCheckIcon className="size-5 text-muted" aria-hidden focusable="false" />
            }
        >
            <AsyncContent
                isLoading={!statusSwr.data && !statusSwr.error}
                skeleton={<TwoFactorSectionSkeleton />}
                error={!statusSwr.data ? statusSwr.error : undefined}
                errorContent={{
                    title: t("security.error"),
                    onRetry: () => {
                        void statusSwr.mutate()
                    },
                    retryLabel: t("security.retry"),
                }}
            >
                <div className="flex flex-col gap-3">
                    {/* authenticator app (TOTP) */}
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <DeviceMobileIcon
                                className="size-5 shrink-0 text-muted"
                                aria-hidden
                                focusable="false"
                            />
                            <div className="flex min-w-0 flex-1 flex-col gap-0">
                                <Typography type="body-sm" weight="medium">
                                    {t("security.twoFactorApp.title")}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {isTotpEnabled
                                        ? t("security.enabledDesc")
                                        : t("security.disabledDesc")}
                                </Typography>
                            </div>
                            <StatusChip tone={isTotpEnabled ? "success" : "neutral"}>
                                {isTotpEnabled
                                    ? t("security.enabledLabel")
                                    : t("security.disabledLabel")}
                            </StatusChip>
                            <Button
                                size="sm"
                                variant={isTotpEnabled ? "danger" : "secondary"}
                                isPending={isEnrolling}
                                isDisabled={isEnrolling}
                                onPress={() => {
                                    if (panel === "totpEnrol" || panel === "totpDisable") {
                                        closePanel()
                                        return
                                    }
                                    setCode("")
                                    if (isTotpEnabled) {
                                        setPanel("totpDisable")
                                        return
                                    }
                                    void onStartTotpEnrol()
                                }}
                            >
                                {isTotpEnabled ? t("security.disable") : t("security.enable")}
                            </Button>
                        </div>

                        {panel === "totpEnrol" ? (
                            <div className="flex flex-col gap-3">
                                <Typography type="body-xs" color="muted">
                                    {t("security.scanHint")}
                                </Typography>
                                <div className="flex flex-col gap-0">
                                    <Typography type="body-xs" color="muted">
                                        {t("security.secretHint")}
                                    </Typography>
                                    <Typography type="code">{secret ?? ""}</Typography>
                                </div>
                                <TextField variant="secondary">
                                    <Label htmlFor="two-factor-enrol-code">
                                        {t("security.codeLabel")}
                                    </Label>
                                    <Input
                                        id="two-factor-enrol-code"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={CODE_LENGTH}
                                        placeholder={t("security.codePlaceholder")}
                                        value={code}
                                        onChange={(event) =>
                                            setCode(
                                                event.target.value
                                                    .replace(/\D/g, "")
                                                    .slice(0, CODE_LENGTH),
                                            )
                                        }
                                    />
                                </TextField>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        size="sm"
                                        variant="primary"
                                        isDisabled={code.length !== CODE_LENGTH || isVerifying}
                                        isPending={isVerifying}
                                        onPress={() => void onConfirmTotpEnrol()}
                                    >
                                        {({ isPending }) => (
                                            <>
                                                {isPending ? (
                                                    <Spinner color="current" size="sm" />
                                                ) : null}
                                                {t("security.confirm")}
                                            </>
                                        )}
                                    </Button>
                                    <Button size="sm" variant="ghost" onPress={closePanel}>
                                        {t("security.cancel")}
                                    </Button>
                                </div>
                            </div>
                        ) : null}

                        {panel === "totpDisable" ? (
                            <div className="flex flex-col gap-3">
                                <TextField variant="secondary">
                                    <Label htmlFor="two-factor-disable-code">
                                        {t("security.codeLabel")}
                                    </Label>
                                    <Input
                                        id="two-factor-disable-code"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={CODE_LENGTH}
                                        placeholder={t("security.codePlaceholder")}
                                        value={code}
                                        onChange={(event) =>
                                            setCode(
                                                event.target.value
                                                    .replace(/\D/g, "")
                                                    .slice(0, CODE_LENGTH),
                                            )
                                        }
                                    />
                                </TextField>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        isDisabled={code.length !== CODE_LENGTH || isDisabling}
                                        isPending={isDisabling}
                                        onPress={() => void onConfirmTotpDisable()}
                                    >
                                        {({ isPending }) => (
                                            <>
                                                {isPending ? (
                                                    <Spinner color="current" size="sm" />
                                                ) : null}
                                                {t("security.disable")}
                                            </>
                                        )}
                                    </Button>
                                    <Button size="sm" variant="ghost" onPress={closePanel}>
                                        {t("security.cancel")}
                                    </Button>
                                </div>
                            </div>
                        ) : null}

                        {recoveryCodes ? (
                            <div className="flex flex-col gap-2">
                                <Typography type="body-xs" color="muted">
                                    {t("security.recoveryCodesHint")}
                                </Typography>
                                <div className="grid grid-cols-2 gap-2">
                                    {recoveryCodes.map((recoveryCode) => (
                                        <Typography key={recoveryCode} type="code">
                                            {recoveryCode}
                                        </Typography>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* email one-time codes — only when the backend reports the method */}
                    {supportsEmail ? (
                        <div className="flex flex-col gap-3 border-t border-separator pt-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <EnvelopeSimpleIcon
                                    className="size-5 shrink-0 text-muted"
                                    aria-hidden
                                    focusable="false"
                                />
                                <div className="flex min-w-0 flex-1 flex-col gap-0">
                                    <Typography type="body-sm" weight="medium">
                                        {t("security.twoFactorEmail.title")}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {t("security.twoFactorEmail.description")}
                                    </Typography>
                                </div>
                                <StatusChip tone={emailEnabled ? "success" : "neutral"}>
                                    {emailEnabled
                                        ? t("security.enabledLabel")
                                        : t("security.disabledLabel")}
                                </StatusChip>
                                <Button
                                    size="sm"
                                    variant={emailEnabled ? "danger" : "secondary"}
                                    onPress={() => {
                                        setPassword("")
                                        setPanel(panel === "email" ? "none" : "email")
                                    }}
                                >
                                    {emailEnabled ? t("security.disable") : t("security.enable")}
                                </Button>
                            </div>

                            {panel === "email" ? (
                                <div className="flex flex-col gap-3">
                                    <Typography type="body-xs" color="muted">
                                        {t("security.twoFactorEmail.passwordHint")}
                                    </Typography>
                                    <TextField variant="secondary">
                                        <Label htmlFor="two-factor-email-password">
                                            {t("security.password.currentPassword")}
                                        </Label>
                                        <Input
                                            id="two-factor-email-password"
                                            type="password"
                                            autoComplete="current-password"
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                        />
                                    </TextField>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            size="sm"
                                            variant={emailEnabled ? "danger" : "primary"}
                                            isDisabled={password.length === 0 || isEmailPending}
                                            isPending={isEmailPending}
                                            onPress={() => void onSubmitEmail()}
                                        >
                                            {({ isPending }) => (
                                                <>
                                                    {isPending ? (
                                                        <Spinner color="current" size="sm" />
                                                    ) : null}
                                                    {t("security.confirm")}
                                                </>
                                            )}
                                        </Button>
                                        <Button size="sm" variant="ghost" onPress={closePanel}>
                                            {t("security.cancel")}
                                        </Button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </AsyncContent>
        </SectionCard>
    )
}
