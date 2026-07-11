"use client"

import { useCallback, useState } from "react"
import { joinGroup } from "@/modules/api/rest/group"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useRestWithToast } from "@/modules/toast/hooks"

/**
 * Local membership status after a join attempt.
 * - `idle`   — not requested yet (the default; BE has no "am I a member" flag
 *   on the group read contract, so we can only reflect actions taken this session).
 * - `pending` — optimistic in-flight, or the group requires approval (BE `PENDING`).
 * - `joined`  — the BE accepted the join immediately (`JOINED`).
 */
export type JoinStatus = "idle" | "pending" | "joined"

/**
 * Joins a group via the real group REST API with an optimistic status + toast.
 *
 * On press we optimistically flip to `pending`; the BE result then resolves to
 * `joined` (open group) or stays `pending` (approval required). On failure we
 * roll back to `idle` (the shared toast surfaces the error).
 *
 * NOTE: there is no leave-group endpoint on the backend, so this hook is
 * join-only — do NOT add a leave action until a BE contract lands.
 *
 * @param groupId - the group to join.
 */
export const useMutateJoinGroupSwr = (groupId: string) => {
    const { requireAuth } = useRequireAuth()
    const runRest = useRestWithToast()
    const [status, setStatus] = useState<JoinStatus>("idle")
    const [isJoining, setIsJoining] = useState(false)

    const join = useCallback(async (): Promise<void> => {
        if (status === "joined" || isJoining) {
            return
        }
        if (!requireAuth("auth.context.join")) {
            return
        }
        const previous = status
        setStatus("pending") // optimistic
        setIsJoining(true)
        const result = await runRest(() => joinGroup(groupId), { showSuccessToast: false })
        setIsJoining(false)
        if (result === null) {
            setStatus(previous) // rollback on failure
            return
        }
        setStatus(result.result === "JOINED" ? "joined" : "pending")
    }, [groupId, isJoining, requireAuth, runRest, status])

    return { status, isJoining, join }
}
