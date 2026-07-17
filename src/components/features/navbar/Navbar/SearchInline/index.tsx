"use client"

import React, { useCallback, useEffect, useId, useRef, useState } from "react"
import { Kbd, cn } from "@heroui/react"
import { useTranslations, useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { pathConfig } from "@/resources/path"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setSearchQuery } from "@/redux/slices/search"
import { useAuthenticationOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useRecentSearches } from "@/hooks/reuseables/useRecentSearches"
import { useGlobalSearch, SEARCH_MIN_CHARS } from "@/components/features/search/hooks/useGlobalSearch"
import { SearchOverlayInput } from "@/components/features/search/SearchOverlay/SearchOverlayInput"
import type { SearchRow } from "@/components/features/search/types"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { SearchDropdown } from "./SearchDropdown"

/** Props for {@link SearchInline}. */
export interface SearchInlineProps extends WithClassNames<undefined> {
    /**
     * Optional external ref to the underlying `<input>` so the navbar's single
     * Ctrl/Cmd+K handler can focus the field on desktop.
     */
    inputRef?: React.RefObject<HTMLInputElement | null>
}

/**
 * Desktop inline navbar search — a REAL search field (replacing the press-to-open
 * {@link import("../SearchButton").SearchButton} trigger) that the user types into
 * directly. When focused with a query that meets the minimum length, a results
 * dropdown opens anchored below the field, reusing the shared debounced search state
 * ({@link useGlobalSearch}) and the overlay's grouped results. Implements the WAI-ARIA
 * combobox pattern: ArrowUp/ArrowDown move the active option (wrapping), Enter
 * activates it (or hands off to `/search` when none is active), Esc closes the
 * dropdown while keeping the field focused + its text, and outside interaction /
 * result activation dismiss it. `"use client"` for Redux, routing, and keyboard state.
 *
 * Mounted only on `md`+ viewports (the navbar hides it below `md`, where the
 * full-screen overlay remains the search surface).
 * @param props - optional placement class + external input ref for the Ctrl+K handoff.
 */
export const SearchInline = ({ className, inputRef: externalRef }: SearchInlineProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const dispatch = useAppDispatch()
    const { open: openAuth } = useAuthenticationOverlayState()
    const { add: addRecent } = useRecentSearches()

    const rawQuery = useAppSelector((state) => state.search.query)
    const trimmed = rawQuery.trim()
    const hasMinChars = trimmed.length >= SEARCH_MIN_CHARS

    const [focused, setFocused] = useState(false)
    // Esc dismisses the dropdown while keeping the field focused + its text; the next
    // keystroke (onValueChange) reopens it.
    const [dismissed, setDismissed] = useState(false)
    const [activeIndex, setActiveIndex] = useState(-1)

    const wrapperRef = useRef<HTMLDivElement>(null)
    const internalRef = useRef<HTMLInputElement>(null)
    const inputRef = externalRef ?? internalRef

    const baseId = useId()
    const listboxId = `${baseId}-listbox`
    const optionId = useCallback((rowId: string) => `${baseId}-opt-${rowId}`, [baseId])

    const dropdownOpen = focused && hasMinChars && !dismissed

    const {
        query: debouncedQuery,
        authenticated,
        groups,
        flatRows,
        isLoading,
        hasResults,
        error,
        retry,
    } = useGlobalSearch(dropdownOpen, 8)

    const activeRowId = activeIndex >= 0 && activeIndex < flatRows.length ? flatRows[activeIndex].id : null

    // Reset the active option whenever the result set changes.
    useEffect(() => {
        setActiveIndex(-1)
    }, [flatRows])

    // Outside interaction dismisses the dropdown (without clearing the query). Uses
    // pointerdown so a click that lands OUTSIDE closes before it takes effect; clicks
    // on a result row land INSIDE the wrapper and are left for the row's own handler.
    useEffect(() => {
        if (!focused) return
        const onPointerDown = (event: PointerEvent) => {
            const node = wrapperRef.current
            if (node && !node.contains(event.target as Node)) {
                setFocused(false)
            }
        }
        document.addEventListener("pointerdown", onPointerDown)
        return () => document.removeEventListener("pointerdown", onPointerDown)
    }, [focused])

    const onValueChange = useCallback(
        (next: string) => {
            dispatch(setSearchQuery(next))
            // Any keystroke reopens a dropdown the user closed with Esc.
            setDismissed(false)
        },
        [dispatch],
    )

    const closeDropdown = useCallback(() => {
        setFocused(false)
        inputRef.current?.blur()
    }, [inputRef])

    const activateRow = useCallback(
        (row: SearchRow) => {
            if (!row.href) return
            addRecent(trimmed)
            closeDropdown()
            router.push(row.href)
        },
        [addRecent, trimmed, closeDropdown, router],
    )

    const goToSearchPage = useCallback(() => {
        if (!trimmed) return
        addRecent(trimmed)
        const base = pathConfig().locale(locale).search().build()
        closeDropdown()
        router.push(`${base}?q=${encodeURIComponent(trimmed)}`)
    }, [trimmed, addRecent, locale, closeDropdown, router])

    const onInputKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Escape") {
                if (!dropdownOpen) return
                event.preventDefault()
                // Keep focus + text; only dismiss the dropdown.
                setDismissed(true)
                return
            }
            if (!dropdownOpen) return
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
        [dropdownOpen, flatRows, activeIndex, activateRow, goToSearchPage],
    )

    const onHoverRow = useCallback(
        (rowId: string) => {
            const index = flatRows.findIndex((row) => row.id === rowId)
            if (index >= 0) setActiveIndex(index)
        },
        [flatRows],
    )

    // Close only on a real focus move OUT of the field/dropdown (Tab-away). Clicking a
    // non-focusable result row does NOT blur the input, so activation is never lost.
    const onInputBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
        const next = event.relatedTarget as Node | null
        const node = wrapperRef.current
        if (next && node && node.contains(next)) return
        if (next) setFocused(false)
    }, [])

    return (
        <div
            ref={wrapperRef}
            className={cn(
                "relative hidden md:block",
                focused ? "w-[340px]" : "w-[260px]",
                "transition-[width] duration-200",
                className,
            )}
        >
            <SearchOverlayInput
                inputRef={inputRef}
                value={rawQuery}
                onValueChange={onValueChange}
                placeholder={t("search.label")}
                ariaLabel={t("search.label")}
                clearLabel={t("search.clearInput")}
                isLoading={dropdownOpen && isLoading}
                onKeyDown={onInputKeyDown}
                onFocus={() => {
                    setFocused(true)
                    // Re-entering the field after an Esc-dismiss (then clicking away)
                    // must reopen the dropdown; a fresh focus from outside clears the
                    // stale dismissal. The Esc-keeps-focus path fires no focus event.
                    setDismissed(false)
                }}
                onBlur={onInputBlur}
                listboxId={listboxId}
                isExpanded={dropdownOpen}
                activeDescendantId={activeRowId ? optionId(activeRowId) : undefined}
                suffix={
                    !focused && !rawQuery ? (
                        <>
                            <Kbd><Kbd.Content>Ctrl</Kbd.Content></Kbd>
                            <Kbd><Kbd.Content>K</Kbd.Content></Kbd>
                        </>
                    ) : undefined
                }
            />
            {dropdownOpen ? (
                <SearchDropdown
                    groups={groups}
                    query={debouncedQuery}
                    trimmedQuery={trimmed}
                    authenticated={authenticated}
                    hasMinChars={hasMinChars}
                    isLoading={isLoading}
                    hasResults={hasResults}
                    error={error}
                    activeRowId={activeRowId}
                    optionId={optionId}
                    listboxId={listboxId}
                    onActivate={activateRow}
                    onHover={onHoverRow}
                    onRetry={retry}
                    onSignIn={() => openAuth("auth.context.search")}
                    onSeeAll={goToSearchPage}
                />
            ) : null}
        </div>
    )
}
