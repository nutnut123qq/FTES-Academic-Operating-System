"use client"

import useSWR from "swr"
import {
    getMyCollections,
    listResources,
    type CollectionResponse,
    type ResourceSummary,
} from "@/modules/api/rest/resource"
import { getSubjectDetail } from "@/modules/api/rest/subject/subject"

/**
 * Resource type facet (§5 Resource Hub) — one entry per backend
 * `vn.ftes.aos.resource.domain.ResourceType` constant, lower-cased.
 *
 * `PE` and `FE` are deliberately ABSENT: exam papers and exam albums are not filing-
 * cabinet material, they are practice surfaces with their own interactions (an answer
 * upload graded by AI / a 50-image album with per-image comments), so they live on the
 * Practice tab and are listed only through `GET /resources?subjectId=&type=PE|FE`
 * (see `useQuerySubjectExamsSwr`).
 */
export type ResourceType =
    | "pdf"
    | "slide"
    | "video"
    | "book"
    | "source"
    | "assignment"
    | "notes"
    | "templates"

/** Filter order used by the tab's chip row (mirrors the BE enum order). */
export const SUBJECT_RESOURCE_TYPES: Array<ResourceType> = [
    "pdf",
    "slide",
    "video",
    "book",
    "source",
    "assignment",
    "notes",
    "templates",
]

/** FE facet → backend `ResourceType` name (the value `GET /resources?type=` accepts). */
const BE_TYPE_BY_FACET: Record<ResourceType, string> = {
    pdf: "PDF",
    slide: "SLIDE",
    video: "VIDEO",
    book: "BOOK",
    source: "SOURCE_CODE",
    assignment: "ASSIGNMENT",
    notes: "NOTES",
    templates: "TEMPLATES",
}

/**
 * Backend `ResourceType` names this tab does NOT show. The BE already keeps them out of
 * an untyped listing, but a row that slipped through would render with the wrong label
 * (an unknown type degrades to "notes") and offer a download for material whose whole
 * point is an interactive surface — so they are dropped here too.
 */
const EXAM_BE_TYPES = new Set(["PE", "FE"])

/**
 * Whether a BE list row belongs on the Resources tab at all.
 *
 * @param be - Raw `ResourceSummary.type`.
 * @returns `false` for the exam types the Practice tab owns.
 */
export const isSubjectResourceType = (be: string | null | undefined): boolean =>
    !EXAM_BE_TYPES.has((be ?? "").toUpperCase())

/** Backend `ResourceType` name → FE facet; unknown/missing degrades to `notes`. */
export const mapResourceType = (be: string | null | undefined): ResourceType => {
    switch ((be ?? "").toUpperCase()) {
        case "PDF":
            return "pdf"
        case "SLIDE":
            return "slide"
        case "VIDEO":
            return "video"
        case "BOOK":
            return "book"
        case "SOURCE_CODE":
            return "source"
        case "ASSIGNMENT":
            return "assignment"
        case "TEMPLATES":
            return "templates"
        default:
            return "notes"
    }
}

/** A single resource in a subject's Resource tab. */
export interface SubjectResource {
    /** Real resource UUID — routes to `/resources/{id}` and to the download endpoint. */
    id: string
    title: string
    type: ResourceType
    /**
     * True when the row is a real `/resources/{id}` entity, i.e. the download +
     * "ask AI" actions can address it. Rows sourced from anywhere but
     * `GET /resources` (e.g. a curated workspace link pointing at a lesson) come
     * back `false` and the tab disables those actions instead of 404-ing.
     */
    isResource: boolean
    /** Lifetime download counter (`ResourceSummary.downloadCount`). */
    downloadCount: number
    /** Average rating, or `null` when nobody has rated the resource yet. */
    rating: number | null
    /** Number of ratings behind {@link rating}. */
    ratingCount: number
    /** ISO creation timestamp, or `null` when the BE omits it. */
    createdAt: string | null
    /** Raw BE visibility value (e.g. `PUBLIC` | `ENROLLED_ONLY`). */
    visibility: string
    /**
     * Server-computed lock (CONTRACT B): `true` when the material is purchasers-only
     * and the viewer has not purchased the linked course. The list row then hides the
     * body/URL affordances and its click opens the course buy flow. Defaults `false`
     * so a deployment predating the contract keeps every row unlocked.
     */
    lockedForViewer: boolean
}

/** A grouping of resources (§5 Collections / Learning Pack). */
export interface SubjectCollection {
    id: string
    title: string
    count: number
}

/** Maps a BE list row to the FE {@link SubjectResource}. */
const toResource = (summary: ResourceSummary): SubjectResource => ({
    id: summary.id,
    title: summary.title,
    type: mapResourceType(summary.type),
    isResource: true,
    downloadCount: summary.downloadCount ?? 0,
    rating: typeof summary.avgRating === "number" ? summary.avgRating : null,
    ratingCount: summary.ratingCount ?? 0,
    createdAt: summary.createdAt ?? null,
    visibility: summary.visibility ?? "",
    lockedForViewer: summary.lockedForViewer === true,
})

/** Maps a BE collection row to the FE {@link SubjectCollection}. */
const toCollection = (collection: CollectionResponse): SubjectCollection => ({
    id: collection.id,
    title: collection.title,
    count: collection.itemCount ?? 0,
})

/**
 * Loads the subject's resources + the viewer's collections.
 *
 * - list: `GET /api/v1/resources?subjectId=&type=` — the BE keys the filter on the
 *   subject **UUID** while the route segment is the course **code**, so the subject
 *   detail is resolved first (`GET /subjects/{code}`) and its `id` is passed through.
 *   Every row therefore carries a real resource UUID (download / `/resources/{id}`).
 * - collections: `GET /api/v1/resources/collections/me` — auth-scoped, so it is
 *   skipped for guests and any failure degrades to an empty list rather than
 *   failing the whole tab. Rows are narrowed to this subject plus the viewer's
 *   subject-less learning packs.
 */
const fetchSubjectResources = async (
    code: string,
    type: ResourceType | "all",
    withCollections: boolean,
): Promise<{
    resources: Array<SubjectResource>
    collections: Array<SubjectCollection>
}> => {
    const detail = await getSubjectDetail(code)
    const page = await listResources({
        subjectId: detail.id,
        type: type === "all" ? undefined : BE_TYPE_BY_FACET[type],
        size: 50,
    })

    let collections: Array<CollectionResponse> = []
    if (withCollections) {
        try {
            collections = (await getMyCollections({ size: 50 })) ?? []
        } catch {
            // 401/403 (guest or revoked scope) must not blank the resource list.
            collections = []
        }
    }

    return {
        // PE/FE never belong here — they are the Practice tab's exam surfaces. The BE
        // already withholds them from an untyped listing; this is the belt-and-braces
        // so a deployment that predates that change can't leak one into the list.
        resources: (page?.items ?? [])
            .filter((summary) => isSubjectResourceType(summary.type))
            .map(toResource),
        collections: collections
            .filter(
                (collection) =>
                    !collection.subjectId || collection.subjectId === detail.id,
            )
            .map(toCollection),
    }
}

/**
 * Loads a subject's resources from the real BE resource module.
 *
 * @param subjectId - the `[subjectId]` route segment (a subject code).
 * @param type - active type facet; `"all"` (default) sends no `type` filter. The
 * filter is applied server-side, so the key carries it.
 * @param withCollections - fetch the viewer's collections (skip for guests).
 */
export const useQuerySubjectResourcesSwr = (
    subjectId: string,
    type: ResourceType | "all" = "all",
    withCollections = false,
) => {
    const code = subjectId ? subjectId.toUpperCase() : ""
    const { data, isLoading, isValidating, error, mutate } = useSWR(
        code ? (["subject-resources", code, type, withCollections] as const) : null,
        ([, subjectCode, activeType, collections]) =>
            fetchSubjectResources(subjectCode, activeType, collections),
        { keepPreviousData: true },
    )
    return {
        resources: data?.resources ?? [],
        collections: data?.collections ?? [],
        isLoading,
        isValidating,
        error,
        mutate,
    }
}
