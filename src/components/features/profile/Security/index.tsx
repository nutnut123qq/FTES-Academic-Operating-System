"use client"

import {
    ShieldCheckIcon,
} from "@phosphor-icons/react"
import React, {
    useCallback,
    useState,
} from "react"
import {
    Button,
    Card,
    CardContent,
    Chip,
    Input,
    Label,
    Spinner,
    TextField,
    Typography,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    SettingsBreadcrumb,
} from "../Settings/SettingsBreadcrumb"
import { useAppSelector } from "@/redux/hooks"
import { useQueryUserSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserSwr"
import { useMutateSetupTwoFactorSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSetupTwoFactorSwr"
import { useMutateConfirmTwoFactorSwr } from "@/hooks/swr/api/graphql/mutations/useMutateConfirmTwoFactorSwr"
import { useMutateDisableTwoFactorSwr } from "@/hooks/swr/api/graphql/mutations/useMutateDisableTwoFactorSwr"
import type { SetupTwoFactorData } from "@/modules/api/graphql/mutations/types/two-factor"
import { QRCode } from "@/components/reuseable/QRCode"
import { PageHeader } from "@/components/blocks/layout/PageHeader"

/** Inline status shown after a 2FA action. */
interface SecurityStatus {
    /** Whether the action succeeded or failed (drives the colour). */
    kind: "success" | "error"
    /** The message to show. */
    text: string
}

/**
 * Security feature container — configure app-level two-factor auth (TOTP).
 *
 * Reads the current 2FA flag from the signed-in user. Disabled → "Enable" runs
 * `setupTwoFactor`, shows the QR + secret, then `confirmTwoFactor` verifies a
 * code. Enabled → a code + `disableTwoFactor` turns it off. After each change it
 * refetches `me` so redux reflects the new state. Mounted by `/profile/security`.
 *
 * Note: this configures the second factor; enforcing it at a specific login flow
 * is a separate concern that is intentionally not wired yet.
 */
export const Security = () => {
    const t = useTranslations()
    const user = useAppSelector((state) => state.user.user)
    const { mutate: refreshUser } = useQueryUserSwr()
    const {
        trigger: triggerSetup,
        isMutating: settingUp,
    } = useMutateSetupTwoFactorSwr()
    const {
        trigger: triggerConfirm,
        isMutating: confirming,
    } = useMutateConfirmTwoFactorSwr()
    const {
        trigger: triggerDisable,
        isMutating: disabling,
    } = useMutateDisableTwoFactorSwr()

    const enabled = Boolean(user?.twoFactorEnabled)
    // enrollment material from setupTwoFactor (QR + secret); null when not enrolling
    const [setup, setSetup] = useState<SetupTwoFactorData | null>(null)
    // the 6-digit code the user types to confirm or disable
    const [code, setCode] = useState("")
    const [status, setStatus] = useState<SecurityStatus | null>(null)


    /** Keep only digits + cap at 6 so the field always holds a clean code. */
    const onCodeChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
        },
        [],
    )

    /** Begin enrollment: fetch a secret + otpauth URI, then show the QR. */
    const onStartSetup = useCallback(
        async () => {
            setStatus(null)
            setCode("")
            try {
                const result = await triggerSetup()
                const payload = result?.data?.setupTwoFactor
                if (payload?.success && payload.data) {
                    setSetup(payload.data)
                } else {
                    setStatus({ kind: "error", text: payload?.message ?? t("security.error") })
                }
            } catch (error) {
                setStatus({ kind: "error", text: (error as Error)?.message ?? t("security.error") })
            }
        },
        [
            triggerSetup,
            t,
        ],
    )

    /** Verify the typed code against the pending secret and enable 2FA. */
    const onConfirm = useCallback(
        async () => {
            try {
                const result = await triggerConfirm({ code })
                const payload = result?.data?.confirmTwoFactor
                if (payload?.success) {
                    setSetup(null)
                    setCode("")
                    await refreshUser()
                    setStatus({ kind: "success", text: t("security.enabledToast") })
                } else {
                    setStatus({ kind: "error", text: payload?.message ?? t("security.invalidCode") })
                }
            } catch (error) {
                setStatus({ kind: "error", text: (error as Error)?.message ?? t("security.invalidCode") })
            }
        },
        [
            triggerConfirm,
            code,
            refreshUser,
            t,
        ],
    )

    /** Disable 2FA (a valid code is required while it is enabled). */
    const onDisable = useCallback(
        async () => {
            try {
                const result = await triggerDisable({ code })
                const payload = result?.data?.disableTwoFactor
                if (payload?.success) {
                    setCode("")
                    await refreshUser()
                    setStatus({ kind: "success", text: t("security.disabledToast") })
                } else {
                    setStatus({ kind: "error", text: payload?.message ?? t("security.invalidCode") })
                }
            } catch (error) {
                setStatus({ kind: "error", text: (error as Error)?.message ?? t("security.invalidCode") })
            }
        },
        [
            triggerDisable,
            code,
            refreshUser,
            t,
        ],
    )

    /** Abandon an in-progress enrollment. */
    const onCancelSetup = useCallback(
        () => {
            setSetup(null)
            setCode("")
            setStatus(null)
        },
        [],
    )

    // confirm / disable need a full 6-digit code
    const codeComplete = code.length === 6

    return (
        <div className="flex flex-col gap-10">
            <PageHeader
                breadcrumb={<SettingsBreadcrumb current={t("security.title")} />}
                title={t("security.title")}
                description={t("security.subtitle")}
            />
            <div className="flex flex-col gap-6">

                <Card>
                    <CardContent className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <ShieldCheckIcon aria-hidden className="size-5 text-accent" />
                            <div className="flex flex-1 flex-col gap-0">
                                <Typography type="body-sm" weight="medium">
                                    {t("security.twoFactor")}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {enabled ? t("security.enabledDesc") : t("security.disabledDesc")}
                                </Typography>
                            </div>
                            <Chip
                                color={enabled ? "success" : "default"}
                                variant="soft"
                                size="sm"
                            >
                                <Chip.Label>
                                    {enabled ? t("security.enabledLabel") : t("security.disabledLabel")}
                                </Chip.Label>
                            </Chip>
                        </div>

                        {/* status line */}
                        {status ? (
                            <Typography
                                type="body-sm"
                                className={status.kind === "success" ? "text-success" : "text-danger"}
                            >
                                {status.text}
                            </Typography>
                        ) : null}

                        {/* ENABLED → offer disable (requires a code) */}
                        {enabled ? (
                            <div className="flex flex-col gap-3">
                                <TextField variant="secondary">
                                    <Label>{t("security.codeLabel")}</Label>
                                    <Input
                                        variant="secondary"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        placeholder={t("security.codePlaceholder")}
                                        value={code}
                                        onChange={onCodeChange}
                                    />
                                </TextField>
                                <Button
                                    variant="danger"
                                    isDisabled={!codeComplete || disabling}
                                    isPending={disabling}
                                    onPress={onDisable}
                                >
                                    {({ isPending }) => (
                                        <>
                                            {isPending ? <Spinner color="current" size="sm" /> : null}
                                            {t("security.disable")}
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : setup ? (
                        /* ENROLLING → show QR + secret, ask for a code to confirm */
                            <div className="flex flex-col gap-3">
                                <Typography type="body-sm" color="muted">
                                    {t("security.scanHint")}
                                </Typography>
                                <div className="flex flex-col items-center gap-3">
                                    <QRCode size={180} data={setup.otpauthUrl} />
                                    <div className="flex flex-col gap-2">
                                        <Typography type="body-xs" color="muted" align="center">
                                            {t("security.secretHint")}
                                        </Typography>
                                        <Typography type="code" align="center" className="break-all">
                                            {setup.secret}
                                        </Typography>
                                    </div>
                                </div>
                                <TextField variant="secondary">
                                    <Label>{t("security.codeLabel")}</Label>
                                    <Input
                                        variant="secondary"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        placeholder={t("security.codePlaceholder")}
                                        value={code}
                                        onChange={onCodeChange}
                                    />
                                </TextField>
                                <div className="flex gap-3">
                                    <Button
                                        variant="primary"
                                        fullWidth
                                        isDisabled={!codeComplete || confirming}
                                        isPending={confirming}
                                        onPress={onConfirm}
                                    >
                                        {({ isPending }) => (
                                            <>
                                                {isPending ? <Spinner color="current" size="sm" /> : null}
                                                {t("security.confirm")}
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onPress={onCancelSetup}
                                    >
                                        {t("security.cancel")}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                        /* DISABLED → offer enable */
                            <Button
                                variant="primary"
                                isDisabled={settingUp}
                                isPending={settingUp}
                                onPress={onStartSetup}
                            >
                                {({ isPending }) => (
                                    <>
                                        {isPending ? <Spinner color="current" size="sm" /> : null}
                                        {t("security.enable")}
                                    </>
                                )}
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* config-only feature: enforcement at login is not wired yet */}
                <Typography type="body-xs" color="muted">
                    {t("security.note")}
                </Typography>
            </div>
        </div>
    )
}
