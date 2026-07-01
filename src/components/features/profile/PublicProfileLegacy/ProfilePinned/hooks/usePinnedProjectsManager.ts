"use client"

import {
    useCallback,
    useState,
} from "react"
import { useSWRConfig } from "swr"
import { useTranslations } from "next-intl"
import { useAppSelector } from "@/redux/hooks"
import { QUERY_USER_PINNED_PROJECTS_SWR, useQueryUserPinnedProjectsSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserPinnedProjectsSwr"
import { useMutateReorderPinnedProjectsSwr } from "@/hooks/swr/api/graphql/mutations/useMutateReorderPinnedProjectsSwr"
import { useMutateUnpinProjectSwr } from "@/hooks/swr/api/graphql/mutations/useMutateUnpinProjectSwr"
import { useGraphQLWithToast } from "@/modules/toast/hooks"
import type { QueryUserPinnedProjectItem } from "@/modules/api/graphql/queries/types/user-pinned-projects"

/** Shape returned by {@link usePinnedProjectsManager}. */
export interface UsePinnedProjectsManagerResult {
    /** The signed-in owner's pinned projects (empty until loaded). */
    pins: Array<QueryUserPinnedProjectItem>
    /** True while the owner's pins are first loading. */
    isLoading: boolean
    /** Whether the cap ({@link MAX_PINNED_PROJECTS}) has been reached. */
    isFull: boolean
    /** True while any unpin/reorder mutation is in flight. */
    isBusy: boolean
    /** Remove a pin by id, then revalidate. */
    onRemove: (id: string) => Promise<void>
    /** Move a pin one slot earlier, then persist the new order. */
    onMoveUp: (id: string) => Promise<void>
    /** Move a pin one slot later, then persist the new order. */
    onMoveDown: (id: string) => Promise<void>
}

/**
 * Maximum pins a user may hold — mirrors the backend `MAX_PINNED_PROJECTS`
 * constant (the pin mutations reject past this).
 */
export const MAX_PINNED_PROJECTS = 6

/**
 * Owner-side manager for pinned projects. Self-reads the SIGNED-IN user's pins
 * (the owner of the modal, not necessarily the viewed profile) and owns the
 * unpin + reorder mutations, each toasted via {@link useGraphQLWithToast} and
 * followed by an SWR revalidation of the owner's pinned list. Reorder computes
 * the new id order client-side and sends the whole array (position = orderIndex).
 *
 * @returns {@link UsePinnedProjectsManagerResult}
 */
export const usePinnedProjectsManager = (): UsePinnedProjectsManagerResult => {
    const t = useTranslations()
    const { mutate } = useSWRConfig()
    const runGraphQL = useGraphQLWithToast()
    // pins always belong to the signed-in user (manage is owner-only)
    const viewerId = useAppSelector((state) => state.user.user?.id) ?? null
    const {
        data,
        isLoading,
    } = useQueryUserPinnedProjectsSwr(viewerId)
    const unpinSwr = useMutateUnpinProjectSwr()
    const reorderSwr = useMutateReorderPinnedProjectsSwr()
    const [isBusy, setBusy] = useState(false)

    const pins = data ?? []

    /** Revalidate the owner's pinned-projects SWR cache. */
    const revalidate = useCallback(
        async () => {
            if (viewerId) {
                await mutate([QUERY_USER_PINNED_PROJECTS_SWR, viewerId])
            }
        },
        [mutate, viewerId],
    )

    /** Remove a pin by id, then revalidate. */
    const onRemove = useCallback(
        async (id: string) => {
            setBusy(true)
            try {
                await runGraphQL(
                    async () => {
                        const result = await unpinSwr.trigger({ id })
                        const env = result?.data?.unpinProject
                        if (!env) {
                            throw new Error(t("toast.defaultError"))
                        }
                        if (env.success) {
                            await revalidate()
                        }
                        return env
                    },
                    {
                        showErrorToast: true,
                        showSuccessToast: true,
                    },
                )
            } finally {
                setBusy(false)
            }
        },
        [runGraphQL, unpinSwr, revalidate, t],
    )

    /** Persist a reordered id list (position becomes orderIndex). */
    const persistOrder = useCallback(
        async (ids: Array<string>) => {
            setBusy(true)
            try {
                await runGraphQL(
                    async () => {
                        const result = await reorderSwr.trigger({ ids })
                        const env = result?.data?.reorderPinnedProjects
                        if (!env) {
                            throw new Error(t("toast.defaultError"))
                        }
                        if (env.success) {
                            await revalidate()
                        }
                        return env
                    },
                    {
                        showErrorToast: true,
                        showSuccessToast: true,
                    },
                )
            } finally {
                setBusy(false)
            }
        },
        [runGraphQL, reorderSwr, revalidate, t],
    )

    /** Swap a pin with its neighbour at `delta` (-1 up / +1 down), then persist. */
    const move = useCallback(
        async (id: string, delta: number) => {
            const index = pins.findIndex((pin) => pin.id === id)
            const target = index + delta
            // bail when the swap would fall outside the list
            if (index < 0 || target < 0 || target >= pins.length) {
                return
            }
            const next = [...pins]
            const [moved] = next.splice(index, 1)
            next.splice(target, 0, moved)
            await persistOrder(next.map((pin) => pin.id))
        },
        [pins, persistOrder],
    )

    const onMoveUp = useCallback((id: string) => move(id, -1), [move])
    const onMoveDown = useCallback((id: string) => move(id, 1), [move])

    return {
        pins,
        isLoading,
        isFull: pins.length >= MAX_PINNED_PROJECTS,
        isBusy,
        onRemove,
        onMoveUp,
        onMoveDown,
    }
}
