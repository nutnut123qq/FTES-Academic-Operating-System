"use client"

import { useCallback, useMemo } from "react"
import useSWR from "swr"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"
import { FOLLOW_BATCH_LIMIT, getFollowedUserIds } from "@/modules/api/rest/community"

/** SWR key prefix of every batch follow-state entry (see {@link followedUserIdsKey}). */
export const FOLLOWED_USER_IDS_SWR_KEY = "QUERY_FOLLOWED_USER_IDS_SWR"

/**
 * Dedupes, drops empties and SORTS the requested ids so the same set of authors
 * produces ONE cache entry no matter what order the list rendered them in.
 *
 * @param userIds - raw ids collected from the rendered rows (may contain nullish/dupes).
 */
export const normalizeFollowTargets = (
    userIds: ReadonlyArray<string | null | undefined>,
): Array<string> =>
    Array.from(new Set(userIds.filter((id): id is string => Boolean(id)))).sort()

/**
 * Cache key of one batch follow-state read. The joined id list is part of the key so
 * an optimistic follow can find every batch that contains a given user
 * ({@link isFollowedUserIdsKeyFor}) without keeping a separate index.
 *
 * @param normalized - output of {@link normalizeFollowTargets}.
 */
export const followedUserIdsKey = (
    normalized: ReadonlyArray<string>,
    viewerId: string,
) => [FOLLOWED_USER_IDS_SWR_KEY, normalized.join(","), viewerId] as const

/**
 * Whether an arbitrary SWR key is a batch follow-state entry that COVERS `userId` —
 * the filter used by the optimistic follow toggle to patch only the batches whose
 * question actually included that user.
 *
 * @param key - any key from the SWR cache.
 * @param userId - the user whose follow state changed.
 */
export const isFollowedUserIdsKeyFor = (key: unknown, userId: string): boolean =>
    Array.isArray(key) &&
    key[0] === FOLLOWED_USER_IDS_SWR_KEY &&
    typeof key[1] === "string" &&
    key[1].split(",").includes(userId)

/**
 * Splits the ids into request-sized lots. The backend caps a batch at
 * {@link FOLLOW_BATCH_LIMIT} ids and answers `400 COMMUNITY_FOLLOW_BATCH_TOO_LARGE`
 * past that, so a long feed (or a member list) must be chunked client-side.
 *
 * @param ids - normalized ids.
 * @param size - lot size; defaults to the backend cap.
 */
export const chunkFollowTargets = (
    ids: ReadonlyArray<string>,
    size: number = FOLLOW_BATCH_LIMIT,
): Array<Array<string>> => {
    const lots: Array<Array<string>> = []
    for (let index = 0; index < ids.length; index += size) {
        lots.push(ids.slice(index, index + size))
    }
    return lots
}

/**
 * Asks `GET /api/v1/community/follows/me` once per lot and unions the answers.
 *
 * A partially failing fan-out still returns what DID load (a rate-limited lot only
 * costs those rows their "Following" state); the read only rejects when EVERY lot
 * failed, so the caller can tell "nothing followed" from "could not tell".
 *
 * @param normalized - output of {@link normalizeFollowTargets}.
 */
export const fetchFollowedUserIds = async (
    normalized: ReadonlyArray<string>,
): Promise<Array<string>> => {
    const lots = chunkFollowTargets(normalized)
    if (lots.length === 0) return []

    const answers = await Promise.allSettled(lots.map((lot) => getFollowedUserIds(lot)))
    const failure = answers.find((answer) => answer.status === "rejected")
    if (failure && answers.every((answer) => answer.status === "rejected")) {
        throw (failure as PromiseRejectedResult).reason
    }

    const followed = new Set<string>()
    for (const answer of answers) {
        if (answer.status === "fulfilled") {
            for (const id of answer.value) followed.add(id)
        }
    }
    return Array.from(followed)
}

/**
 * Batch follow-state for a LIST of users (feed authors, comment authors, member
 * rows): one request per screen instead of one profile read per avatar. Chunked at
 * {@link FOLLOW_BATCH_LIMIT} ids, deduped/sorted into a single cache entry, and
 * patched in place by the optimistic follow toggle
 * ({@link import("./useMutateFollowUserSwr").useMutateFollowUserSwr}).
 *
 * Guests never fetch (the endpoint reads the caller's own edges and would 401):
 * `isFollowing` simply answers `false` and the CTA stays in its neutral state until
 * the auth guard signs them in.
 *
 * @param userIds - ids of the users currently rendered; nullish/dupes are tolerated.
 * @returns the SWR result plus `followedIds` (a Set) and `isFollowing(userId)`.
 */
export const useQueryFollowedUserIdsSwr = (
    userIds: ReadonlyArray<string | null | undefined>,
) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const normalized = normalizeFollowTargets(userIds)
    const idsKey = normalized.join(",")

    const swr = useSWR(
        authenticated && viewerId && normalized.length > 0
            ? followedUserIdsKey(normalized, viewerId)
            : null,
        ([, ids]: readonly [string, string, string]) =>
            fetchFollowedUserIds(ids ? ids.split(",") : []),
        {
            revalidateOnFocus: false,
            dedupingInterval: 60_000,
            // An infinite list grows its id set page by page, and every page CHANGES
            // the key. Without this the rows would blink back to "Theo dõi" on each
            // append; the previous answer stays valid meanwhile because it is a
            // subset answer to the same question (ids absent from it simply have no
            // verdict yet).
            keepPreviousData: true,
        },
    )

    const followedIds = useMemo(() => new Set(swr.data ?? []), [swr.data])
    const isFollowing = useCallback(
        (userId: string | null | undefined): boolean =>
            Boolean(userId) && followedIds.has(userId as string),
        [followedIds],
    )

    return { ...swr, idsKey, followedIds, isFollowing }
}
