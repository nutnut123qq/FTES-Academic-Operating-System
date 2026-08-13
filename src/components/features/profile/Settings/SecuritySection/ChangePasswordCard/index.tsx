"use client"

import React, { useState } from "react"
import { Button, Spinner, Typography, toast } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useSWRConfig } from "swr"
import { Callout } from "@/components/blocks/feedback/Callout"
import { usePostChangePasswordSwr } from "@/hooks/swr/api/rest/mutations/usePostChangePasswordSwr"

/** House text-input class — plain `<input>`, tokens only (see canon). */
const INPUT_CLASS =
    "w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"

/**
 * Mirrors the BE `PasswordPolicy` (≥ 8 characters, at least one letter and one
 * digit) so a rejected password is caught before the round-trip. The server
 * still enforces it — this is only to give a precise message instead of the
 * generic failure below.
 */
const isPasswordPolicyValid = (password: string) =>
    password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password)

/**
 * ChangePasswordCard — the "đổi mật khẩu" card of the security section, backed
 * by the real `PUT /api/v1/identity/password` (current + new password, policy
 * enforced server-side).
 *
 * The standing warning above the submit button is NOT decoration: the BE
 * revokes every OTHER session right after the password changes
 * (`AuthService.changePassword` → `sessionStore.revokeAll(userId, currentSid)`),
 * so the user must know they are about to sign every other device out BEFORE
 * they press. For the same reason the sessions list is revalidated on success —
 * the rows the SessionsCard shows are stale the moment this succeeds.
 */
export const ChangePasswordCard = () => {
    const t = useTranslations("security.password")
    const { mutate } = useSWRConfig()
    const { trigger, isMutating } = usePostChangePasswordSwr()
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState<string | null>(null)

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!isPasswordPolicyValid(newPassword)) {
            setError(t("policy"))
            return
        }
        if (newPassword !== confirmPassword) {
            setError(t("mismatch"))
            return
        }
        setError(null)
        try {
            await trigger({ currentPassword, newPassword })
        } catch {
            // a wrong current password and a server-side policy rejection both
            // surface as a thrown Error with an untranslated BE message, so one
            // localized line covers both causes
            setError(t("failed"))
            return
        }
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        toast.success(t("success"))
        // other sessions were just revoked server-side — refresh the device list
        await mutate("GET_SESSIONS_SWR")
    }

    return (
        <section className="flex flex-col gap-4 rounded-2xl border border-separator p-4">
            <div className="flex flex-col gap-0">
                <Typography type="body-sm" weight="semibold">
                    {t("title")}
                </Typography>
                <Typography type="body-xs" color="muted">
                    {t("subtitle")}
                </Typography>
            </div>

            <form
                className="flex flex-col gap-4"
                onSubmit={(event) => void onSubmit(event)}
                noValidate
            >
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="settings-current-password">
                        <Typography type="body-sm" weight="medium">
                            {t("current")}
                        </Typography>
                    </label>
                    <input
                        id="settings-current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        className={INPUT_CLASS}
                        autoComplete="current-password"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="settings-new-password">
                        <Typography type="body-sm" weight="medium">
                            {t("newPassword")}
                        </Typography>
                    </label>
                    <input
                        id="settings-new-password"
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        className={INPUT_CLASS}
                        autoComplete="new-password"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="settings-confirm-password">
                        <Typography type="body-sm" weight="medium">
                            {t("confirm")}
                        </Typography>
                    </label>
                    <input
                        id="settings-confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        className={INPUT_CLASS}
                        autoComplete="new-password"
                    />
                </div>

                {/* standing warning — the BE signs every other device out on success */}
                <Callout
                    status="warning"
                    title={t("revokesOtherSessions")}
                    description={t("revokesOtherSessionsHint")}
                />

                {error ? (
                    <Typography type="body-xs" className="text-danger" role="alert">
                        {error}
                    </Typography>
                ) : null}

                <Button
                    type="submit"
                    variant="primary"
                    className="self-start"
                    isDisabled={
                        !currentPassword || !newPassword || !confirmPassword || isMutating
                    }
                    isPending={isMutating}
                >
                    {({ isPending }) => (
                        <>
                            {isPending ? <Spinner color="current" size="sm" /> : null}
                            {t("submit")}
                        </>
                    )}
                </Button>
            </form>
        </section>
    )
}
