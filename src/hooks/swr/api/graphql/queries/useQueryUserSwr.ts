import useSWR from "swr"
import { queryMe } from "@/modules/api/graphql/queries/query-me"
import { getSelfProfile } from "@/modules/api/rest/profile"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setAuthenticated } from "@/redux/slices/keycloak"
import { setUser, setViewerAccess } from "@/redux/slices/user"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"
import type { UserEntity } from "@/modules/types/entities/user"
import type { ViewerData } from "@/modules/api/graphql/queries/types/me"
import type { SelfProfile } from "@/modules/api/rest/profile"

/**
 * Derives a GitHub handle from a social-link URL (e.g. `https://github.com/foo` → `foo`).
 * Returns `null` when the URL has no meaningful trailing segment.
 */
const deriveGithubUsername = (url: string | null | undefined): string | null => {
    if (!url) return null
    const trimmed = url.replace(/\/+$/, "")
    const segment = trimmed.split("/").filter(Boolean).pop()
    return segment && !segment.includes(".") ? segment : null
}

/**
 * Maps the BE `Viewer` (+ optional REST self-profile) onto the app's `UserEntity`
 * contract that the whole shell reads from `state.user.user`.
 *
 * - Shell-critical fields come from `me.user` / `me.progression` (always present).
 * - Rich fields (email/bio/roleTitle/location/github) come from REST `/profiles/me`
 *   when available; the merge is best-effort so the shell renders even if REST fails.
 */
const buildUserEntity = (
    viewer: ViewerData,
    profile: SelfProfile | null,
): UserEntity => {
    const { user, progression } = viewer
    const githubLink = profile?.socialLinks?.find(
        (link) => link.platform?.toLowerCase() === "github",
    )
    return {
        id: user.id,
        // BE `PublicUser.username` is nullable; `UserEntity.username` is required.
        username: user.username ?? profile?.username ?? "",
        // No Keycloak sub exposed on the public Viewer; id is a safe stand-in
        // (nothing in the shell reads keycloakId today).
        keycloakId: user.id,
        isDeleted: false,
        // Shell reads `user.avatar` (mapped from BE `avatarUrl`).
        avatar: user.avatarUrl ?? profile?.avatarUrl ?? undefined,
        displayName: user.displayName ?? profile?.displayName ?? null,
        // Rich profile fields (best-effort from REST).
        email: profile?.contactEmail ?? undefined,
        bio: profile?.bio ?? null,
        roleTitle: profile?.jobTitle ?? null,
        location: profile?.address ?? null,
        githubUsername: deriveGithubUsername(githubLink?.url),
        points: progression?.totalXp,
        createdAt: profile?.createdAt ? new Date(profile.createdAt) : new Date(),
        updatedAt: profile?.updatedAt ? new Date(profile.updatedAt) : new Date(),
    }
}

/**
 * App-shell current-user query. Fetches the real BE `me: Viewer`, merges the rich
 * REST self-profile, and hydrates redux (`user`, `authenticated`, RBAC access).
 */
export const useQueryUserSwr = () => {
    const dispatch = useAppDispatch()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    /** The SWR. */
    const swr = useSWR(
        ["QUERY_USER_SWR", authenticated.toString()],
        async () => {
            if (
                !LocalStorage.getItemAsString(
                    LocalStorageId.KeycloakAccessToken
                )) {
                return
            }
            /** Real BE viewer (no envelope; the resolver returns `Viewer` directly). */
            const result = await queryMe({ debug: true })
            const viewer = result?.data?.me
            if (!viewer || !viewer.user) {
                throw new Error("User not found")
            }
            /** Rich profile fields — best-effort; failure must not break the shell. */
            let profile: SelfProfile | null = null
            try {
                profile = await getSelfProfile()
            } catch {
                profile = null
            }
            /** Set the user + auth + RBAC access. */
            dispatch(setAuthenticated(true))
            dispatch(setUser(buildUserEntity(viewer, profile)))
            dispatch(
                setViewerAccess({
                    permissions: viewer.permissions ?? [],
                    scopedGrants: viewer.scopedGrants ?? [],
                }),
            )
            /** Return the viewer. */
            return viewer
        }
    )
    /** Return the SWR. */
    return swr
}
