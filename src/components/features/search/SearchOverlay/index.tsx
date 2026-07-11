"use client"

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { Button, Drawer, cn } from "@heroui/react"
import { MagnifyingGlassIcon, SignInIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { pathConfig } from "@/resources/path"
import { useLocale } from "next-intl"
import { useSearchOverlayState, useAuthenticationOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setSearchQuery, clearSearchQuery } from "@/redux/slices/search"
import { useRecentSearches } from "@/hooks/reuseables/useRecentSearches"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useGlobalSearch } from "../hooks/useGlobalSearch"
import type { SearchRow } from "../types"
import { SearchOverlayInput } from "./SearchOverlayInput"
import { SearchOverlayResults } from "./SearchOverlayResults"
import { SearchRecentQueries } from "./SearchRecentQueries"
import { SearchOverlayFooter } from "./SearchOverlayFooter"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { ErrorContent } from "@/components/blocks/async/ErrorContent"

/**
 * The global command-palette search overlay (Ctrl/Cmd+K or navbar button).
 *
 * Right-anchored slide-in drawer (full-width sheet below `sm`). Owns: the
 * debounced real-entity search (via {@link useGlobalSearch}), keyboard navigation
 * across grouped rows (↑↓ wrap · Enter open · Esc close), recent searches
 * (device-local), the "See all results" handoff to `/search?q=…`, the aria combobox
 * pattern, and the states (loading / error / empty / unauthenticated). Mounted once
 * in the shell overlay container, driven by the `search` overlay key.
 */
export const SearchOverlay = ({ className }: WithClassNames<undefined>) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const dispatch = useAppDispatch()
    const { isOpen, setOpen, open, close } = useSearchOverlayState()
    const { open: openAuth } = useAuthenticationOverlayState()
    const rawQuery = useAppSelector((state) => state.search.query)
    const { recent, add: addRecent, clear: clearRecent } = useRecentSearches()

    const {
        query: debouncedQuery,
        hasMinChars,
        authenticated,
        groups,
        flatRows,
        isLoading,
        hasResults,
        error,
        retry,
    } = useGlobalSearch(false, 8)

    const [activeIndex, setActiveIndex] = useState(-1)
    const inputRef = useRef<HTMLInputElement>(null)
    const restoreFocusRef = useRef<HTMLElement | null>(null)
    const baseId = useId()
    const listboxId = `${baseId}-listbox`
    const optionId = useCallback((rowId: string) => `${baseId}-opt-${rowId}`, [baseId])

    const trimmedRaw = rawQuery.trim()
    const showResults = hasMinChars && authenticated && hasResults
    const activeRowId = activeIndex >= 0 && activeIndex < flatRows.length ? flatRows[activeIndex].id : null

    // Reset the active option whenever the result set changes.
    useEffect(() => {
        setActiveIndex(-1)
    }, [flatRows])

    // Focus the input on open; remember the previously focused element to restore on close.
    useEffect(() => {
        if (isOpen) {
            restoreFocusRef.current = document.activeElement as HTMLElement | null
            const timer = setTimeout(() => inputRef.current?.focus(), 0)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    // Global Ctrl/Cmd+K to open (skip when another overlay is on top — the modal owns Esc).
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const isPaletteShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k"
            if (!isPaletteShortcut) return
            // Skip when some OTHER overlay is already on top (and ours is closed) so Ctrl/K
            // never steals focus from an open modal/drawer.
            if (!isOpen) {
                const foreignOverlay = Array.from(
                    document.querySelectorAll(".modal__dialog, .drawer__dialog"),
                ).some((node) => !node.hasAttribute("data-search-overlay"))
                if (foreignOverlay) return
            }
            event.preventDefault()
            open()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [open, isOpen])

    const onValueChange = useCallback(
        (next: string) => {
            dispatch(setSearchQuery(next))
        },
        [dispatch],
    )

    const closeOverlay = useCallback(() => {
        close()
        dispatch(clearSearchQuery())
        const toRestore = restoreFocusRef.current
        if (toRestore && typeof toRestore.focus === "function") toRestore.focus()
    }, [close, dispatch])

    const activateRow = useCallback(
        (row: SearchRow) => {
            if (!row.href) return
            addRecent(trimmedRaw)
            closeOverlay()
            router.push(row.href)
        },
        [addRecent, trimmedRaw, closeOverlay, router],
    )

    const goToSearchPage = useCallback(() => {
        if (!trimmedRaw) return
        addRecent(trimmedRaw)
        const base = pathConfig().locale(locale).search().build()
        closeOverlay()
        router.push(`${base}?q=${encodeURIComponent(trimmedRaw)}`)
    }, [trimmedRaw, addRecent, locale, closeOverlay, router])

    const onInputKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Escape") {
                event.preventDefault()
                closeOverlay()
                return
            }
            if (flatRows.length === 0) {
                if (event.key === "Enter") {
                    event.preventDefault()
                    goToSearchPage()
                }
                return
            }
            if (event.key === "ArrowDown") {
                event.preventDefault()
                setActiveIndex((prev) => (prev + 1) % flatRows.length)
            } else if (event.key === "ArrowUp") {
                event.preventDefault()
                setActiveIndex((prev) => (prev <= 0 ? flatRows.length - 1 : prev - 1))
            } else if (event.key === "Enter") {
                event.preventDefault()
                if (activeIndex >= 0 && activeIndex < flatRows.length) {
                    activateRow(flatRows[activeIndex])
                } else {
                    goToSearchPage()
                }
            }
        },
        [flatRows, activeIndex, activateRow, goToSearchPage, closeOverlay],
    )

    const onHoverRow = useCallback(
        (rowId: string) => {
            const index = flatRows.findIndex((row) => row.id === rowId)
            if (index >= 0) setActiveIndex(index)
        },
        [flatRows],
    )

    const body = useMemo(() => {
        if (!authenticated && hasMinChars) {
            return (
                <EmptyContent
                    icon={<SignInIcon className="size-8 text-muted" aria-hidden focusable="false" />}
                    title={t("search.signInPrompt")}
                    action={
                        <Button variant="primary" size="sm" onPress={() => openAuth("auth.context.search")}>
                            {t("search.signIn")}
                        </Button>
                    }
                />
            )
        }
        if (!hasMinChars) {
            return (
                <SearchRecentQueries
                    recent={recent}
                    onSelect={(item) => {
                        dispatch(setSearchQuery(item))
                        inputRef.current?.focus()
                    }}
                    onClear={clearRecent}
                />
            )
        }
        if (error) {
            return (
                <ErrorContent
                    title={t("search.error")}
                    onRetry={retry}
                    retryLabel={t("search.retry")}
                />
            )
        }
        if (showResults) {
            return (
                <SearchOverlayResults
                    groups={groups}
                    query={debouncedQuery}
                    activeRowId={activeRowId}
                    optionId={optionId}
                    onActivate={activateRow}
                    onHover={onHoverRow}
                    listboxId={listboxId}
                />
            )
        }
        if (!isLoading) {
            return (
                <EmptyContent
                    icon={<MagnifyingGlassIcon className="size-8 text-muted" aria-hidden focusable="false" />}
                    title={t("search.noResultsFor", { query: trimmedRaw })}
                />
            )
        }
        return null
    }, [
        authenticated, hasMinChars, error, showResults, isLoading, recent, groups, debouncedQuery,
        activeRowId, optionId, activateRow, onHoverRow, listboxId, retry, t, openAuth, dispatch,
        clearRecent, trimmedRaw,
    ])

    return (
        <Drawer.Backdrop
            isOpen={isOpen}
            onOpenChange={(next) => (next ? setOpen(true) : closeOverlay())}
        >
            <Drawer.Content placement="right">
                <Drawer.Dialog
                    data-search-overlay
                    className={cn(
                        "flex h-full w-full max-w-md flex-col gap-3 rounded-none p-3 sm:p-4",
                        className,
                    )}
                >
                    <div className="flex items-center gap-2">
                        <SearchOverlayInput
                            inputRef={inputRef}
                            value={rawQuery}
                            onValueChange={onValueChange}
                            placeholder={t("search.placeholder")}
                            ariaLabel={t("search.label")}
                            clearLabel={t("search.clearInput")}
                            isLoading={isLoading}
                            onKeyDown={onInputKeyDown}
                            listboxId={listboxId}
                            isExpanded={showResults}
                            activeDescendantId={activeRowId ? optionId(activeRowId) : undefined}
                            className="flex-1"
                        />
                        <Button
                            variant="tertiary"
                            size="sm"
                            className="shrink-0 sm:hidden"
                            onPress={closeOverlay}
                        >
                            {t("common.cancel")}
                        </Button>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto">{body}</div>
                    <SearchOverlayFooter onSeeAll={goToSearchPage} canSeeAll={Boolean(trimmedRaw)} />
                </Drawer.Dialog>
            </Drawer.Content>
        </Drawer.Backdrop>
    )
}
