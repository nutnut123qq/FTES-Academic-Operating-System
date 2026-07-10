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
     * Namespaces that have completed a connection at least once. A namespace that
     * never handshakes (optional socket blocked by a WAF / absent env) stays out of
     * this set, so its `"disconnected"` status is a *never-connected* state — not a
     * *drop* — and must not raise the reconnecting banner.
     */
    everConnected: Partial<Record<SocketNamespace, true>>
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
    everConnected: {},
    setStatus: (ns, status) =>
        set((state) => {
            const firstConnect = status === "connected" && !state.everConnected[ns]
            if (state.statuses[ns] === status && !firstConnect) {
                // unchanged → same state object, no re-render
                return state
            }
            return {
                statuses: { ...state.statuses, [ns]: status },
                everConnected: firstConnect
                    ? { ...state.everConnected, [ns]: true }
                    : state.everConnected,
            }
        }),
}))

/**
 * Whether ANY tracked socket namespace has DROPPED — i.e. is currently
 * disconnected *after* having connected at least once. A namespace that never
 * handshaked is ignored (the app works over HTTP; a never-connected optional
 * socket is not a degradation the learner needs to see).
 */
export const useAnySocketDown = (): boolean =>
    useSocketConnectionStore((s) =>
        (Object.keys(s.statuses) as Array<SocketNamespace>).some(
            (ns) => s.statuses[ns] === "disconnected" && s.everConnected[ns],
        ),
    )
