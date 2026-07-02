"use client"

import React, { useState } from "react"
import { Typography } from "@heroui/react"
import {
    MagnifyingGlassIcon,
    UserIcon,
    BookOpenIcon,
    GraduationCapIcon,
    FileIcon,
    ChatCircleIcon,
    type Icon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useQuerySearchSwr, type SearchHit, type SearchResultGroups } from "../hooks/useQuerySearchSwr"

/** Category → its group key, icon, and where each row links. */
const CATEGORIES: Array<{
    key: keyof SearchResultGroups
    icon: Icon
    href: string
}> = [
    { key: "users", icon: UserIcon, href: "/profile" },
    { key: "subjects", icon: BookOpenIcon, href: "/subjects" },
    { key: "courses", icon: GraduationCapIcon, href: "/courses" },
    { key: "resources", icon: FileIcon, href: "/resources" },
    { key: "posts", icon: ChatCircleIcon, href: "/community" },
]

/** One result row: icon + title + subtitle, linking into the relevant domain. */
const ResultRow = ({ hit, icon: RowIcon, href }: { hit: SearchHit; icon: Icon; href: string }) => (
    <Link
        href={href}
        className="flex items-center gap-3 rounded-large border border-separator p-3 no-underline transition-colors hover:bg-default/40"
    >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent">
            <RowIcon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0">
            <Typography type="body-sm" weight="medium" truncate>
                {hit.title}
            </Typography>
            <Typography type="body-xs" color="muted" className="truncate">
                {hit.subtitle}
            </Typography>
        </div>
    </Link>
)

/**
 * Global search results (§16 Search Platform) — the `/search` page. A single search
 * input (controlled) drives a mock grouped query; results render as one section per
 * category (users / subjects / courses / resources / posts), each row linking into the
 * relevant domain. Empty state before typing, no-results state when nothing matches.
 * Feature owns data (mock) + input state; tokens own the look.
 * ponytail: plain search input + hand-rolled rows, mock data.
 */
export const SearchResults = () => {
    const t = useTranslations("searchPage")
    const [query, setQuery] = useState("")
    const { groups } = useQuerySearchSwr(query)

    const trimmed = query.trim()
    const hasQuery = trimmed !== ""
    const hasResults = CATEGORIES.some((category) => groups[category.key].length > 0)

    return (
        <div className="mx-auto max-w-3xl p-6">
            <div className="flex flex-col gap-1">
                <Typography type="h4" weight="bold">
                    {t("title")}
                </Typography>
            </div>

            {/* search input */}
            <div className="relative mt-4">
                <MagnifyingGlassIcon
                    className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted"
                    aria-hidden
                />
                <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("placeholder")}
                    aria-label={t("placeholder")}
                    className="w-full rounded-large border border-separator bg-transparent py-2 pl-11 pr-4 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
                />
            </div>

            {/* results */}
            <div className="mt-6 flex flex-col gap-6">
                {!hasQuery ? (
                    <Typography type="body-sm" color="muted">
                        {t("empty")}
                    </Typography>
                ) : !hasResults ? (
                    <Typography type="body-sm" color="muted">
                        {t("noResults")}
                    </Typography>
                ) : (
                    CATEGORIES.map((category) => {
                        const hits = groups[category.key]
                        if (hits.length === 0) return null
                        return (
                            <section key={category.key} className="flex flex-col gap-3">
                                <Typography type="body-sm" weight="bold" color="muted">
                                    {t(`groups.${category.key}`)}
                                </Typography>
                                <div className="flex flex-col gap-2">
                                    {hits.map((hit) => (
                                        <ResultRow
                                            key={hit.id}
                                            hit={hit}
                                            icon={category.icon}
                                            href={category.href}
                                        />
                                    ))}
                                </div>
                            </section>
                        )
                    })
                )}
            </div>
        </div>
    )
}
