"use client"

import { useAppSelector } from "@/redux/hooks"

/**
 * The VIEWER IDENTITY every caller-scoped SWR key must carry — the signed-in user's
 * id, or `null` when no viewer has resolved yet (guest, or the `me` query still in
 * flight right after a sign-in).
 *
 * ## Why a key needs it
 *
 * A key like `["course-my-courses"]` gated only on "is somebody signed in" is the SAME
 * cache entry for every account. Sign out of A and into B in the SAME TAB and B's hook
 * re-keys to that identical string: SWR serves A's settled entry (stale-while-revalidate)
 * and, inside `dedupingInterval` (60s by default), does not even re-fetch — so B reads
 * A's enrollments/bookmarks/quota. Flushing the cache on sign-out helps only on the paths
 * that flush; the key itself is what makes the leak impossible.
 *
 * ## How to use it
 *
 * Add the id to BOTH halves of the gate — the condition and the key array:
 *
 * ```ts
 * const authenticated = useAppSelector((state) => state.keycloak.authenticated)
 * const viewerId = useViewerScopeId()
 * useSWR(authenticated && viewerId ? ["course-my-courses", viewerId] : null, fetcher)
 * ```
 *
 * Requiring a non-null id means a signed-in-but-not-yet-hydrated viewer keeps the null
 * key (no fetch) for the length of the `me` round-trip, which is deliberate: a request
 * we cannot attribute to an identity has nowhere safe to cache its answer.
 *
 * Data that is the SAME for everyone (course catalogue, public blog posts, leaderboards)
 * must NOT be scoped this way — that would just duplicate one shared entry per account.
 *
 * @returns the viewer's user id, or `null` when there is no identified viewer.
 */
export const useViewerScopeId = (): string | null =>
    useAppSelector((state) => state.user.user?.id ?? null)
