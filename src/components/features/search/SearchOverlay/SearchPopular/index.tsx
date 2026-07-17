import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { SearchResultRow } from "../../SearchResultRow"
import type { SearchRow } from "../../types"

/** Props for {@link SearchPopular}. */
export interface SearchPopularProps {
    /** Popular course rows (icon + title + price). */
    rows: Array<SearchRow>
    /** The currently active row id (keyboard nav), or null. */
    activeRowId: string | null
    /** aria option id builder for a row. */
    optionId: (rowId: string) => string
    /** Activate a row (navigate directly to the course). */
    onActivate: (row: SearchRow) => void
    /** Hover a row (sync active option). */
    onHover: (rowId: string) => void
    /** Listbox element id (for aria). */
    listboxId: string
}

/**
 * The idle-palette "Popular" section: a labelled listbox of popular-course
 * suggestions rendered with the shared {@link SearchResultRow} (icon + title +
 * trailing price). Mirrors the results listbox interface so the parent's keyboard
 * navigation (↑↓ · ⏎) works over these rows identically.
 */
export const SearchPopular = ({
    rows,
    activeRowId,
    optionId,
    onActivate,
    onHover,
    listboxId,
}: SearchPopularProps) => {
    const t = useTranslations()
    return (
        <section className="flex flex-col gap-2">
            <Typography type="body-xs" weight="bold" color="muted" className="px-2">
                {t("search.popular")}
            </Typography>
            <div id={listboxId} role="listbox" className="flex flex-col">
                {rows.map((row) => (
                    <SearchResultRow
                        key={row.id}
                        row={row}
                        query=""
                        optionId={optionId(row.id)}
                        isActive={activeRowId === row.id}
                        onActivate={() => onActivate(row)}
                        onHover={() => onHover(row.id)}
                    />
                ))}
            </div>
        </section>
    )
}
