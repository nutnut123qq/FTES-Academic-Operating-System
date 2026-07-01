"use client"

import { Magnifier as MagnifyingGlassIcon } from "@gravity-ui/icons"
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ComponentProps,
} from "react"
import { Input, TextField, cn } from "@heroui/react"
import { AnimatePresence, motion } from "framer-motion"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** One autocomplete suggestion shown in the dropdown. */
export interface SearchInputSuggestion {
    /** Stable id (used as the list key + select payload). */
    id: string
    /** Human-readable label shown in the dropdown row. */
    label: string
}

/** HeroUI {@link Input} surface variant accepted by {@link SearchInput}. */
type SearchInputVariant = NonNullable<ComponentProps<typeof Input>["variant"]>

/** Props for {@link SearchInput}. */
export interface SearchInputProps extends WithClassNames<undefined> {
    /** Current search query (controlled). */
    value: string
    /** Fired with the new query on every keystroke. */
    onValueChange: (value: string) => void
    /** Placeholder text; defaults to the generic search placeholder. */
    placeholder?: string
    /** HeroUI input surface variant; `secondary` uses a muted field background. */
    variant?: SearchInputVariant
    /**
     * Optional typeahead suggestions. When provided together with
     * {@link SearchInputProps.onSelectSuggestion}, a HeroUI-style listbox dropdown
     * renders under the field while it is focused and the query is non-empty. The
     * parent owns the data source (e.g. an Elasticsearch-backed query), so this
     * component stays generic and reusable for any case.
     */
    suggestions?: Array<SearchInputSuggestion>
    /** Fired with the chosen suggestion; enables the dropdown when set. */
    onSelectSuggestion?: (suggestion: SearchInputSuggestion) => void
}

/**
 * Generic, reusable search input with an optional autocomplete dropdown.
 *
 * Presentational + controlled: the parent owns the value and (optionally) the
 * suggestion list. With suggestions + {@link SearchInputProps.onSelectSuggestion}
 * it behaves as a typeahead — a HeroUI-grade animated listbox with full keyboard
 * navigation (↑/↓ to move, Enter to choose, Esc to dismiss). Without them it is a
 * plain search field. Debouncing is the caller's concern, keeping this reusable.
 */
export const SearchInput = ({
    value,
    onValueChange,
    placeholder,
    className,
    variant,
    suggestions,
    onSelectSuggestion,
}: SearchInputProps) => {
    const t = useTranslations()
    // fall back to the generic search placeholder when the caller does not pass one
    const resolvedPlaceholder = placeholder ?? t("search.placeholder")
    // track focus so the dropdown only shows while the field is active
    const [focused, setFocused] = useState(false)
    // index of the keyboard-highlighted row (-1 = none highlighted yet)
    const [activeIndex, setActiveIndex] = useState(-1)

    // the dropdown is only available when the caller opted into suggestions
    const hasSuggestions = typeof onSelectSuggestion === "function"
    const items = suggestions ?? []
    const open = hasSuggestions
        && focused
        && value.trim().length > 0
        && items.length > 0

    // reset the keyboard highlight whenever the dropdown closes or the list changes,
    // so a fresh open always starts with nothing pre-selected (Google/HeroUI behavior)
    useEffect(() => {
        setActiveIndex(-1)
    }, [open, items.length, value])

    // commit a suggestion + drop the keyboard highlight
    const selectAt = useCallback(
        (index: number) => {
            const suggestion = items[index]
            if (suggestion && onSelectSuggestion) {
                onSelectSuggestion(suggestion)
                setActiveIndex(-1)
            }
        },
        [items, onSelectSuggestion],
    )

    // arrow keys move the highlight; Enter chooses it; Escape dismisses the list
    const onKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (!open) {
                return
            }
            switch (event.key) {
            case "ArrowDown":
                // move down, wrapping back to the top past the last row
                event.preventDefault()
                setActiveIndex((prev) => (prev + 1) % items.length)
                break
            case "ArrowUp":
                // move up, wrapping to the bottom before the first row
                event.preventDefault()
                setActiveIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1))
                break
            case "Enter":
                // only intercept Enter when a row is highlighted, else let the form submit/search run
                if (activeIndex >= 0) {
                    event.preventDefault()
                    selectAt(activeIndex)
                }
                break
            case "Escape":
                // close the dropdown without losing what was typed
                event.preventDefault()
                setFocused(false)
                break
            default:
                break
            }
        },
        [open, items.length, activeIndex, selectAt],
    )

    return (
        <div className={cn("relative w-full sm:max-w-sm", className)}>
            <TextField aria-label={resolvedPlaceholder} className="w-full">
                <div className="relative">
                    <MagnifyingGlassIcon className="text-muted pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
                    <Input
                        type="search"
                        variant={variant}
                        placeholder={resolvedPlaceholder}
                        className="pl-9 w-full"
                        value={value}
                        onChange={(event) => onValueChange(event.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        onKeyDown={onKeyDown}
                    />
                </div>
            </TextField>
            <AnimatePresence>
                {open ? (
                    <motion.ul
                        // HeroUI-style popover surface: rounded, bordered, elevated, padded.
                        // `bg-surface` is the opaque surface token (bg-content1 is translucent
                        // in this theme, which let the cards bleed through the dropdown).
                        className="bg-surface border-divider/60 absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border p-1.5 shadow-xl"
                        // subtle pop-in / pop-out, matching HeroUI popover motion
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.14, ease: "easeOut" }}
                    >
                        {items.map((suggestion, index) => (
                            <SearchInputSuggestionRow
                                key={suggestion.id}
                                suggestion={suggestion}
                                query={value}
                                active={index === activeIndex}
                                onHover={() => setActiveIndex(index)}
                                onSelect={() => selectAt(index)}
                            />
                        ))}
                    </motion.ul>
                ) : null}
            </AnimatePresence>
        </div>
    )
}

/** Props for {@link SearchInputSuggestionRow}. */
interface SearchInputSuggestionRowProps {
    /** The suggestion this row represents. */
    suggestion: SearchInputSuggestion
    /** The current query, used to bold the matching part. */
    query: string
    /** Whether this row is the keyboard-highlighted one. */
    active: boolean
    /** Fired when the pointer enters the row (syncs the keyboard highlight). */
    onHover: () => void
    /** Fired with this suggestion when the row is chosen. */
    onSelect: () => void
}

/**
 * One dropdown row, styled as a HeroUI listbox item (rounded, hover/active fill).
 * Uses `onMouseDown` (which fires before the input's `blur`) so the selection is
 * registered before the dropdown closes.
 *
 * @param props - {@link SearchInputSuggestionRowProps}
 */
const SearchInputSuggestionRow = ({
    suggestion,
    query,
    active,
    onHover,
    onSelect,
}: SearchInputSuggestionRowProps) => {
    const rowRef = useRef<HTMLButtonElement>(null)

    // keep the keyboard-highlighted row scrolled into view as it moves
    useEffect(() => {
        if (active) {
            rowRef.current?.scrollIntoView({ block: "nearest" })
        }
    }, [active])

    // split the label around the (case-insensitive) typed text to bold the match
    const segments = useMemo(() => {
        const normalized = query.trim().toLowerCase()
        const index = normalized.length > 0
            ? suggestion.label.toLowerCase().indexOf(normalized)
            : -1
        if (index < 0) {
            return {
                before: suggestion.label,
                match: "",
                after: "",
            }
        }
        return {
            before: suggestion.label.slice(0, index),
            match: suggestion.label.slice(index, index + normalized.length),
            after: suggestion.label.slice(index + normalized.length),
        }
    }, [suggestion.label, query])

    // mousedown (not click) so it runs before the input blur closes the dropdown
    const onMouseDown = useCallback(
        (event: React.MouseEvent) => {
            event.preventDefault()
            onSelect()
        },
        [onSelect],
    )

    return (
        <li>
            <button
                ref={rowRef}
                type="button"
                className={cn(
                    "flex w-full items-center gap-1.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                    // hover + keyboard-active share the same soft accent fill (HeroUI listbox feel)
                    active ? "bg-accent/10" : "hover:bg-accent/10",
                )}
                onMouseDown={onMouseDown}
                onMouseEnter={onHover}
            >
                <MagnifyingGlassIcon className="text-muted h-5 w-5 shrink-0" />
                {/* Google-style: the typed part stays light, the completion is bold.
                    `min-w-0 flex-1` lets the span shrink inside the flex row so a long
                    label truncates with an ellipsis instead of overflowing the dropdown. */}
                <span className="min-w-0 flex-1 truncate">
                    <span className="font-semibold">{segments.before}</span>
                    <span className="text-muted font-normal">{segments.match}</span>
                    <span className="font-semibold">{segments.after}</span>
                </span>
            </button>
        </li>
    )
}
