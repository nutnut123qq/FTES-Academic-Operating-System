"use client"

import useSWR from "swr"
import type { ConfigScope } from "@/resources/constants/config"
import { configService } from "@/services/config"

/**
 * Loads the feature flags of a scope through the `configService` seam.
 * Gated off (null key) for non-global scopes — the per-env stub never fetches.
 * Mock-backed; SWR-shaped for a drop-in BE swap.
 */
export const useQueryConfigFlagsSwr = (scope: ConfigScope) => {
    return useSWR(
        scope === "global" ? ["CONFIG_FLAGS", scope] : null,
        async () => {
            if (scope !== "global") throw new Error("Per-env config is deferred")
            return configService.listFlags(scope)
        },
    )
}
