import React from "react"
import { Chip, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { SEARCH_CATEGORY_MAP } from "../../map"
import type { SearchCategoryKind } from "../../types"

/** One tab descriptor: a category (or "all") + its current hit count. */
export interface SearchCategoryTab {
    /** The category kind, or `"all"` for the aggregate tab. */
    kind: SearchCategoryKind | "all"
    /** Number of hits for this category (aggregate for "all"). */
    count: number
}

/** Props for {@link SearchCategoryTabs}. */
export interface SearchCategoryTabsProps {
    /** Tabs to render (already ordered; zero-hit non-"all" tabs are disabled). */
    tabs: Array<SearchCategoryTab>
    /** The active tab. */
    active: SearchCategoryKind | "all"
    /** Select a tab. */
    onSelect: (kind: SearchCategoryKind | "all") => void
    /** Localized label for the "all" tab. */
    allLabel: string
    /** Resolve a localized label for a category kind. */
    labelFor: (kind: SearchCategoryKind) => string
}

/**
 * Category filter tabs for `/search` — "All" plus one tab per category with a hit
 * count badge. Zero-hit category tabs are disabled. Icon+label tabs hide the label
 * below `sm` (icon-only) while keeping an accessible name (`aria-label`). Pure block.
 */
export const SearchCategoryTabs = ({ tabs, active, onSelect, allLabel, labelFor }: SearchCategoryTabsProps) => {
    const t = useTranslations()
    return (
        <div role="tablist" aria-label={t("search.filtersAria")} className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
                const kind = tab.kind
                const label = kind === "all" ? allLabel : labelFor(kind)
                const Icon = kind === "all" ? null : SEARCH_CATEGORY_MAP[kind].icon
                const disabled = kind !== "all" && tab.count === 0
                const selected = active === kind
                return (
                    <button
                        key={tab.kind}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        aria-label={label}
                        disabled={disabled}
                        onClick={() => onSelect(tab.kind)}
                        className={cn(
                            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                            selected
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-default text-muted hover:bg-default",
                            disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
                        )}
                    >
                        {Icon ? <Icon className="size-4" aria-hidden focusable="false" /> : null}
                        <span className={cn(Icon ? "hidden sm:inline" : undefined)}>{label}</span>
                        <Chip size="sm" variant="secondary">
                            <Chip.Label>{tab.count}</Chip.Label>
                        </Chip>
                    </button>
                )
            })}
        </div>
    )
}
