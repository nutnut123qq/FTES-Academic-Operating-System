"use client"

import useSWR from "swr"
import type { ConfigScope, SettingCategory } from "@/resources/constants/config"
import { configService } from "@/services/config"

/**
 * Loads one category's setting group through the `configService` seam.
 * Gated off (null key) for non-global scopes — the per-env stub never fetches.
 * Mock-backed; SWR-shaped for a drop-in BE swap.
 */
export const useQueryConfigGroupSwr = (category: SettingCategory, scope: ConfigScope) => {
    return useSWR(
        scope === "global" ? ["CONFIG_GROUP", category, scope] : null,
        async () => {
            if (scope !== "global") throw new Error("Per-env config is deferred")
            return configService.getGroup(category, scope)
        },
    )
}
