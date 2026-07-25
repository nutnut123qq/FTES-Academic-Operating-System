"use client"

import { useTranslations } from "next-intl"
import useSWR from "swr"
import { getRecommendations, type RecommendationItem } from "@/modules/api/rest/recommendation"
import { useAppSelector } from "@/redux/hooks"

/** A recommended resource row (§5/§17). */
export interface RecommendedResource {
    /** Recommendation row id when persisted, else the item id (POPULAR fallback). */
    id: string
    /** Target resource id — the `/resources/{id}` link. */
    resourceId: string
    /** Display title from the BE snapshot; falls back to the raw item id. */
    title: string
    /** Localized "why you see this" caption. */
    reason: string
}

/** SWR key of the RESOURCE recommendation feed. */
export const RECOMMENDED_RESOURCES_SWR_KEY = "QUERY_RECOMMENDED_RESOURCES_SWR"

/** BE `RecType` this surface asks for. */
export const RECOMMENDATION_TYPE = "RESOURCE"

/** How many suggestions to pull. */
const LIMIT = 20

/**
 * Reason codes this surface ships a caption for, mapped to the single param each
 * one may carry (`null` = no param). Everything else degrades to `default` — the
 * engine can grow new codes without shipping "reasons.SOMETHING_NEW" to users.
 * Codes come from the recommendation-engine design (RESOURCE row + the shared
 * collaborative fallbacks).
 */
const REASON_PARAMS = new Map<string, string | null>([
    ["SAME_SUBJECT", "subject"],
    ["TRENDING", null],
    ["SIMILAR_USERS", "count"],
    ["POPULAR", null],
])

/** Resolved i18n coordinates of one reason: key suffix under `recommended.reasons` + ICU values. */
export interface ResolvedReason {
    /** Key suffix, e.g. `SAME_SUBJECT`, `SAME_SUBJECT_PARAM` or `default`. */
    key: string
    /** ICU values for the `*_PARAM` variants; absent for the plain variants. */
    values?: Record<string, string | number>
}

/** The plain "suggested for you" caption used for unknown/absent reason codes. */
export const DEFAULT_REASON: ResolvedReason = { key: "default" }

/**
 * Maps ONE backend reason (`{code, params}`) onto an i18n key.
 *
 * Degrades on purpose:
 *  - not an object / no string `code` / unknown code → `default`,
 *  - known code whose param is missing or blank → the plain (param-free) variant,
 *  - known code with a usable param → the `*_PARAM` variant + the ICU value.
 *
 * Never throws: the BE types `reasons` as a free-form `Record<string, unknown>[]`.
 */
export const resolveReason = (reason: unknown): ResolvedReason => {
    if (typeof reason !== "object" || reason === null) {
        return DEFAULT_REASON
    }
    const { code, params } = reason as { code?: unknown; params?: unknown }
    if (typeof code !== "string" || !REASON_PARAMS.has(code)) {
        return DEFAULT_REASON
    }
    const paramName = REASON_PARAMS.get(code) ?? null
    if (!paramName) {
        return { key: code }
    }
    const raw =
        typeof params === "object" && params !== null
            ? (params as Record<string, unknown>)[paramName]
            : undefined
    if (typeof raw === "number" && Number.isFinite(raw)) {
        return { key: `${code}_PARAM`, values: { [paramName]: raw } }
    }
    if (typeof raw === "string" && raw.trim() !== "") {
        return { key: `${code}_PARAM`, values: { [paramName]: raw.trim() } }
    }
    // known code, unusable param → still say something specific
    return { key: code }
}

/**
 * Picks the caption for a whole `reasons` array: the FIRST reason we have a real
 * caption for wins; an empty/unknown-only array falls back to `default`.
 */
export const pickReason = (reasons: unknown): ResolvedReason => {
    if (!Array.isArray(reasons)) {
        return DEFAULT_REASON
    }
    for (const reason of reasons) {
        const resolved = resolveReason(reason)
        if (resolved.key !== DEFAULT_REASON.key) {
            return resolved
        }
    }
    return DEFAULT_REASON
}

/**
 * Maps one engine item onto a row: display title from the BE snapshot (raw item id
 * when the snapshot could not be resolved), the `/resources/{id}` target, and the
 * localized reason caption.
 *
 * @param item - One `GET /recommendations` item.
 * @param translate - `t` scoped to the `resourceHub` namespace.
 */
export const toRecommendedResource = (
    item: RecommendationItem,
    translate: (key: string, values?: Record<string, string | number>) => string,
): RecommendedResource => {
    const { key, values } = pickReason(item.reasons)
    return {
        id: item.id ?? item.itemId,
        resourceId: item.itemId,
        title: item.snapshot?.title?.trim() || item.itemId,
        reason: translate(`recommended.reasons.${key}`, values),
    }
}

/**
 * Loads recommended resources from the real §17 engine
 * (`GET /api/v1/recommendations?type=RESOURCE`). Auth-gated (the endpoint only
 * serves the principal's own suggestions), so the key is `null` for guests and the
 * caller shows a sign-in CTA instead of eating a 401.
 *
 * The caption is derived from the structured `Reason{code, params}` via
 * {@link pickReason}; unknown codes degrade to the generic caption.
 */
export const useQueryRecommendedSwr = () => {
    const t = useTranslations("resourceHub")
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)

    const { data, isLoading, error, mutate } = useSWR(
        authenticated ? [RECOMMENDED_RESOURCES_SWR_KEY] : null,
        async () =>
            (await getRecommendations({ type: RECOMMENDATION_TYPE, limit: LIMIT })) ?? [],
    )

    const recommended: Array<RecommendedResource> = (data ?? []).map((item) =>
        toRecommendedResource(item, t),
    )

    return {
        recommended,
        /** False for guests (no request is made) so the sign-in CTA shows immediately. */
        isLoading: authenticated ? isLoading : false,
        error,
        authenticated,
        mutate,
    }
}
