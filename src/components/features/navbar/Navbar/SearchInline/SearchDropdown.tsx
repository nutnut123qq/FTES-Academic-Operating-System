import React from "react"
import { Button, cn } from "@heroui/react"
import { ArrowRightIcon, MagnifyingGlassIcon, SignInIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { ErrorContent } from "@/components/blocks/async/ErrorContent"
import { SearchOverlayResults } from "@/components/features/search/SearchOverlay/SearchOverlayResults"
import type { SearchRow } from "@/components/features/search/types"
import type { SearchRowGroup } from "@/components/features/search/hooks/useGlobalSearch"

/** Props for {@link SearchDropdown}. */
export interface SearchDropdownProps {
    /** Non-empty entity groups (canonical order). */
    groups: Array<SearchRowGroup>
    /** The debounced query used for match highlighting. */
    query: string
    /** The raw trimmed query (for the no-results message + see-all gate). */
    trimmedQuery: string
    /** Whether the user is authenticated (guest → sign-in prompt). */
    authenticated: boolean
    /** True once the trimmed query meets the minimum length. */
    hasMinChars: boolean
    /** First-load spinner state. */
    isLoading: boolean
    /** Whether any real results are present. */
    hasResults: boolean
    /** SWR error (only when no cached data). */
    error: unknown
    /** The active row id (keyboard nav), or null. */
    activeRowId: string | null
    /** aria option id builder for a row. */
    optionId: (rowId: string) => string
    /** Listbox element id (for aria). */
    listboxId: string
    /** Activate a row (navigate). */
    onActivate: (row: SearchRow) => void
    /** Hover a row (sync active option). */
    onHover: (rowId: string) => void
    /** Retry the failed fetch. */
    onRetry: () => void
    /** Open the auth flow (guest sign-in prompt). */
    onSignIn: () => void
    /** Navigate to `/search?q=…`. */
    onSeeAll: () => void
}

/**
 * The desktop inline-search results panel — anchored directly below the navbar
 * search field. Reuses the overlay's grouped {@link SearchOverlayResults} listbox
 * and mirrors its state matrix (guest sign-in prompt · error retry · localized
 * no-results · grouped results) plus a persistent "See all results" footer handing
 * off to `/search?q=…`. Pure/props-driven: the parent owns query state, the fetch,
 * and all keyboard/focus handling.
 */
export const SearchDropdown = ({
    groups,
    query,
    trimmedQuery,
    authenticated,
    hasMinChars,
    isLoading,
    hasResults,
    error,
    activeRowId,
    optionId,
    listboxId,
    onActivate,
    onHover,
    onRetry,
    onSignIn,
    onSeeAll,
}: SearchDropdownProps) => {
    const t = useTranslations()
    const showResults = hasMinChars && authenticated && hasResults

    const body = (() => {
        if (!authenticated) {
            return (
                <EmptyContent
                    icon={<SignInIcon className="size-8 text-muted" aria-hidden focusable="false" />}
                    title={t("search.signInPrompt")}
                    action={
                        <Button variant="primary" size="sm" onPress={onSignIn}>
                            {t("search.signIn")}
                        </Button>
                    }
                />
            )
        }
        if (error) {
            return (
                <ErrorContent
                    title={t("search.error")}
                    onRetry={onRetry}
                    retryLabel={t("search.retry")}
                />
            )
        }
        if (showResults) {
            return (
                <SearchOverlayResults
                    groups={groups}
                    query={query}
                    activeRowId={activeRowId}
                    optionId={optionId}
                    onActivate={onActivate}
                    onHover={onHover}
                    listboxId={listboxId}
                />
            )
        }
        // Only assert "no results" once the debounce has settled (the debounced `query`
        // has caught up to the raw `trimmedQuery`). While a fresh query is still pending
        // the debounce, `isLoading` is false but the fetch hasn't started — treat that
        // window as loading so it renders nothing instead of a false no-results flash.
        if (!isLoading && query === trimmedQuery) {
            return (
                <EmptyContent
                    icon={<MagnifyingGlassIcon className="size-8 text-muted" aria-hidden focusable="false" />}
                    title={t("search.noResultsFor", { query: trimmedQuery })}
                />
            )
        }
        return null
    })()

    // While loading with no previous body, keep the panel out of the DOM so it never
    // flashes an empty box before the first results land.
    if (body === null) return null

    return (
        <div
            className={cn(
                "absolute right-0 top-full z-50 mt-2 w-[420px] max-w-[calc(100vw-2rem)]",
                "flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-default bg-surface shadow-lg",
            )}
        >
            <div className="min-h-0 flex-1 overflow-y-auto p-2">{body}</div>
            <div className="border-t border-default p-2">
                <button
                    type="button"
                    onClick={onSeeAll}
                    disabled={!trimmedQuery}
                    className="inline-flex w-full items-center justify-between gap-1 rounded-large px-2 py-1.5 text-sm text-accent underline-offset-2 transition-colors hover:bg-default hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
                >
                    {t("search.seeAll")}
                    <ArrowRightIcon className="size-4" aria-hidden focusable="false" />
                </button>
            </div>
        </div>
    )
}
