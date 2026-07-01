import type { GraphQLResponse } from "../../types"

/** Discriminated union of entity type names supported by the global search index. */
export type SearchableEntity =
    | "CourseEntity"
    | "ModuleEntity"
    | "ContentEntity"
    | "LessonVideoEntity"
    | "ChallengeEntity"
    | "MilestoneEntity"
    | "MilestoneTaskEntity"
    | "FlashcardDeckEntity"

/** One resolved ancestor (course/module/content/challenge) of a search hit. */
export interface AutocompleteGlobalSearchParentRef {
    /** Primary key (UUID) — used for the module/content URL segments. */
    id: string
    /** Human-facing slug — used for the course URL segment. */
    displayId: string
}

/** Ancestor chain of a search hit, used to build the deep-link URL. */
export interface AutocompleteGlobalSearchParentPath {
    /** Owning course (present for every entity kind). */
    course?: AutocompleteGlobalSearchParentRef
    /** Owning module (present for module/content/challenge hits). */
    module?: AutocompleteGlobalSearchParentRef
    /** Owning content (present for content/challenge hits). */
    content?: AutocompleteGlobalSearchParentRef
    /** The challenge itself (present for challenge hits). */
    challenge?: AutocompleteGlobalSearchParentRef
    /** The milestone's first task (present for milestone hits) — used to deep-link into the personal-project page. */
    task?: AutocompleteGlobalSearchParentRef
}

/** One result item returned from the autocomplete global search endpoint. */
export interface AutocompleteGlobalSearchItem {
    /** Primary identifier of the entity. */
    id: string
    /** Short public identifier used in URLs (e.g. `course-001`). */
    displayId?: string
    /** Display title of the entity. */
    title?: string
    /** Array of additional matched text snippets. */
    texts?: Array<string>
    /** Resolved ancestor chain used to build a navigation URL (absent if uncached). */
    parentPath?: AutocompleteGlobalSearchParentPath
    /**
     * Canonical, locale-agnostic route built server-side by the route index.
     * Client prepends `/{locale}` and pushes it. Null/absent when unroutable.
     */
    path?: string | null
}

/** Payload inside `autocompleteGlobalSearch.data` after the standard API wrapper. */
export interface AutocompleteGlobalSearchData {
    /** Matching course results. */
    courses?: Array<AutocompleteGlobalSearchItem>
    /** Matching module results. */
    modules?: Array<AutocompleteGlobalSearchItem>
    /** Matching challenge results. */
    challenges?: Array<AutocompleteGlobalSearchItem>
    /** Matching content results. */
    contents?: Array<AutocompleteGlobalSearchItem>
    /** Matching lesson video results. */
    lessonVideos?: Array<AutocompleteGlobalSearchItem>
    /** Matching flashcard-deck results. */
    flashcardDecks?: Array<AutocompleteGlobalSearchItem>
    /** Matching milestone results. */
    milestones?: Array<AutocompleteGlobalSearchItem>
    /** Matching milestone-task results. */
    milestoneTasks?: Array<AutocompleteGlobalSearchItem>
}

/** Apollo variables for `autocompleteGlobalSearch(request: AutocompleteGlobalSearchRequest!)`. */
export interface QueryAutocompleteGlobalSearchRequest {
    /** Free-text search query string. */
    query: string
    /** Optional subset of entity types to search within; omit to search all. */
    entities?: Array<SearchableEntity>
    /** Maximum number of results to return per entity type. */
    size?: number
}

/** Apollo response shape for the `autocompleteGlobalSearch` query. */
export interface QueryAutocompleteGlobalSearchResponse {
    /** Top-level `autocompleteGlobalSearch` field wrapping the standard API response. */
    autocompleteGlobalSearch: GraphQLResponse<AutocompleteGlobalSearchData>
}
