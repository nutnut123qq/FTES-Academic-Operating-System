"use client"

import {
    useCallback,
    useState,
} from "react"
import {
    useLocale,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import { queryResolveRoute } from "@/modules/api/graphql/queries/query-resolve-route"

/** Params for {@link useResolveRouteNavigation}. */
export interface UseResolveRouteNavigationParams {
    /**
     * Opaque global id of the entity — resolved to a route on press. Omit when
     * passing a direct {@link UseResolveRouteNavigationParams.href} instead.
     */
    globalId?: string | null
    /**
     * Direct (already-built, locale-prefixed) route to push on press — skips the
     * resolve round-trip. Takes precedence over {@link UseResolveRouteNavigationParams.globalId}.
     */
    href?: string
}

/** What {@link useResolveRouteNavigation} returns. */
export interface UseResolveRouteNavigationResult {
    /** Navigate: a direct href goes straight there; else resolve the global id. */
    onPress: () => Promise<void>
    /** True while a resolve round-trip is in flight. */
    pending: boolean
    /** Whether there is a routable target (direct href or resolvable global id). */
    routable: boolean
}

/**
 * Resolve-and-navigate for an opaque entity reference. The dashboard has no course
 * context, so a `globalId` is resolved server-side (`resolveRoute`) to its canonical
 * path, then pushed (locale-prefixed). A direct `href` skips the round-trip. Shared
 * by {@link import("./index").EntityToken} (inline/block token) and whole-row list
 * items that navigate to the same entity.
 *
 * @param params - {@link UseResolveRouteNavigationParams}
 * @returns {@link UseResolveRouteNavigationResult}
 */
export const useResolveRouteNavigation = ({
    globalId,
    href,
}: UseResolveRouteNavigationParams): UseResolveRouteNavigationResult => {
    const locale = useLocale()
    const router = useRouter()
    const [pending, setPending] = useState(false)
    // routable via a direct path OR a resolvable global id
    const routable = Boolean(href) || Boolean(globalId)

    const onPress = useCallback(
        async () => {
            // direct path — no resolve round-trip
            if (href) {
                router.push(href)
                return
            }
            // guard: nothing to resolve, or a resolve already in flight
            if (!globalId || pending) {
                return
            }
            setPending(true)
            try {
                // ask the index server for this entity's canonical (locale-agnostic) path
                const response = await queryResolveRoute({
                    request: {
                        globalId,
                    },
                })
                const path = response.data?.resolveRoute?.data?.path
                // prepend the active locale and navigate (no-op if unroutable)
                if (path) {
                    router.push(`/${locale}${path}`)
                }
            } finally {
                setPending(false)
            }
        },
        [
            globalId,
            href,
            locale,
            pending,
            router,
        ],
    )

    return {
        onPress,
        pending,
        routable,
    }
}
