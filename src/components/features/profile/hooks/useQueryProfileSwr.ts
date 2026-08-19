"use client"

import useSWR from "swr"
import { getSelfProfile } from "@/modules/api/rest/profile"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"
import { useAppSelector } from "@/redux/hooks"
import type { SelfProfile } from "@/modules/api/rest/profile"

/**
 * The SWR key EVERY self-profile reader and writer must use, so `GET /profiles/me`
 * is fetched once per viewer — and never shared BETWEEN viewers.
 *
 * The old constant `["profiles", "me"]` was one cache entry for the whole app: sign
 * out of A and into B in the same tab and B's hooks re-key to that same entry, so
 * SWR paints A's name, avatar, contact details and privacy settings for B (and
 * inside `dedupingInterval` does not even refetch). The key now carries the viewer
 * id ({@link useViewerScopeId}), which makes A's entry unreachable from B's key.
 *
 * It doubles as the FETCH GATE: `GET /profiles/me` needs a token, so a signed-out
 * (or not-yet-hydrated) viewer gets `null` — no request, no 401, and no answer
 * cached under an identity we cannot name.
 *
 * Anything that WRITES the profile (edit form, privacy toggles, avatar upload) must
 * revalidate through this same hook — a hand-rebuilt `["profiles", "me"]` array no
 * longer matches any key, so the mutate would silently hit nothing.
 *
 * @returns the viewer-scoped key array, or `null` when there is no identified viewer.
 */
export const useSelfProfileKey = (): readonly [string, string, string] | null => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    return authenticated && viewerId ? ["profiles", "me", viewerId] : null
}

/** A user's profile identity (consumed by the profile shell sidebar). */
export interface Profile {
    name: string
    /** Login handle (`@username`), shown under the name. */
    username: string
    /** Short headline / role line. */
    headline: string
    bio: string
    /** Campus / school line. */
    campus: string
    /** Uploaded avatar image URL (empty when unset). */
    avatarUrl: string
    /** Mã khung viền đang đeo (V341); "" = không đeo → header vẽ viền gradient mặc định. */
    avatarFrameCode: string
    /** Account creation date (ISO), rendered as the "Joined" line — empty when unset. */
    joinedAt: string
}

/**
 * Adapts the BE `SelfProfile` DTO (`GET /api/v1/profiles/me`) into the shell's
 * identity model. Missing fields degrade to empty strings — the sidebar guards
 * each with a truthiness check, so an empty value simply hides its row.
 */
export const toShellProfile = (profile: SelfProfile): Profile => ({
    name: profile.displayName ?? profile.username,
    username: profile.username,
    headline: profile.jobTitle ?? "",
    bio: profile.bio ?? "",
    campus: [profile.academic?.campus, profile.academic?.university]
        .filter(Boolean)
        .join(" · "),
    avatarUrl: profile.avatarUrl ?? "",
    avatarFrameCode: profile.avatarFrame?.code ?? "",
    joinedAt: profile.createdAt ?? "",
})

/**
 * Loads the viewer's profile identity from the real BE (`GET /profiles/me`), keyed
 * per viewer ({@link useSelfProfileKey}) so one account never reads another's cached
 * profile and a signed-out visitor never fires the token-only request.
 */
export const useQueryProfileSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(useSelfProfileKey(), getSelfProfile)
    return { profile: data ? toShellProfile(data) : undefined, isLoading, error, mutate }
}
