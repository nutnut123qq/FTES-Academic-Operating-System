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
 * Search + sort/filter bar of the community page: keyword search (title/content across ALL published
 * posts), a time sort (newest default / oldest), and a post-type filter. Typing a keyword or choosing a
 * filter switches the feed into search mode (see {@link useQueryCommunitySearchSwr}); clearing returns
 * to the tab feed. Author filter is a fast-follow (BE `authorId` is wired; needs a user typeahead).
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
        <div className={cn("flex flex-col gap-3 px-4 py-3", className)}>
            <SearchInput
                value={query}
                onValueChange={onQueryChange}
                placeholder={t("search.placeholder")}
                variant="secondary"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
                {/* small 1-of-few selectors = SegmentedControl, never a pill-button row (ui rules) */}
                <SegmentedControl
                    ariaLabel={t("search.typeLabel")}
                    items={POST_TYPES.map((value) => ({
                        value,
                        label: value === "" ? t("search.types.all") : t(`search.types.${value}`),
                    }))}
                    value={postType}
                    onChange={onPostTypeChange}
                    className="w-fit"
                />
                <SegmentedControl<CommunitySearchSort>
                    ariaLabel={t("search.sortLabel")}
                    items={[
                        { value: CommunitySearchSort.Newest, label: t("search.sortNewest") },
                        { value: CommunitySearchSort.Oldest, label: t("search.sortOldest") },
                    ]}
                    value={sort}
                    onChange={onSortChange}
                    className="w-fit"
                />
            </div>
        </div>
    )
}
