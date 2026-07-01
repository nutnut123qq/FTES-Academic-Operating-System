"use client"

import {
    useParams,
} from "next/navigation"
import { useAppSelector } from "@/redux/hooks"

/**
 * Resolve the target username of the profile being viewed.
 *
 * On `/profile/[username]` it is the route segment; on the bare `/profile`
 * (your own profile) there is no segment, so it falls back to the signed-in
 * user's username. Returns `null` while the signed-in user is still hydrating
 * on the bare route (callers treat that as "loading").
 *
 * @returns the username to fetch, or `null` when not yet resolvable.
 */
export const useProfileUsername = (): string | null => {
    // `/[username]` segment wins; absent on the viewer's own `/profile`
    const routeUsername = useParams().username
    const viewer = useAppSelector((state) => state.user.user)
    // own profile → use the signed-in user's username
    return routeUsername ? String(routeUsername) : (viewer?.username ?? null)
}
