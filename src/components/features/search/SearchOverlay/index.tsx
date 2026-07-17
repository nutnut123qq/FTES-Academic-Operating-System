"use client"

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { Kbd, Modal, Typography, cn } from "@heroui/react"
import { MagnifyingGlassIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useSearchOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setSearchQuery, clearSearchQuery } from "@/redux/slices/search"
import { useRecentSearches } from "@/hooks/reuseables/useRecentSearches"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useGlobalSearch } from "../hooks/useGlobalSearch"
import { usePopularSearchRows } from "../hooks/usePopularSearchRows"
import type { SearchRow } from "../types"
import { SearchOverlayInput } from "./SearchOverlayInput"
import { SearchOverlayResults } from "./SearchOverlayResults"
import { SearchPopular } from "./SearchPopular"
import { SearchRecentQueries } from "./SearchRecentQueries"
import { SearchOverlayFooter } from "./SearchOverlayFooter"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { ErrorContent } from "@/components/blocks/async/ErrorContent"

/**
 * The global command-palette search (Ctrl/Cmd+K or the navbar search trigger).
 *
 * A CENTERED, rounded modal popup (`rounded-2xl`, flush padding) — NOT a right
 * drawer and NOT an inline dropdown. Owns: the debounced real-entity search (via
 * {@link useGlobalSearch}), the idle "Popular" suggestions (via
 * {@link usePopularSearchRows}), keyboard navigation across the active row set
 * (↑↓ wrap · Enter open · Esc close), device-local recent searches, the aria
 * combobox pattern, and the state matrix (loading / error / empty / guest).
 * Selecting a row navigates DIRECTLY to the entity — no `/search` interstitial.
 * Mounted once in the shell modal container, driven by the `search` overlay key.
 */
export const SearchOverlay = ({ className }: WithClassNames<undefined>) => {
    const t = useTranslations()
    const router = useRouter()
    const dispatch = useAppDispatch()
    const { isOpen, setOpen, close } = useSearchOverlayState()
    const rawQuery = useAppSelector((state) => state.search.query)
    const { recent, add: addRecent, clear: clearRecent } = useRecentSearches()

    const {
        query: debouncedQuery,
        hasMinChars,
        groups,
        flatRows,
        isLoading,
        hasResults,
        error,
        retry,
    } = useGlobalSearch(false, 8)

    const popular = usePopularSearchRows()

    const [activeIndex, setActiveIndex] = useState(-1)
    const inputRef = useRef<HTMLInputElement>(null)
    const restoreFocusRef = useRef<HTMLElement | null>(null)
    const baseId = useId()
    const listboxId = `${baseId}-listbox`
    const optionId = useCallback((rowId: string) => `${baseId}-opt-${rowId}`, [baseId])

    const trimmedRaw = rawQuery.trim()
    const idle = !hasMinChars
    const showResults = hasMinChars && hasResults
    const showPopular = idle && popular.rows.length > 0

    // The single row set keyboard navigation + Enter operate over: popular rows while
    // idle, live results once a query is entered.
    const navRows = useMemo<Array<SearchRow>>(
        () => (idle ? popular.rows : flatRows),
        [idle, popular.rows, flatRows],
    )
    const activeRowId = activeIndex >= 0 && activeIndex < navRows.length ? navRows[activeIndex].id : null

    // Reset the active option whenever the navigable row set changes.
    useEffect(() => {
        setActiveIndex(-1)
    }, [navRows])

    // Focus the input on open; remember the previously focused element to restore on close.
    useEffect(() => {
        if (isOpen) {
            restoreFocusRef.current = document.activeElement as HTMLElement | null
            const timer = setTimeout(() => inputRef.current?.focus(), 0)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    // The Ctrl/Cmd+K shortcut is registered in exactly one place — the navbar container
    // (single source) — so the overlay does not register its own duplicate listener.

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
            // Only a real typed query is worth remembering; popular picks carry none.
            if (trimmedRaw) addRecent(trimmedRaw)
            closeOverlay()
            router.push(row.href)
        },
        [addRecent, trimmedRaw, closeOverlay, router],
    )

    const onInputKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Escape") {
                event.preventDefault()
                closeOverlay()
                return
            }
            if (navRows.length === 0) return
            if (event.key === "ArrowDown") {
                event.preventDefault()
                setActiveIndex((prev) => (prev + 1) % navRows.length)
            } else if (event.key === "ArrowUp") {
                event.preventDefault()
                setActiveIndex((prev) => (prev <= 0 ? navRows.length - 1 : prev - 1))
            } else if (event.key === "Enter") {
                event.preventDefault()
                // Open the active row, or the top hit when none is highlighted yet.
                const target = activeIndex >= 0 && activeIndex < navRows.length ? navRows[activeIndex] : navRows[0]
                activateRow(target)
            }
        },
        [navRows, activeIndex, activateRow, closeOverlay],
    )

    const onHoverRow = useCallback(
        (rowId: string) => {
            const index = navRows.findIndex((row) => row.id === rowId)
            if (index >= 0) setActiveIndex(index)
        },
        [navRows],
    )

    const body = useMemo(() => {
        if (idle) {
            if (!showPopular && recent.length === 0) {
                if (popular.isLoading) return null
                return (
                    <Typography type="body-sm" color="muted" className="px-2 py-6 text-center">
                        {t("search.idleHint")}
                    </Typography>
                )
            }
            return (
                <div className="flex flex-col gap-4">
                    {showPopular ? (
                        <SearchPopular
                            rows={popular.rows}
                            activeRowId={activeRowId}
                            optionId={optionId}
                            onActivate={activateRow}
                            onHover={onHoverRow}
                            listboxId={listboxId}
                        />
                    ) : null}
                    {recent.length > 0 ? (
                        <SearchRecentQueries
                            recent={recent}
                            onSelect={(item) => {
                                dispatch(setSearchQuery(item))
                                inputRef.current?.focus()
                            }}
                            onClear={clearRecent}
                        />
                    ) : null}
                </div>
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
        idle, showPopular, popular, recent, error, showResults, isLoading,
        groups, debouncedQuery, activeRowId, optionId, activateRow, onHoverRow, listboxId, retry, t,
        dispatch, clearRecent, trimmedRaw,
    ])

    return (
        <Modal isOpen={isOpen} onOpenChange={(next) => (next ? setOpen(true) : closeOverlay())}>
            <Modal.Backdrop>
                <Modal.Container size="lg" className="p-0">
                    <Modal.Dialog
                        data-search-overlay
                        className={cn("flex max-h-[80vh] flex-col overflow-hidden rounded-2xl p-0", className)}
                    >
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
                            isExpanded={showResults || showPopular}
                            activeDescendantId={activeRowId ? optionId(activeRowId) : undefined}
                            className="w-full rounded-none border-x-0 border-t-0 border-default bg-transparent px-4 py-3"
                            suffix={<Kbd><Kbd.Content>Esc</Kbd.Content></Kbd>}
                        />
                        <div className="min-h-0 flex-1 overflow-y-auto p-2">{body}</div>
                        <SearchOverlayFooter />
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
