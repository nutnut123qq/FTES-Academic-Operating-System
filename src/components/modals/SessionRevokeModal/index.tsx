"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { useSWRConfig } from "swr"
import { ConfirmDialog } from "@/components/blocks/feedback/ConfirmDialog"
import { useRestWithToast } from "@/modules/toast/hooks"
import { usePostRevokeSessionSwr } from "@/hooks/swr/api/rest/mutations/usePostRevokeSessionSwr"
import { usePostRevokeAllSessionsSwr } from "@/hooks/swr/api/rest/mutations/usePostRevokeAllSessionsSwr"
import { SESSIONS_SWR_KEY } from "@/hooks/swr/api/rest/queries/useGetSessionsSwr"
import { useSessionRevokeOverlayState } from "@/hooks/zustand/overlay/hooks"

/**
 * Confirm-before-sign-out dialog for security settings, shared by both destructive
 * device actions: "sign out this device" (one session) and "sign out everywhere else"
 * (`revokeAllSessions(keepCurrent = true)`).
 *
 * The overlay store carries only a serializable descriptor of WHICH sign-out is being
 * confirmed; the mutation, the toast and the list revalidation live here, so the device
 * list stays a plain read-only render and no callback is stashed in the store. On
 * success the shared {@link SESSIONS_SWR_KEY} cache is revalidated, so the list the
 * learner is looking at refreshes itself.
 */
export const SessionRevokeModal = () => {
    const t = useTranslations()
    const runRest = useRestWithToast()
    const { mutate } = useSWRConfig()
    const { isOpen, close, context } = useSessionRevokeOverlayState()
    const { trigger: revokeOne, isMutating: isRevokingOne } = usePostRevokeSessionSwr()
    const { trigger: revokeOthers, isMutating: isRevokingOthers } =
        usePostRevokeAllSessionsSwr()

    const isPending = isRevokingOne || isRevokingOthers
    const isSingle = context?.scope === "one"

    const onConfirm = async () => {
        if (!context || isPending) {
            return
        }
        // Both revoke endpoints are VOID, so their unwrapped payload is `null` — the
        // same value `runRest` returns on failure. The explicit sentinel is what makes
        // "did it work?" answerable, so the list is only refetched on a real success.
        const revoked = await runRest(
            async () => {
                if (context.scope === "one") {
                    await revokeOne(context.sid)
                } else {
                    // keepCurrent — the learner must not sign THIS device out by accident
                    await revokeOthers(true)
                }
                return true
            },
            { successMessage: t("sessions.revokedToast") },
        )
        close()
        if (revoked !== null) {
            await mutate(SESSIONS_SWR_KEY)
        }
    }

    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={close}
            onConfirm={() => void onConfirm()}
            title={
                isSingle
                    ? t("sessions.revokeConfirmTitle")
                    : t("sessions.revokeOthersConfirmTitle")
            }
            description={
                isSingle && context.scope === "one"
                    ? t("sessions.revokeConfirmDescription", { device: context.deviceLabel })
                    : t("sessions.revokeOthersConfirmDescription")
            }
            confirmLabel={isSingle ? t("sessions.revoke") : t("sessions.revokeOthers")}
            cancelLabel={t("common.cancel")}
            isPending={isPending}
        />
    )
}
