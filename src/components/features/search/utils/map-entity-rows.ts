import type { Locale } from "next-intl"
import type { AutocompleteGlobalSearchData } from "@/modules/api/graphql/queries/types/autocomplete-global-search"
import type { SearchEntityKind, SearchRow } from "../types"
import { buildSearchHref, searchItemBreadcrumb, searchItemLabel, SEARCH_ENTITY_KINDS } from "./build-search-href"

/**
 * Map the raw `autocompleteGlobalSearch` payload into per-kind {@link SearchRow}
 * lists (canonical group order), resolving deep links + breadcrumbs. Empty groups
 * produce empty arrays.
 * @param data - the autocomplete data payload (may be undefined before first load).
 * @param locale - active locale for href building.
 * @returns a record of kind → rows.
 */
export const mapEntityRows = (
    data: AutocompleteGlobalSearchData | undefined,
    locale: Locale,
): Record<SearchEntityKind, Array<SearchRow>> => {
    const result = {} as Record<SearchEntityKind, Array<SearchRow>>
    for (const kind of SEARCH_ENTITY_KINDS) {
        const items = data?.[kind] ?? []
        result[kind] = items.map((item) => ({
            id: `${kind}-${item.id}`,
            kind,
            title: searchItemLabel(item),
            snippet: item.texts?.[0],
            breadcrumb: searchItemBreadcrumb(item),
            href: buildSearchHref({ kind, item, locale }),
        }))
    }
    return result
}
