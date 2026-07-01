"use client"

import React, {
    useCallback,
    useEffect,
    useState,
} from "react"
import { Skeleton, Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { ConsultantGrid } from "./ConsultantGrid"
import { HeadhuntingsBreadcrumbs } from "./HeadhuntingsBreadcrumbs"
import type { HeadhuntingCompanySuggestionItem } from "@/modules/api/graphql/queries/types/headhunting-company-suggestions"
import { pathConfig } from "@/resources/path"
import { useAppSelector } from "@/redux/hooks"
import { useQueryHeadhunterCompaniesSwr } from "@/hooks/swr/api/graphql/queries/useQueryHeadhunterCompaniesSwr"
import { useQueryHeadhuntersSwr } from "@/hooks/swr/api/graphql/queries/useQueryHeadhuntersSwr"
import { useQueryHeadhuntingCompanySuggestionsSwr } from "@/hooks/swr/api/graphql/queries/useQueryHeadhuntingCompanySuggestionsSwr"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { SearchInput } from "@/components/reuseable/SearchInput"

/** Debounce window (ms) before a typed search hits the suggestions backend. */
const SEARCH_DEBOUNCE_MS = 350

/** Props for {@link Headhuntings}. */
export type HeadhuntingsProps = WithClassNames<undefined>

/**
 * Headhuntings page: grid of consultant cards; a card opens the profile modal.
 * Container — owns data + breadcrumb orchestration; renders presentational children.
 *
 * The consultant list is loaded in full into Redux by {@link useQueryHeadhuntersSwr}
 * (no server-side search / pagination on that query), so the search field here is an
 * autocomplete-only affordance: a debounced, ES-backed company typeahead
 * ({@link useQueryHeadhuntingCompanySuggestionsSwr}) whose selection deep-links to
 * the chosen recruitment company's page.
 *
 * @param props - {@link HeadhuntingsProps}
 */
export const Headhuntings = ({ className }: HeadhuntingsProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const consultants = useAppSelector((state) => state.headhunter.entities)
    const count = useAppSelector((state) => state.headhunter.count)
    const courseDisplayId = useAppSelector((state) => state.course.displayId)

    useQueryHeadhunterCompaniesSwr()
    useQueryHeadhuntersSwr()

    /** Immediate input value (drives the field). */
    const [query, setQuery] = useState("")
    /** Debounced query that actually hits the suggestions backend. */
    const [debouncedQuery, setDebouncedQuery] = useState("")

    // debounce the search input before it drives the suggestions query
    useEffect(() => {
        const handle = setTimeout(() => {
            setDebouncedQuery(query)
        }, SEARCH_DEBOUNCE_MS)
        return () => clearTimeout(handle)
    }, [query])

    // ES Completion Suggester (typeahead): clean { id, label } company items from
    // the BE, no client-side filtering or label munging.
    const { data: suggestionItems } = useQueryHeadhuntingCompanySuggestionsSwr(debouncedQuery)
    const suggestions = suggestionItems ?? []

    /** Deep-link to the chosen company's page (the suggestion id is the company id). */
    const onSelectSuggestion = useCallback(
        (suggestion: HeadhuntingCompanySuggestionItem) => {
            if (!courseDisplayId) {
                return
            }
            setQuery("")
            router.push(
                pathConfig()
                    .locale(locale)
                    .course(courseDisplayId)
                    .headhuntingCompanies(suggestion.id)
                    .build(),
            )
        },
        [
            courseDisplayId,
            locale,
            router,
        ],
    )

    return (
        <div className={className}>
            <div className="flex flex-col gap-10">
                <PageHeader
                    breadcrumb={<HeadhuntingsBreadcrumbs />}
                    title={t("headhuntings.title")}
                    description={t("headhuntings.description")}
                />
                <div className="flex flex-col gap-6">
                    {/* company search box (debounced) with ES-backed autocomplete dropdown */}
                    <SearchInput
                        value={query}
                        onValueChange={setQuery}
                        placeholder={t("headhuntings.companySearchPlaceholder")}
                        suggestions={suggestions}
                        onSelectSuggestion={onSelectSuggestion}
                    />
                    {!consultants ? (
                        <Skeleton className="h-4 w-40 rounded-lg" />
                    ) : (
                        <Typography type="body-sm" color="muted">
                            {t("headhuntings.count", { count: count ?? 0 })}
                        </Typography>
                    )}
                    <ConsultantGrid />
                </div>
            </div>
        </div>
    )
}

/** @deprecated Use {@link Headhuntings}. */
export const HeadhuntingsLearnLayout = Headhuntings
