"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Button, Skeleton, Typography } from "@heroui/react"
import { MagnifyingGlassIcon, SignInIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import { pathConfig } from "@/resources/path"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setSearchQuery } from "@/redux/slices/search"
import { useAuthenticationOverlayState } from "@/hooks/zustand/overlay/hooks"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { ErrorContent } from "@/components/blocks/async/ErrorContent"
import { useDebouncedValue } from "@/hooks/reuseables/useDebouncedValue"
import { useGlobalSearch, SEARCH_MIN_CHARS } from "../hooks/useGlobalSearch"
import { SEARCH_CATEGORY_MAP } from "../map"
import type { SearchCategoryKind, SearchRow } from "../types"
import { SearchOverlayInput } from "../SearchOverlay/SearchOverlayInput"
import { SearchCategoryTabs, type SearchCategoryTab } from "./SearchCategoryTabs"
import { SearchResultSection } from "./SearchResultSection"

/**
 * `/search` — the unified global search page. Runs the query against the real BE
 * `search(q, types, page)` read-gateway (size 24), which returns matches grouped by
 * entity type (courses/challenges/users/posts/groups/resources). URL-driven (`?q=`):
 * the param seeds Redux on load and is `router.replace`d on debounced typing. Renders
 * filter tabs (All + per-category with count badges), grouped sections with highlighting
 * + per-category "show more", and loading/error/empty/unauthenticated states (the BE
 * search requires auth, so unauthenticated visitors get a sign-in prompt).
 */
export const SearchResults = () => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const searchParams = useSearchParams()
    const dispatch = useAppDispatch()
    const { open: openAuth } = useAuthenticationOverlayState()

    const rawQuery = useAppSelector((state) => state.search.query)
    const debouncedRaw = useDebouncedValue(rawQuery, 300)
    const trimmed = debouncedRaw.trim()
    const hasMinChars = trimmed.length >= SEARCH_MIN_CHARS
    const [activeTab, setActiveTab] = useState<SearchCategoryKind | "all">("all")

    const {
        query,
        authenticated,
        groups: entityGroups,
        isLoading,
        error,
        retry,
    } = useGlobalSearch(true, 24)

    // Seed Redux from ?q= on first load / when the URL param changes externally.
    const urlQuery = searchParams.get("q") ?? ""
    useEffect(() => {
        if (urlQuery && urlQuery !== rawQuery) {
            dispatch(setSearchQuery(urlQuery))
        }
        // Only react to the URL param — typing writes Redux + the URL separately.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlQuery])

    // Reflect debounced typing back into the URL (sharable / back-safe).
    useEffect(() => {
        const base = pathConfig().locale(locale).search().build()
        const next = trimmed ? `${base}?q=${encodeURIComponent(trimmed)}` : base
        const current = trimmed ? `${base}?q=${encodeURIComponent(searchParams.get("q") ?? "")}` : base
        if (next !== current) router.replace(next)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trimmed, locale])

    const onValueChange = useCallback((next: string) => dispatch(setSearchQuery(next)), [dispatch])

    // The real BE `search` already returns every mapped category; index them by kind.
    const allGroups = useMemo(() => {
        const map = new Map<SearchCategoryKind, Array<SearchRow>>()
        for (const group of entityGroups) map.set(group.kind, group.rows)
        return map
    }, [entityGroups])

    const orderedKinds = useMemo(
        () => Array.from(allGroups.keys()),
        [allGroups],
    )

    const tabs = useMemo<Array<SearchCategoryTab>>(() => {
        const total = orderedKinds.reduce((sum, kind) => sum + (allGroups.get(kind)?.length ?? 0), 0)
        return [
            { kind: "all" as const, count: total },
            ...orderedKinds.map((kind) => ({ kind, count: allGroups.get(kind)?.length ?? 0 })),
        ]
    }, [orderedKinds, allGroups])

    const visibleKinds = activeTab === "all" ? orderedKinds : orderedKinds.filter((kind) => kind === activeTab)
    const hasAnyResults = orderedKinds.length > 0

    return (
        <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
            <Typography type="h4" weight="bold">
                {t("searchPage.title")}
            </Typography>

            <SearchOverlayInput
                value={rawQuery}
                onValueChange={onValueChange}
                placeholder={t("searchPage.placeholder")}
                ariaLabel={t("searchPage.placeholder")}
                clearLabel={t("search.clearInput")}
                isLoading={isLoading}
            />

            {!hasMinChars ? (
                <Typography type="body-sm" color="muted">
                    {t("searchPage.empty")}
                </Typography>
            ) : (
                <>
                    {hasAnyResults ? (
                        <SearchCategoryTabs
                            tabs={tabs}
                            active={activeTab}
                            onSelect={setActiveTab}
                            allLabel={t("searchPage.all")}
                            labelFor={(kind) => t(SEARCH_CATEGORY_MAP[kind].labelKey)}
                        />
                    ) : null}

                    {/* Auth gate for real categories (mock still renders below). */}
                    {!authenticated ? (
                        <div className="rounded-3xl border border-default">
                            <EmptyContent
                                icon={<SignInIcon className="size-8 text-muted" aria-hidden focusable="false" />}
                                title={t("searchPage.signInPrompt")}
                                action={
                                    <Button variant="primary" size="sm" onPress={() => openAuth("auth.context.search")}>
                                        {t("search.signIn")}
                                    </Button>
                                }
                            />
                        </div>
                    ) : error ? (
                        <div className="rounded-3xl border border-default">
                            <ErrorContent
                                title={t("search.error")}
                                onRetry={retry}
                                retryLabel={t("search.retry")}
                            />
                        </div>
                    ) : isLoading ? (
                        <div className="flex flex-col gap-3" aria-hidden>
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div key={index} className="flex items-center gap-3 p-2">
                                    <Skeleton className="size-9 shrink-0 rounded-large" />
                                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                                        <Skeleton className="h-4 w-1/2 rounded-md" />
                                        <Skeleton className="h-3 w-1/3 rounded-md" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : null}

                    {/* Result sections (real + mock). */}
                    {hasAnyResults ? (
                        <div className="flex flex-col gap-6">
                            {visibleKinds.map((kind) => (
                                <SearchResultSection
                                    key={kind}
                                    kind={kind}
                                    rows={allGroups.get(kind) ?? []}
                                    query={query || trimmed}
                                />
                            ))}
                        </div>
                    ) : !isLoading && authenticated && !error ? (
                        <EmptyContent
                            icon={<MagnifyingGlassIcon className="size-8 text-muted" aria-hidden focusable="false" />}
                            title={t("searchPage.noResultsFor", { query: trimmed })}
                        />
                    ) : null}
                </>
            )}
        </div>
    )
}
