"use client"

import React, {
    useMemo,
    useState,
} from "react"
import {
    Input,
    Label,
    ListBox,
    ScrollShadow,
    TextField,
    Typography,
    cn,
} from "@heroui/react"
import {
    ListChecksIcon,
    TrophyIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { CODING_DOMAIN_ORDER } from "@/modules/api/graphql/queries/types/coding"
import { usePracticeView } from "../hooks/usePracticeView"
import { usePracticeFilters } from "../hooks/usePracticeFilters"
import type { DomainFilter } from "../types"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link PracticeRail}. */
export type PracticeRailProps = WithClassNames<undefined>

/**
 * The practice LEFT RAIL — the same docs-style sidebar as the flashcards /
 * content-map rail (a pinned header over a scroll region, full rail height). A
 * mode switch (Problems / Leaderboard) above the course-domain topics as a
 * searchable nav list. The mode drives the URL view ({@link usePracticeView}); the
 * chosen topic drives the catalog domain filter ({@link usePracticeFilters}), so
 * the rail and the work pane share one source of truth. Topics show only in
 * Problems mode (the leaderboard is topic-agnostic). Placed in the rail column by
 * the page shell; reads/writes URL state directly (no data props).
 *
 * @param props - {@link PracticeRailProps}
 */
export const PracticeRail = ({ className }: PracticeRailProps) => {
    const t = useTranslations()
    const { view, setView } = usePracticeView()
    const { filters, setFilters } = usePracticeFilters()
    const [query, setQuery] = useState("")

    /** Resolve a topic's display label ("Tất cả chủ đề" or a domain name). */
    const topicLabel = (domain: DomainFilter): string =>
        domain === "all"
            ? t("practice.filters.allDomains")
            : t(`codingPractice.domain.${domain}`)

    // the topic rows: "all" + the canonical domain order, narrowed by the search box
    const topics = useMemo<Array<DomainFilter>>(() => {
        const all: Array<DomainFilter> = ["all", ...CODING_DOMAIN_ORDER]
        const normalized = query.trim().toLowerCase()
        if (!normalized) {
            return all
        }
        return all.filter((domain) => topicLabel(domain).toLowerCase().includes(normalized))
    }, [query, t])

    return (
        <div className={cn("relative flex min-h-0 min-w-0 flex-col gap-3 p-6", className)}>
            {/* pinned header: mode switch + topic search */}
            <div className="flex flex-col gap-3">
                <ListBox
                    aria-label={t("practice.rail.modeAria")}
                    selectionMode="single"
                    disallowEmptySelection
                    selectedKeys={[view]}
                    onSelectionChange={(keys) => {
                        // controlled single-select → switch the view from the chosen key
                        const key = [...keys][0]
                        if (key === "problems" || key === "leaderboard") {
                            setView(key)
                        }
                    }}
                    className="gap-1 p-0"
                >
                    <ListBox.Item
                        id="problems"
                        textValue={t("practice.tabs.problems")}
                        className="cursor-pointer rounded-2xl px-3 py-2 data-[hovered=true]:bg-default-100 data-[selected=true]:bg-accent/10"
                    >
                        <span className="flex items-center gap-2">
                            <ListChecksIcon className="size-4 shrink-0" aria-hidden focusable="false" />
                            <Typography type="body-sm" weight="medium">
                                {t("practice.tabs.problems")}
                            </Typography>
                        </span>
                    </ListBox.Item>
                    <ListBox.Item
                        id="leaderboard"
                        textValue={t("practice.tabs.leaderboard")}
                        className="cursor-pointer rounded-2xl px-3 py-2 data-[hovered=true]:bg-default-100 data-[selected=true]:bg-accent/10"
                    >
                        <span className="flex items-center gap-2">
                            <TrophyIcon className="size-4 shrink-0" aria-hidden focusable="false" />
                            <Typography type="body-sm" weight="medium">
                                {t("practice.tabs.leaderboard")}
                            </Typography>
                        </span>
                    </ListBox.Item>
                </ListBox>

                {/* topic search — problems mode only (the leaderboard is topic-agnostic) */}
                {view === "problems" ? (
                    <div className="flex flex-col gap-2">
                        <Label className="px-1 text-xs text-muted">{t("practice.rail.topicsLabel")}</Label>
                        <TextField>
                            <Input
                                type="search"
                                aria-label={t("practice.rail.searchTopic")}
                                placeholder={t("practice.rail.searchTopic")}
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                            />
                        </TextField>
                    </div>
                ) : null}
            </div>

            {/* scroll region: the topic nav list (problems mode only) */}
            {view === "problems" ? (
                <ScrollShadow
                    hideScrollBar
                    className="-mx-1 min-h-0 min-w-0 flex-1 overflow-y-auto px-1"
                >
                    {topics.length === 0 ? (
                        <Typography type="body-sm" color="muted" className="px-3 py-2">
                            {t("practice.rail.searchTopicEmpty", { query: query.trim() })}
                        </Typography>
                    ) : (
                        <ListBox
                            aria-label={t("practice.rail.topicsAria")}
                            selectionMode="single"
                            disallowEmptySelection
                            selectedKeys={[filters.domain]}
                            onSelectionChange={(keys) => {
                                // controlled single-select → filter the catalog by the chosen topic
                                const key = [...keys][0]
                                if (typeof key === "string") {
                                    setFilters({ domain: key as DomainFilter })
                                }
                            }}
                            className="gap-1 p-0"
                        >
                            {topics.map((domain) => (
                                <ListBox.Item
                                    key={domain}
                                    id={domain}
                                    textValue={topicLabel(domain)}
                                    className="cursor-pointer rounded-2xl px-3 py-2 data-[hovered=true]:bg-default-100 data-[selected=true]:bg-accent/10"
                                >
                                    <Typography type="body-sm" className="min-w-0 flex-1 truncate">
                                        {topicLabel(domain)}
                                    </Typography>
                                </ListBox.Item>
                            ))}
                        </ListBox>
                    )}
                </ScrollShadow>
            ) : null}
        </div>
    )
}
