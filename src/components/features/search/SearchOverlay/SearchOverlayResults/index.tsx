import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { SearchResultRow } from "../../SearchResultRow"
import { SEARCH_CATEGORY_MAP } from "../../map"
import type { SearchRow } from "../../types"
import type { SearchRowGroup } from "../../hooks/useGlobalSearch"

/** Props for {@link SearchOverlayResults}. */
export interface SearchOverlayResultsProps {
    /** Non-empty entity groups in canonical order. */
    groups: Array<SearchRowGroup>
    /** The active query (for highlighting). */
    query: string
    /** The currently active row id (keyboard nav), or null. */
    activeRowId: string | null
    /** aria option id builder for a row. */
    optionId: (rowId: string) => string
    /** Activate a row (navigate). */
    onActivate: (row: SearchRow) => void
    /** Hover a row (sync active option). */
    onHover: (rowId: string) => void
    /** Listbox element id (for aria). */
    listboxId: string
}

/**
 * Grouped results listbox for the overlay — one localized section per non-empty
 * entity group, rows rendered as aria `option`s. DOM focus stays on the input;
 * this is `role="listbox"`.
 */
export const SearchOverlayResults = ({
    groups,
    query,
    activeRowId,
    optionId,
    onActivate,
    onHover,
    listboxId,
}: SearchOverlayResultsProps) => {
    const t = useTranslations()
    return (
        <div id={listboxId} role="listbox" className="flex flex-col gap-4">
            {groups.map((group) => (
                <section key={group.kind} className="flex flex-col gap-1">
                    <Typography type="body-xs" weight="bold" color="muted" className="px-2 uppercase">
                        {t(SEARCH_CATEGORY_MAP[group.kind].labelKey)}
                    </Typography>
                    <div className="flex flex-col">
                        {group.rows.map((row) => (
                            <SearchResultRow
                                key={row.id}
                                row={row}
                                query={query}
                                optionId={optionId(row.id)}
                                isActive={activeRowId === row.id}
                                onActivate={() => onActivate(row)}
                                onHover={() => onHover(row.id)}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    )
}
