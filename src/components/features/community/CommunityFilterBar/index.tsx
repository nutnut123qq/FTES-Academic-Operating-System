"use client"

import { cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { SearchInput } from "@/components/reuseable/SearchInput"
import { SegmentedControl } from "@/components/blocks/navigation/SegmentedControl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { CommunitySearchSort } from "../hooks/useQueryCommunitySearchSwr"

/** Post-type filter values (BE `postType`; "" = any type). Order = display order. */
const POST_TYPES: Array<string> = ["", "DISCUSSION", "QUESTION", "PROJECT_SHOWCASE", "KNOWLEDGE_SHARING"]

/** Props for {@link CommunityFilterBar}. */
export interface CommunityFilterBarProps extends WithClassNames<undefined> {
    /** Current keyword (matches title + content across all published posts). */
    query: string
    onQueryChange: (query: string) => void
    /** Current time sort. */
    sort: CommunitySearchSort
    onSortChange: (sort: CommunitySearchSort) => void
    /** Current post-type filter ("" = any). */
    postType: string
    onPostTypeChange: (postType: string) => void
}

/**
 * Search + sort/filter cluster of the community page: keyword search (title/content across ALL
 * published posts), a time sort (newest default / oldest), and a post-type filter. Typing a keyword
 * or choosing a filter switches the feed into search mode (see {@link useQueryCommunitySearchSwr});
 * clearing returns to the tab feed. Author filter is a fast-follow (BE `authorId` is wired; needs a
 * user typeahead).
 *
 * Laid out as a VERTICAL panel so it drops cleanly into the feed-header search popover
 * ({@link import("../CommunityFeed").CommunityFeed}): the wide 5-segment post-type control scrolls
 * horizontally instead of overflowing the popover on a narrow (mobile) viewport, and the sort
 * control spans the panel width.
 *
 * @param props - {@link CommunityFilterBarProps}
 */
export const CommunityFilterBar = ({
    query,
    onQueryChange,
    sort,
    onSortChange,
    postType,
    onPostTypeChange,
    className,
}: CommunityFilterBarProps) => {
    const t = useTranslations("communityHub")

    return (
        <div className={cn("flex flex-col gap-3 p-3", className)}>
            <SearchInput
                value={query}
                onValueChange={onQueryChange}
                placeholder={t("search.placeholder")}
                variant="secondary"
                className="sm:max-w-none"
            />
            {/* small 1-of-few selectors = SegmentedControl, never a pill-button row (ui rules).
                The type control has 5 segments — wider than a phone-width popover — so it scrolls
                horizontally at its natural width (`w-max`) instead of squeezing/clipping. */}
            <div className="-mx-1 overflow-x-auto px-1">
                <SegmentedControl
                    ariaLabel={t("search.typeLabel")}
                    items={POST_TYPES.map((value) => ({
                        value,
                        label: value === "" ? t("search.types.all") : t(`search.types.${value}`),
                    }))}
                    value={postType}
                    onChange={onPostTypeChange}
                    className="w-max"
                />
            </div>
            <SegmentedControl<CommunitySearchSort>
                ariaLabel={t("search.sortLabel")}
                items={[
                    { value: CommunitySearchSort.Newest, label: t("search.sortNewest") },
                    { value: CommunitySearchSort.Oldest, label: t("search.sortOldest") },
                ]}
                value={sort}
                onChange={onSortChange}
                className="w-full"
            />
        </div>
    )
}
