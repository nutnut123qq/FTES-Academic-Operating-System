"use client"

import React, {
    useEffect,
    useRef,
} from "react"
import type {
    ReactNode,
} from "react"
import {
    Accordion,
    Button,
    Input,
    Label,
    ScrollShadow,
    TextField,
    Typography,
    cn,
} from "@heroui/react"
import {
    ArrowRightIcon,
} from "@phosphor-icons/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ContentMapRow } from "@/components/blocks/navigation/ContentMapRow"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"

/** One selectable row inside an {@link OutlineRailGroup}. */
export interface OutlineRailItem {
    /** Stable id (accordion item key / scroll target). */
    id: string
    /** Row title (the row's accessible name). */
    title: string
    /** Highlights the row as the one currently open (accent tint). */
    isActive: boolean
    /** Read / completed — green check, highest-priority marker. */
    isRead: boolean
    /** Locked — the viewer cannot open it yet. */
    isLocked?: boolean
    /** Premium / VIP — star (shown when not locked). */
    isPremium?: boolean
    /** Optional right-aligned meta (e.g. minutes, score). */
    meta?: ReactNode
    /** Fired when the row is pressed (navigation handled by the caller). */
    onPress: () => void
}

/** One collapsible group (module / milestone) of {@link OutlineRailItem}s. */
export interface OutlineRailGroup {
    /** Stable id used as the accordion key + expand state. */
    id: string
    /** Group title (truncated + native tooltip). */
    title: string
    /** Group progress — expanded → a `ProgressMeter`; collapsed → {@link collapsedCountLabel}. */
    progress: { done: number; total: number }
    /** Pre-formatted "n/m" label shown when the group is collapsed. */
    collapsedCountLabel: string
    /** Rows in the group. */
    items: Array<OutlineRailItem>
}

/** The rail header — the rail's progress + one primary action. */
export interface OutlineRailHeader {
    /** Label for the overall-progress row (e.g. "Tiến độ"). */
    label: ReactNode
    /** Overall progress driving the header meter. */
    progress: { done: number; total: number }
    /** Pre-formatted overall count (e.g. "2/12 bài"). */
    countLabel: ReactNode
    /** Optional primary "continue / resume" action. */
    continue?: { label: ReactNode; onPress: () => void }
}

/** Controlled search box state for the rail. */
export interface OutlineRailSearch {
    /** Current query. */
    value: string
    /** Query change handler. */
    onChange: (value: string) => void
    /** Placeholder text. */
    placeholder: string
    /** Accessible label. */
    ariaLabel: string
}

/** The `AsyncContent` wiring for the list region. */
export interface OutlineRailAsync {
    /** First-load gate. */
    isLoading: boolean
    /** Skeleton shown while loading. */
    skeleton: ReactNode
    /** Empty gate (no data at all). */
    isEmpty: boolean
    /** Empty-state title. */
    emptyTitle: string
    /** Error-state title. */
    errorTitle: string
    /** Error to surface (prefer stale data once loaded). */
    error?: unknown
    /** Retry handler. */
    onRetry: () => void
    /** Retry button label. */
    retryLabel: string
    /** Shown when a search filters everything out (groups present but empty). */
    noMatchLabel: string
}

/** Props for the {@link OutlineRail} block. */
export interface OutlineRailProps extends WithClassNames<undefined> {
    /** Progress header + continue action. Omit to hide the header (e.g. while loading). */
    header?: OutlineRailHeader
    /** Controlled search field. */
    search: OutlineRailSearch
    /** Ordered groups → rows. */
    groups: Array<OutlineRailGroup>
    /** Controlled expanded group ids. */
    expandedKeys: Set<string>
    /** Fires with the next expanded id set. */
    onExpandedChange: (keys: Set<string>) => void
    /** Async wiring for the list. */
    async: OutlineRailAsync
}

/**
 * The shared docs-style navigation rail (UI 2.0): a pinned progress header with a
 * single "continue" action, a client-side search field, then a scroll region of
 * collapsible groups → compact {@link ContentMapRow} rows. One progress bar at a
 * time — the open group shows a `ProgressMeter`, collapsed groups show a muted
 * "n/m" count.
 *
 * Props-only / fully controlled: the consuming feature owns the data, the search
 * value, the expanded-set (auto-open the active group, open matches on search),
 * and every string (i18n). Both the course content-map and the personal-project
 * milestone rail render through this one block, so they stay identical.
 *
 * Positioning (sticky / width / scroll height) is supplied by the caller via
 * `className`, so the same rail serves the desktop rail and the mobile drawer.
 *
 * @param props - {@link OutlineRailProps}
 */
export const OutlineRail = ({
    header,
    search,
    groups,
    expandedKeys,
    onExpandedChange,
    async,
    className,
}: OutlineRailProps) => {
    /** Active row — scrolled into view when it changes / the list hydrates. */
    const activeRowRef = useRef<HTMLDivElement>(null)
    const activeItemId = groups
        .flatMap((group) => group.items)
        .find((item) => item.isActive)?.id
    useEffect(() => {
        activeRowRef.current?.scrollIntoView({ block: "nearest" })
    }, [activeItemId])

    return (
        <div className={cn("relative flex min-h-0 min-w-0 flex-col gap-3 p-6", className)}>
            {/* progress header — the "continue" action floats at the bottom (see below) */}
            {header ? (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                        <Label>{header.label}</Label>
                        <Typography type="body-xs" color="muted">
                            {header.countLabel}
                        </Typography>
                    </div>
                    <ProgressMeter value={header.progress.done} max={header.progress.total} />
                </div>
            ) : null}

            {/* client-side search over the visible tree */}
            <TextField variant="secondary">
                <Input
                    aria-label={search.ariaLabel}
                    value={search.value}
                    onChange={(event) => search.onChange(event.target.value)}
                    placeholder={search.placeholder}
                />
            </TextField>

            {/* only the list scrolls — soft fade, header + search stay pinned. Extra bottom
                padding when the floating action is present so the last row clears it. */}
            <ScrollShadow hideScrollBar className={cn("-mx-1 min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-1", header?.continue && "pb-20")}>
                <AsyncContent
                    isLoading={async.isLoading}
                    skeleton={async.skeleton}
                    isEmpty={async.isEmpty}
                    emptyContent={{ title: async.emptyTitle }}
                    error={async.error}
                    errorContent={{
                        title: async.errorTitle,
                        onRetry: async.onRetry,
                        retryLabel: async.retryLabel,
                    }}
                >
                    {groups.length > 0 ? (
                        <Accordion
                            variant="default"
                            className="min-w-0 w-full"
                            expandedKeys={expandedKeys}
                            onExpandedChange={(keys) => onExpandedChange(new Set([...keys].map(String)))}
                        >
                            {groups.map((group) => {
                                const isExpanded = expandedKeys.has(group.id)
                                return (
                                    <Accordion.Item
                                        key={group.id}
                                        id={group.id}
                                        aria-label={group.title}
                                        className="min-w-0"
                                    >
                                        <Accordion.Heading className="min-w-0">
                                            <Accordion.Trigger className="min-w-0 w-full max-w-full px-0 py-2 hover:bg-transparent">
                                                {/* title owns the full width (truncate + tooltip); the count/bar
                                                    sits on its own line below so long titles aren't squeezed */}
                                                <div className="flex w-full min-w-0 items-center gap-2 overflow-hidden">
                                                    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                                                        <Typography
                                                            type="body"
                                                            weight="semibold"
                                                            truncate
                                                            title={group.title}
                                                            className="w-full min-w-0"
                                                        >
                                                            {group.title}
                                                        </Typography>
                                                        {isExpanded ? (
                                                            <ProgressMeter
                                                                value={group.progress.done}
                                                                max={group.progress.total || 1}
                                                            />
                                                        ) : (
                                                            <Typography type="body-xs" color="muted">
                                                                {group.collapsedCountLabel}
                                                            </Typography>
                                                        )}
                                                    </div>
                                                    <Accordion.Indicator className="shrink-0" />
                                                </div>
                                            </Accordion.Trigger>
                                        </Accordion.Heading>
                                        <Accordion.Panel>
                                            <Accordion.Body className="px-0 pb-3">
                                                <div className="flex flex-col gap-0">
                                                    {group.items.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            ref={item.isActive ? activeRowRef : undefined}
                                                        >
                                                            <ContentMapRow
                                                                title={item.title}
                                                                isActive={item.isActive}
                                                                isRead={item.isRead}
                                                                isLocked={item.isLocked}
                                                                isPremium={item.isPremium ?? false}
                                                                onPress={item.onPress}
                                                                meta={item.meta}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </Accordion.Body>
                                        </Accordion.Panel>
                                    </Accordion.Item>
                                )
                            })}
                        </Accordion>
                    ) : (
                        <Typography type="body-sm" color="muted" align="center">
                            {async.noMatchLabel}
                        </Typography>
                    )}
                </AsyncContent>
            </ScrollShadow>

            {/* the rail's one primary action — a frosted bottom bar so it stays reachable
                while the list scrolls behind it (was a static top button). The bar (px-6 py-3)
                is a click-through blur layer; only the full-width button catches the press. */}
            {header?.continue ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-background/80 px-6 py-3 backdrop-blur-md">
                    <Button
                        variant="primary"
                        size="lg"
                        onPress={header.continue.onPress}
                        className="pointer-events-auto w-full"
                    >
                        {header.continue.label}
                        <ArrowRightIcon aria-hidden focusable="false" className="size-5" />
                    </Button>
                </div>
            ) : null}
        </div>
    )
}

export default OutlineRail
