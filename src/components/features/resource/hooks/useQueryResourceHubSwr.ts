"use client"

import useSWR from "swr"
import { useTranslations } from "next-intl"
import { useDebouncedValue } from "@/hooks/reuseables/useDebouncedValue"
import { listResources, type ResourceSummary } from "@/modules/api/rest/resource"

/**
 * Resource type as the FE renders/filters it (lowercase slug) — one entry per
 * backend `vn.ftes.aos.resource.domain.ResourceType` value, plus `other` as the
 * defensive bucket for a value this build does not know yet (so a new BE enum
 * constant never explodes a `t("types.<x>")` lookup).
 */
export type ResourceType =
    | "pdf"
    | "slide"
    | "video"
    | "book"
    | "source"
    | "assignment"
    | "pe"
    | "fe"
    | "notes"
    | "templates"
    | "other"

/** A resource row in the global hub (mapped from BE `ResourceSummary`). */
export interface HubResource {
    /** Real resource UUID — the `/resources/{id}` route + bookmark/download calls use it. */
    id: string
    title: string
    type: ResourceType
    /**
     * Display meta shown before {@link HubResource.sizeLabel}. The list contract
     * (`ResourceSummary`) carries only `subjectId` (a UUID), never a subject code,
     * so this falls back to the localized type label rather than leaking a UUID.
     */
    subject: string
    /**
     * Secondary meta. The list contract carries no file size (that lives on the
     * version), so this renders the download count instead.
     */
    sizeLabel: string
    /** Owning subject UUID (kept raw for future subject-code resolution). */
    subjectId: string
    /** Average rating, when the resource has been rated. */
    avgRating?: number
    ratingCount: number
    downloadCount: number
}

/** SWR cache tag for the global resource hub list. */
export const RESOURCE_HUB_TAG = "resource-hub"

/** BE enum constant per FE slug (`other` is FE-only → never sent as a filter). */
const BACKEND_TYPE_BY_SLUG: Record<Exclude<ResourceType, "other">, string> = {
    pdf: "PDF",
    slide: "SLIDE",
    video: "VIDEO",
    book: "BOOK",
    source: "SOURCE_CODE",
    assignment: "ASSIGNMENT",
    pe: "PE",
    fe: "FE",
    notes: "NOTES",
    templates: "TEMPLATES",
}

/** FE slug per BE enum constant (inverse of {@link BACKEND_TYPE_BY_SLUG}). */
const SLUG_BY_BACKEND_TYPE: Record<string, ResourceType> = Object.fromEntries(
    Object.entries(BACKEND_TYPE_BY_SLUG).map(([slug, constant]) => [constant, slug as ResourceType]),
) as Record<string, ResourceType>

/**
 * Normalizes a backend `type` string onto the FE slug union.
 *
 * @param raw - the BE enum constant (e.g. `SOURCE_CODE`); case-insensitive.
 * @returns the matching slug, or `"other"` when unknown/absent.
 */
export const toHubResourceType = (raw: string | null | undefined): ResourceType =>
    SLUG_BY_BACKEND_TYPE[(raw ?? "").toUpperCase()] ?? "other"

/**
 * Translates the chip-bar selection into the `type` query param.
 *
 * @param type - the selected slug, or `"all"` for no type filter.
 * @returns the BE enum constant, or `undefined` when nothing should be sent
 * (`all` and the FE-only `other` bucket).
 */
export const toBackendResourceType = (
    type: ResourceType | "all" | null | undefined,
): string | undefined => {
    if (!type || type === "all" || type === "other") {
        return undefined
    }
    return BACKEND_TYPE_BY_SLUG[type]
}

/** Every filterable slug, in chip-bar order (`other` is not a server filter). */
export const RESOURCE_HUB_TYPES: Array<ResourceType> = Object.keys(
    BACKEND_TYPE_BY_SLUG,
) as Array<ResourceType>

/**
 * Builds the SWR key of one hub page. The search text and the type filter are
 * PART OF THE KEY (not a client-side `.filter()`): each filter combination gets
 * its own cache entry and its own `GET /resources?q=&type=` request.
 *
 * @param query - the debounced, trimmed search text (`""` when empty).
 * @param type - the selected type slug or `"all"`.
 * @param page - zero-based page index.
 * @param size - page size.
 * @returns the SWR key tuple.
 */
export const buildResourceHubKey = (
    query: string,
    type: ResourceType | "all",
    page: number,
    size: number,
) => [RESOURCE_HUB_TAG, query, type, page, size] as const

/** Label formatters injected into {@link mapResourceSummary} (keeps it pure/testable). */
export interface HubResourceLabels {
    /** Localized name of a resource type (`t("types.pdf")`). */
    typeLabel: (type: ResourceType) => string
    /** Localized "N lượt tải" style download counter. */
    downloadsLabel: (count: number) => string
}

/**
 * Maps a BE `ResourceSummary` onto the hub row contract.
 *
 * @param summary - the backend list item.
 * @param labels - localized label formatters (see {@link HubResourceLabels}).
 * @returns the {@link HubResource} row (id stays the real UUID).
 */
export const mapResourceSummary = (
    summary: ResourceSummary,
    labels: HubResourceLabels,
): HubResource => {
    const type = toHubResourceType(summary.type)
    const downloadCount = summary.downloadCount ?? 0
    return {
        id: summary.id,
        title: summary.title,
        type,
        subject: labels.typeLabel(type),
        sizeLabel: labels.downloadsLabel(downloadCount),
        subjectId: summary.subjectId,
        avgRating: summary.avgRating,
        ratingCount: summary.ratingCount ?? 0,
        downloadCount,
    }
}

/** Params accepted by {@link useQueryResourceHubSwr} (all optional). */
export interface UseQueryResourceHubParams {
    /** Raw search text straight from the input — debounced inside the hook. */
    q?: string
    /** Selected type filter, or `"all"`. */
    type?: ResourceType | "all"
    /** Zero-based page index (default 0). */
    page?: number
    /** Page size (default 20). */
    size?: number
}

/**
 * Loads the global resource hub from `GET /api/v1/resources`.
 *
 * The search text is debounced (300 ms) and, together with the type filter,
 * lives in BOTH the SWR key and the request query params — the list is served
 * by the backend, not filtered client-side. `keepPreviousData` keeps the
 * previous rows on screen while a new filter combination is in flight, so
 * typing never blanks the list.
 *
 * @param params - {@link UseQueryResourceHubParams}
 * @returns the mapped rows plus the SWR state (`isLoading`, `isValidating`,
 * `error`, `mutate`) and the server `total`.
 */
export const useQueryResourceHubSwr = (params?: UseQueryResourceHubParams) => {
    const t = useTranslations("resourceHub")
    const type = params?.type ?? "all"
    const page = params?.page ?? 0
    const size = params?.size ?? 20
    const debouncedQuery = useDebouncedValue((params?.q ?? "").trim(), 300)

    const { data, isLoading, isValidating, error, mutate } = useSWR(
        buildResourceHubKey(debouncedQuery, type, page, size),
        async () => {
            const response = await listResources({
                q: debouncedQuery === "" ? undefined : debouncedQuery,
                type: toBackendResourceType(type),
                page,
                size,
            })
            const labels: HubResourceLabels = {
                typeLabel: (value) => t(`types.${value}`),
                downloadsLabel: (count) => t("downloadsCount", { count }),
            }
            return {
                items: (response?.items ?? []).map((item) => mapResourceSummary(item, labels)),
                total: response?.total ?? 0,
            }
        },
        { keepPreviousData: true, revalidateOnFocus: false },
    )

    return {
        resources: data?.items ?? [],
        total: data?.total ?? 0,
        isLoading,
        isValidating,
        error,
        mutate,
    }
}
