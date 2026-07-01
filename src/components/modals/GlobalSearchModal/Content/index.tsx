"use client"
import { useTranslations } from "next-intl"
import React from "react"
import { GlobalSearchContentBlock } from "./Block"
import { GlobalSearchEmpty } from "./Empty"
import { ScrollShadow } from "@heroui/react"
import { useAppSelector } from "@/redux/hooks"
import type { AutocompleteGlobalSearchItem } from "@/modules/api/graphql/queries/types/autocomplete-global-search"

/** Entity bucket a pressed search item belongs to — drives how its href is built. */
type GlobalSearchKind = "course" | "module" | "content" | "challenge" | "flashcardDeck" | "milestone" | "milestoneTask"

/** One grouped, collapsible section of the results (header label + hit count + rows). */
interface GlobalSearchSection {
    /** Bucket kind — also the accordion item key and the `onItemPress` discriminator. */
    kind: GlobalSearchKind
    /** Translated section heading. */
    label: string
    /** Hits in this bucket (already deduped + parent-path enriched by the API). */
    items?: Array<AutocompleteGlobalSearchItem>
}

/**
 * Grouped command-palette results for global search, rendered as a FLAT grouped list: one
 * section per non-empty bucket (a `Label (count)` header + a React-Aria ListBox of rows).
 * No accordion — every hit is visible and keyboard-navigable (↑↓ within a list, ↵ to open).
 *
 * Each result carries a `path` (server-built deep-link); pressing a row navigates there.
 */
export const GlobalSearchContent = () => {
    const t = useTranslations()

    const courses = useAppSelector((state) => state.socketIo.globalSearchResults?.data?.courses)
    const modules = useAppSelector((state) => state.socketIo.globalSearchResults?.data?.modules)
    const challenges = useAppSelector((state) => state.socketIo.globalSearchResults?.data?.challenges)
    const contents = useAppSelector((state) => state.socketIo.globalSearchResults?.data?.contents)
    const flashcardDecks = useAppSelector((state) => state.socketIo.globalSearchResults?.data?.flashcardDecks)
    const milestones = useAppSelector((state) => state.socketIo.globalSearchResults?.data?.milestones)
    const milestoneTasks = useAppSelector((state) => state.socketIo.globalSearchResults?.data?.milestoneTasks)
    const query = useAppSelector((state) => state.search.query).trim()

    // One section per bucket, in display order; only non-empty buckets are shown.
    const allSections: Array<GlobalSearchSection> = [
        {
            kind: "course",
            label: t("search.suggestions.courses"),
            items: courses,
        },
        {
            kind: "module",
            label: t("search.suggestions.modules"),
            items: modules,
        },
        {
            kind: "content",
            label: t("search.suggestions.contents"),
            items: contents,
        },
        {
            kind: "challenge",
            label: t("search.suggestions.challenges"),
            items: challenges,
        },
        {
            kind: "flashcardDeck",
            label: t("search.suggestions.flashcards"),
            items: flashcardDecks,
        },
        {
            kind: "milestone",
            label: t("search.suggestions.milestones"),
            items: milestones,
        },
        {
            kind: "milestoneTask",
            label: t("search.suggestions.milestoneTasks"),
            items: milestoneTasks,
        },
    ]
    const sections = allSections.filter((section) => (section.items?.length ?? 0) > 0)

    return (
        <ScrollShadow hideScrollBar className="max-h-[320px] py-2">
            {sections.length === 0 ? (
                <GlobalSearchEmpty hasQuery={query.length > 0} />
            ) : (
                <div className="flex flex-col gap-3 px-2">
                    {sections.map((section) => (
                        <div key={section.kind} className="flex flex-col gap-1">
                            <div className="px-2 text-xs font-medium text-muted">
                                {`${section.label} (${section.items?.length ?? 0})`}
                            </div>
                            <GlobalSearchContentBlock items={section.items ?? []} />
                        </div>
                    ))}
                </div>
            )}
        </ScrollShadow>
    )
}
