import type { Locale } from "next-intl"
import { pathConfig } from "@/resources/path"
import type { AutocompleteGlobalSearchItem } from "@/modules/api/graphql/queries/types/autocomplete-global-search"
import type { BuildSearchHrefParams, SearchEntityKind } from "../types"

/**
 * Resolve the canonical deep-link route for one real search hit (routing table D4).
 *
 * Prefers the server-built `path` (locale-prefixed here) when present; otherwise
 * builds the route from `parentPath` via {@link pathConfig}. Returns `null` when the
 * route cannot be resolved (missing `path` + incomplete `parentPath`) so the caller
 * can render the row non-interactive rather than a broken link.
 * @param params - the entity kind, raw item, and active locale.
 * @returns a locale-prefixed href, or `null` when unroutable.
 */
export const buildSearchHref = ({ kind, item, locale }: BuildSearchHrefParams): string | null => {
    // Prefer the server-provided canonical route (locale-agnostic → prepend locale).
    if (item.path) {
        return `/${locale}${item.path.startsWith("/") ? item.path : `/${item.path}`}`
    }

    const parent = item.parentPath
    const course = parent?.course
    const module = parent?.module
    const content = parent?.content
    const path = pathConfig().locale(locale)

    switch (kind) {
        case "courses": {
            const courseDisplayId = item.displayId ?? course?.displayId
            if (!courseDisplayId) return null
            return path.course(courseDisplayId).build()
        }
        case "modules": {
            const courseDisplayId = course?.displayId
            const moduleId = item.id ?? module?.id
            if (!courseDisplayId || !moduleId) return null
            return path.course(courseDisplayId).learn().module(moduleId).build()
        }
        case "contents":
        case "lessonVideos": {
            // Lesson videos deep-link to their owning content route.
            const courseDisplayId = course?.displayId
            const moduleId = module?.id
            const contentId = kind === "contents" ? (item.id ?? content?.id) : content?.id
            if (!courseDisplayId || !moduleId || !contentId) return null
            return path.course(courseDisplayId).learn().module(moduleId).content(contentId).build()
        }
        case "challenges": {
            const courseDisplayId = course?.displayId
            const moduleId = module?.id
            const contentId = content?.id
            const challengeId = item.id
            if (!courseDisplayId || !moduleId || !contentId || !challengeId) return null
            const contentPath = path.course(courseDisplayId).learn().module(moduleId).content(contentId).build()
            return `${contentPath}/challenges/${challengeId}`
        }
        case "milestones":
        case "milestoneTasks": {
            // Both route into the owning course's personal-project page; milestones can target
            // their first task when the ref is present.
            const courseDisplayId = course?.displayId
            if (!courseDisplayId) return null
            const taskId = kind === "milestoneTasks" ? item.id : parent?.task?.id
            return path.course(courseDisplayId).learn().personalProject(taskId).build()
        }
        case "flashcardDecks": {
            const courseDisplayId = course?.displayId ?? item.displayId
            if (!courseDisplayId) return null
            return path.course(courseDisplayId).learn().flashcards().build()
        }
        default:
            return null
    }
}

/** Best available label for a raw search item (title, else displayId, else id). */
export const searchItemLabel = (item: AutocompleteGlobalSearchItem): string =>
    item.title ?? item.displayId ?? item.id

/**
 * Build the breadcrumb line (course › module › content) from a hit's `parentPath`.
 * @param item - the raw search item.
 * @returns a ` › `-joined ancestor string, or `undefined` when no ancestors resolve.
 */
export const searchItemBreadcrumb = (item: AutocompleteGlobalSearchItem): string | undefined => {
    const parent = item.parentPath
    if (!parent) return undefined
    const parts = [parent.course?.displayId, parent.module?.displayId, parent.content?.displayId].filter(
        (part): part is string => Boolean(part),
    )
    return parts.length > 0 ? parts.join(" › ") : undefined
}

/** The canonical searchable-entity kinds in display order. */
export const SEARCH_ENTITY_KINDS: ReadonlyArray<SearchEntityKind> = [
    "courses",
    "modules",
    "contents",
    "lessonVideos",
    "challenges",
    "milestones",
    "milestoneTasks",
    "flashcardDecks",
]
