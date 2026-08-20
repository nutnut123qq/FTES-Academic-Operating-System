import { useCallback, useEffect } from "react"
import useSWR, { useSWRConfig } from "swr"
import { queryMe } from "@/modules/api/graphql/queries/query-me"
import { getSelfProfile } from "@/modules/api/rest/profile"
import { authReady, markAuthReady } from "@/modules/auth/auth-ready"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setAuthenticated, setInitialized } from "@/redux/slices/keycloak"
import { setUser, setViewerAccess } from "@/redux/slices/user"
import { hydrateAppearanceFromServer } from "@/hooks/zustand/appearance/store"
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
 * SWR key of the app-shell viewer query, one per auth state.
 *
 * Exported because the sign-in paths must be able to ASK for this query to run again:
 * everything the navbar renders (`state.user.user`) is written as a side effect INSIDE
 * this query's fetcher, and a session that starts without a page load cannot rely on the
 * key merely flipping (see {@link useRevalidateViewerSwr}).
 */
export const queryUserSwrKey = (authenticated: boolean) => [
    "QUERY_USER_SWR",
    String(authenticated),
]

/**
 * Forces the viewer query ({@link useQueryUserSwr}) to fetch again — the hydration step
 * every "a new session just started" path must run.
 *
 * Why it is needed: signing in only writes the token (local storage + redux
 * `keycloak.*`). The identity the header renders lives in `state.user.user`, and the
 * ONLY writer is the `me` fetcher above. Flipping `authenticated` changes that query's
 * SWR key, which LOOKS like it is enough — but a key change only fetches when SWR has
 * nothing settled for the new key. In a tab that has already been signed in once
 * (previous session, sign-out, revoked session), the signed-in key is already settled,
 * so SWR serves it deduped, the fetcher never runs, `setUser` is never dispatched and
 * the account menu stays in its signed-out state until a full page reload.
 *
 * Only the SIGNED-IN key is touched, and it is touched through `mutate` rather than by
 * waiting for the re-render: `mutate` drops the settled entry even while the hook is
 * still rendered on the signed-out key, so the mount that follows the re-render fetches
 * for real — one `me` request, not two.
 */
export const useRevalidateViewerSwr = () => {
    const { mutate } = useSWRConfig()
    return useCallback(
        async () => {
            await mutate(queryUserSwrKey(true))
        },
        [mutate],
    )
}

/**
 * App-shell current-user query. Fetches the real BE `me: Viewer`, merges the rich
 * REST self-profile, and hydrates redux (`user`, `authenticated`, RBAC access).
 *
 * Đây cũng là nơi DUY NHẤT chốt "phiên đã ngã ngũ": redux không persist nên
 * `keycloak.authenticated` là `false` với tất cả mọi người cho tới khi fetcher này
 * chạy xong. Mọi đường ra đều phải chốt, kể cả nhánh khách và nhánh lỗi — xem
 * `@/modules/auth/auth-ready`.
 */
export const useQueryUserSwr = () => {
    const dispatch = useAppDispatch()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    /** The SWR. */
    const swr = useSWR(
        queryUserSwrKey(authenticated),
        async () => {
            /**
             * `finally` là construct DUY NHẤT phủ hết ba đường ra: `return` sớm khi
             * không có token (khách), `throw` khi `me` không trả về user, và mọi lỗi
             * mạng của `queryMe`. Thiếu bất kỳ đường nào thì cơ chế chờ trong
             * `useRequireAuth` phải sống nhờ net timeout — tức là CTA đứng im vài giây.
             * `dispatch` của redux là đồng bộ, nên `setAuthenticated(true)` ở dưới chắc
             * chắn đã vào store TRƯỚC khi ai đó đang chờ đọc lại state.
             */
            try {
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
                /**
                 * Appearance follows the ACCOUNT, not the machine: whatever accent /
                 * background effect this user picked elsewhere is applied here (and
                 * written back to localStorage, so the pre-paint script has it on the
                 * next load). Guests never get here, so they stay localStorage-only.
                 * Best-effort like the merge above — a look is not worth failing the
                 * shell over.
                 */
                void hydrateAppearanceFromServer(profile).catch(() => undefined)
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
            } finally {
                markAuthReady()
            }
        }
    )

    /**
     * `keycloak.initialized` = "phiên đã ngã ngũ", bật ở CẢ nhánh có user LẪN nhánh
     * khách/lỗi. Treo vào `authReady()` chứ không dispatch thẳng trong fetcher vì net
     * timeout cũng phải bật được cờ này: nếu backend không bao giờ trả lời, fetcher
     * không có đường ra nào, và một cờ `initialized` kẹt `false` khiến các chỗ đọc nó
     * (`AccountMenuDropdown`, `HomeLanding`) skeleton vĩnh viễn.
     */
    useEffect(
        () => {
            void authReady().then(() => dispatch(setInitialized(true)))
        },
        [dispatch],
    )

    /** Return the SWR. */
    return swr
}
