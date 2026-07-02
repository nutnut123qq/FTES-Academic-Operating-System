"use client"

import React, { useState } from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { SearchResultRow } from "../../SearchResultRow"
import { SEARCH_CATEGORY_MAP } from "../../map"
import type { SearchCategoryKind, SearchRow } from "../../types"

/** Initial number of rows shown before "show more". */
const INITIAL_ROWS = 5

/** Props for {@link SearchResultSection}. */
export interface SearchResultSectionProps {
    /** The category kind (drives the localized heading). */
    kind: SearchCategoryKind
    /** Rows in this category. */
    rows: Array<SearchRow>
    /** The active query (for highlighting). */
    query: string
}

/**
 * One `/search` category section — localized heading + rows, with a per-category
 * "show more" that reveals the remaining fetched rows client-side (the BE contract
 * has no offset pagination; assumption A2). Routable rows navigate on press; inert
 * rows render breadcrumb-only. Owns its local reveal state.
 */
export const SearchResultSection = ({ kind, rows, query }: SearchResultSectionProps) => {
    const t = useTranslations()
    const router = useRouter()
    const [expanded, setExpanded] = useState(false)

    const visible = expanded ? rows : rows.slice(0, INITIAL_ROWS)
    const remainder = rows.length - visible.length

    return (
        <section className="flex flex-col gap-2" aria-label={t(SEARCH_CATEGORY_MAP[kind].labelKey)}>
            <Typography type="body-sm" weight="bold" color="muted" className="uppercase">
                {t(SEARCH_CATEGORY_MAP[kind].labelKey)}
            </Typography>
            <div className="flex flex-col" role="listbox" aria-label={t(SEARCH_CATEGORY_MAP[kind].labelKey)}>
                {visible.map((row) => (
                    <SearchResultRow
                        key={row.id}
                        row={row}
                        query={query}
                        onActivate={row.href ? () => router.push(row.href as string) : undefined}
                    />
                ))}
            </div>
            {remainder > 0 ? (
                <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="self-start text-sm text-accent underline-offset-2 hover:underline"
                >
                    {t("search.showMore", { count: remainder })}
                </button>
            ) : null}
        </section>
    )
}
