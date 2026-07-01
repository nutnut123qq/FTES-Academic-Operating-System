"use client"

import { create } from "zustand"

/** Every realtime socket.io namespace tracked for connection status. */
export type SocketNamespace =
    | "job_notifications"
    | "content_discussion"
    | "ai_lab"
    | "community_chat"
    | "content_ai"

/** Per-namespace connection status. */
export type SocketConnectionStatus = "connected" | "disconnected"

/** Connection store shape: the per-namespace status map plus its setter. */
interface SocketConnectionStoreState {
    /** statuses[ns] = the last known status of that namespace (absent = never observed). */
    statuses: Partial<Record<SocketNamespace, SocketConnectionStatus>>
    /**
     * Record the status of a namespace. No-ops (returns the same state) when the
     * status is unchanged so subscribers don't re-render needlessly.
     */
    setStatus: (ns: SocketNamespace, status: SocketConnectionStatus) => void
}

/**
 * Single Zustand store for realtime socket connection state.
 *
 * Each namespace's lifecycle hook writes its status here via `getState().setStatus`
 * (no subscription) on connect / disconnect / connect_error. The global
 * {@link import("@/components/blocks/layout/SocketConnectionStatus").SocketConnectionStatus}
 * pill subscribes (via {@link useAnySocketDown}) to surface a "reconnecting" banner.
 * The app keeps working over HTTP, so this is purely informational and never blocks.
 */
export const useSocketConnectionStore = create<SocketConnectionStoreState>((set) => ({
    statuses: {},
    setStatus: (ns, status) =>
        set((state) => {
            if (state.statuses[ns] === status) {
                // unchanged → same state object, no re-render
                return state
            }
            return { statuses: { ...state.statuses, [ns]: status } }
        }),
}))

/** Whether ANY tracked socket namespace is currently disconnected. */
export const useAnySocketDown = (): boolean =>
    useSocketConnectionStore((s) =>
        Object.values(s.statuses).some((v) => v === "disconnected"),
    )
