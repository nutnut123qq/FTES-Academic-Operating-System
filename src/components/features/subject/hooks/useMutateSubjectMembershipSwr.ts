"use client"

import { useCallback, useState } from "react"
import { useSWRConfig } from "swr"
import { toast } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { RestError } from "@/modules/api/rest/client"
import { joinSubject, leaveSubject } from "@/modules/api/rest/subject"
import type { CallerMembership, WorkspaceView } from "@/modules/api/rest/subject"
import { subjectWorkspaceKey } from "./useQuerySubjectSwr"

/** Role the BE grants a self-service join (optimistic value until the aggregate re-reads). */
const DEFAULT_MEMBER_ROLE = "MEMBER"

/**
 * Maps a failed membership write to an i18n key under `subjects.membership`.
 * 401/403 → permission, 404 → the subject vanished, 429 → throttled, anything else →
 * the per-action generic failure.
 */
const membershipErrorKey = (error: unknown, fallback: string): string => {
    if (error instanceof RestError) {
        if (error.status === 401 || error.status === 403) return "membership.forbidden"
        if (error.status === 404) return "membership.notFound"
        if (error.status === 429) return "membership.rateLimited"
    }
    return fallback
}

/**
 * Join / leave a subject workspace (`POST /subjects/{code}/join`,
 * `DELETE /subjects/{code}/membership`).
 *
 * Both writes patch the workspace aggregate cache optimistically — `callerMembership`
 * is what every membership gate reads (`Subject.isMember`), so the AI tab unlocks and
 * the Overview banner flips the instant the CTA is pressed — then revalidate, and roll
 * the cache back with a toast when the write fails. Guests get the `AuthenticationModal`
 * and nothing is sent.
 *
 * @param subjectId - the `[subjectId]` route segment (a subject code).
 */
export const useMutateSubjectMembershipSwr = (subjectId: string) => {
    const t = useTranslations("subjects")
    const code = subjectId ? subjectId.toUpperCase() : ""
    const { mutate } = useSWRConfig()
    const { requireAuthAsync } = useRequireAuth()
    const [isJoining, setIsJoining] = useState(false)
    const [isLeaving, setIsLeaving] = useState(false)

    /** Patch `callerMembership` in place; returns the pre-write snapshot for rollback. */
    const patchMembership = useCallback(
        async (membership: CallerMembership | null) => {
            // The cache entry only exists for the signed-in read (the key carries the
            // session flag), which is exactly the entry these writes may touch.
            const key = subjectWorkspaceKey(code, true)
            let snapshot: WorkspaceView | undefined
            await mutate<WorkspaceView>(
                key,
                (current) => {
                    snapshot = current
                    return current
                        ? ({
                              ...current,
                              callerMembership: membership,
                          } as WorkspaceView)
                        : current
                },
                { revalidate: false },
            )
            return { key, snapshot }
        },
        [code, mutate],
    )

    /** Joins the subject; resolves `true` when the membership really exists afterwards. */
    const join = useCallback(async (): Promise<boolean> => {
        if (!code || isJoining) return false
        if (!(await requireAuthAsync("auth.context.generic"))) return false

        setIsJoining(true)
        const { key, snapshot } = await patchMembership({
            role: DEFAULT_MEMBER_ROLE,
            joinedAt: new Date().toISOString(),
        })
        try {
            await joinSubject(code)
            await mutate(key)
            toast.success(t("membership.joinSuccess"))
            return true
        } catch (error) {
            await mutate(key, snapshot, { revalidate: false })
            toast.danger(t(membershipErrorKey(error, "membership.joinFailed")))
            return false
        } finally {
            setIsJoining(false)
        }
    }, [code, isJoining, requireAuthAsync, patchMembership, mutate, t])

    /** Leaves the subject; resolves `true` when the membership is really gone. */
    const leave = useCallback(async (): Promise<boolean> => {
        if (!code || isLeaving) return false
        if (!(await requireAuthAsync("auth.context.generic"))) return false

        setIsLeaving(true)
        const { key, snapshot } = await patchMembership(null)
        try {
            await leaveSubject(code)
            await mutate(key)
            toast.success(t("membership.leaveSuccess"))
            return true
        } catch (error) {
            await mutate(key, snapshot, { revalidate: false })
            toast.danger(t(membershipErrorKey(error, "membership.leaveFailed")))
            return false
        } finally {
            setIsLeaving(false)
        }
    }, [code, isLeaving, requireAuthAsync, patchMembership, mutate, t])

    return { join, leave, isJoining, isLeaving }
}
