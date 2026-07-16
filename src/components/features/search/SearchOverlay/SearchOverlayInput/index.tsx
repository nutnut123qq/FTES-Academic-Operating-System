import React from "react"
import { Spinner, cn } from "@heroui/react"
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SearchOverlayInput}. */
export interface SearchOverlayInputProps extends WithClassNames<undefined> {
    /** The controlled query value. */
    value: string
    /** Change handler (writes Redux query upstream). */
    onValueChange: (next: string) => void
    /** Placeholder text (localized). */
    placeholder: string
    /** Show the loading spinner while a fetch is in flight. */
    isLoading?: boolean
    /** Keydown handler for arrow/enter navigation. */
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
    /** aria: id of the results listbox. */
    listboxId?: string
    /** aria: whether the listbox is expanded. */
    isExpanded?: boolean
    /** aria: id of the active descendant option. */
    activeDescendantId?: string
    /** aria label (localized). */
    ariaLabel: string
    /** Clear-input action label (localized). */
    clearLabel: string
    /** Ref to focus the input on open. */
    inputRef?: React.Ref<HTMLInputElement>
    /** Optional trailing content shown before the spinner/clear (e.g. a Ctrl+K hint). */
    suffix?: React.ReactNode
    /** Fired when the input gains focus. */
    onFocus?: () => void
    /** Fired when the input loses focus. */
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
}

/**
 * The command-palette search box — a flat `<input>` inside a bounded box that owns
 * the border + `focus-within` ring (composer-in-box exception to the HeroUI-Input
 * rule: the input must merge into one box with the leading icon, spinner, and clear
 * affordance). Implements the aria `combobox` input.
 */
export const SearchOverlayInput = ({
    value,
    onValueChange,
    placeholder,
    isLoading = false,
    onKeyDown,
    listboxId,
    isExpanded = false,
    activeDescendantId,
    ariaLabel,
    clearLabel,
    inputRef,
    suffix,
    onFocus,
    onBlur,
    className,
}: SearchOverlayInputProps) => (
    <div
        className={cn(
            "flex items-center gap-2 rounded-large border border-default bg-surface px-3 py-2 focus-within:border-accent",
            className,
        )}
    >
        <MagnifyingGlassIcon className="size-5 shrink-0 text-muted" aria-hidden focusable="false" />
        <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={isExpanded}
            aria-controls={listboxId}
            aria-activedescendant={activeDescendantId}
            aria-autocomplete="list"
            aria-label={ariaLabel}
            autoComplete="off"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
        />
        {suffix ? <span className="flex shrink-0 items-center gap-1">{suffix}</span> : null}
        {isLoading ? <Spinner className="size-4 shrink-0" aria-hidden /> : null}
        {value ? (
            <button
                type="button"
                aria-label={clearLabel}
                onClick={() => onValueChange("")}
                className="shrink-0 rounded-full p-1 text-muted transition-colors hover:bg-default hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
                <XIcon className="size-4" aria-hidden focusable="false" />
            </button>
        ) : null}
    </div>
)
