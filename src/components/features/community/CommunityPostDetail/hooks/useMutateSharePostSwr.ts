"use client"

import { useCallback } from "react"
import { sharePost } from "@/modules/api/rest/community"

/**
 * Records a share of a post (`POST /api/v1/community/posts/{id}/shares`) AFTER the
 * link actually left the app (clipboard copy or a resolved native share sheet).
 *
 * Deliberately fire-and-forget and SILENT: the viewer already has the link, so a
 * failed analytics write (guest 401, rate limit, offline) must never toast or
 * block. The share counter reconciles on the next fetch.
 *
 * `shareType` MUST be one of the BE allowlist (`InteractionService.SHARE_TYPES` =
 * `SHARE` | `QUOTE`) — anything else is rejected with 400
 * `COMMUNITY_INVALID_SHARE_TYPE`, and because the call is silent that failure
 * would never surface: the counter would simply never move. A link copy is a
 * plain `SHARE` (no quote commentary).
 */
export const useMutateSharePostSwr = () => {
    return useCallback((postId: string) => {
        void sharePost(postId, { shareType: "SHARE" }).catch(() => {
            // best-effort telemetry — the user-visible share already happened
        })
    }, [])
}
