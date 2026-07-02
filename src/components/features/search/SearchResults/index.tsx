"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Button, Skeleton, Typography } from "@heroui/react"
import { SignInIcon, WarningCircleIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import { pathConfig } from "@/resources/path"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setSearchQuery } from "@/redux/slices/search"
import { useAuthenticationOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useDebouncedValue } from "@/hooks/reuseables/useDebouncedValue"
import { SEARCH_MIN_CHARS } from "@/hooks/swr/api/graphql/queries/useAutocompleteGlobalSearchSwr"
import { useGlobalSearch } from "../hooks/useGlobalSearch"
import { useMockCommunitySearchSwr } from "../hooks/useMockCommunitySearchSwr"
import { SEARCH_CATEGORY_MAP } from "../map"
import type { SearchCategoryKind, SearchMockKind, SearchRow } from "../types"
import { SearchOverlayInput } from "../SearchOverlay/SearchOverlayInput"
import { SearchCategoryTabs, type SearchCategoryTab } from "./SearchCategoryTabs"
import { SearchResultSection } from "./SearchResultSection"

/** Community mock categories in display order (assumption A1 — BE does not index these yet). */
const MOCK_KINDS: ReadonlyArray<SearchMockKind> = ["users", "posts", "groups", "resources"]

/**
 * `/search` — the unified global search page. Runs the query against the real
 * `autocompleteGlobalSearch` contract for learning entities (size 24) AND against a
 * clearly-marked FE mock provider for community categories (users/posts/groups/
 * resources) the backend does not index yet. URL-driven (`?q=`): the param seeds
 * Redux on load and is `router.replace`d on debounced typing. Renders filter tabs
 * (All + per-category with count badges), grouped sections with breadcrumbs +
 * highlighting + per-category "show more", and loading/error/empty/unauthenticated
 * states (auth gates real categories only; mock categories always render).
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
    const { groups: mockGroups } = useMockCommunitySearchSwr(trimmed, locale, hasMinChars)

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

    // Merge real + mock into one ordered category → rows map.
    const allGroups = useMemo(() => {
        const map = new Map<SearchCategoryKind, Array<SearchRow>>()
        for (const group of entityGroups) map.set(group.kind, group.rows)
        for (const kind of MOCK_KINDS) {
            const rows = mockGroups[kind]
            if (rows.length > 0) map.set(kind, rows)
        }
        return map
    }, [entityGroups, mockGroups])

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
                        <div className="flex flex-col items-center gap-3 rounded-3xl border border-default p-6 text-center">
                            <SignInIcon className="size-8 text-muted" aria-hidden focusable="false" />
                            <Typography type="body-sm" color="muted">
                                {t("searchPage.signInPrompt")}
                            </Typography>
                            <Button variant="primary" size="sm" onPress={() => openAuth("auth.context.search")}>
                                {t("search.signIn")}
                            </Button>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center gap-3 rounded-3xl border border-default p-6 text-center">
                            <WarningCircleIcon className="size-8 text-danger" aria-hidden focusable="false" />
                            <Typography type="body-sm" color="muted">
                                {t("search.error")}
                            </Typography>
                            <Button variant="outline" size="sm" onPress={retry}>
                                {t("search.retry")}
                            </Button>
                        </div>
                    ) : isLoading ? (
                        <div className="flex flex-col gap-3">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <Skeleton key={index} className="h-14 w-full rounded-large" />
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
                        <Typography type="body-sm" color="muted">
                            {t("searchPage.noResultsFor", { query: trimmed })}
                        </Typography>
                    ) : null}
                </>
            )}
        </div>
    )
}
