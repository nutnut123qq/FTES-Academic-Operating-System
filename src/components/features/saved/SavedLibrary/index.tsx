"use client"

import React, { useMemo, useState } from "react"
import { Button, Chip, Skeleton, Tabs, Typography } from "@heroui/react"
import {
    BookmarkSimpleIcon,
    ChatCircleTextIcon,
    FileTextIcon,
    GraduationCapIcon,
    SignInIcon,
    SquaresFourIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link, useRouter } from "@/i18n/navigation"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { AuthenticationModalTab, setAuthenticationModalTab } from "@/redux/slices/tabs"
import { useAuthenticationOverlayState } from "@/hooks/zustand/overlay/hooks"
import {
    useHydrateSavedItems,
    useSavedItemsStore,
    type SavedEntityType,
    type SavedItem,
} from "@/hooks/zustand/savedItems"
import { SaveButton } from "@/components/blocks/buttons/SaveButton"
import { EmptyState } from "@/components/blocks/feedback/EmptyState"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import { useQueryResourceHubSwr } from "@/components/features/resource/hooks/useQueryResourceHubSwr"
import { useQueryCoursesSwr } from "@/components/features/course/hooks/useQueryCoursesSwr"
import { useQueryCommunityFeedSwr } from "@/components/features/community/hooks/useQueryCommunityFeedSwr"
import { useQueryGroupFeedSwr } from "@/components/features/group/hooks/useQueryGroupFeedSwr"
import { useQuerySubjectFeedSwr } from "@/components/features/subject/hooks/useQuerySubjectFeedSwr"

/** The type tabs: "all" + one per saveable entity type. */
type SavedTab = "all" | SavedEntityType

/** Tab order + icon per tab (icon+label tabs hide the label `<sm`). */
const TABS: Array<{ key: SavedTab; Icon: typeof SquaresFourIcon }> = [
    { key: "all", Icon: SquaresFourIcon },
    { key: "resource", Icon: FileTextIcon },
    { key: "course", Icon: GraduationCapIcon },
    { key: "post", Icon: ChatCircleTextIcon },
]

/** One resolved row: a saved entry joined against its mock dataset. */
interface SavedRow {
    entry: SavedItem
    /** Detail-page href (locale-relative, rendered via i18n Link). */
    href: string
    /** Primary display text (title; posts: content snippet). */
    title: string
    /** Secondary context line (resource subject/size; course name; post source). */
    context: string
    /** Post-only author name (avatar + name row). */
    author?: string
    /** Search haystack (title; posts add the author). */
    haystack: string
}

/**
 * The `/saved` library (save-for-later): the viewer's saved resources, courses
 * and posts, newest-saved first, with type tabs (Tất cả / Tài liệu / Khoá học /
 * Bài viết), case-insensitive search, unsave-in-place via the shared
 * {@link SaveButton}, per-tab empty states and a hydration skeleton mirroring
 * the row list. Guests get an inline sign-in prompt (no redirect loop).
 *
 * ponytail: saved ids join against the same mock datasets the hub/catalog/feeds
 * use; the group/subject feed mocks ignore their id args, so a single
 * representative call resolves any saved group/subject post. Unknown ids are
 * dropped silently. When BE lands, this list swaps to the generalized
 * `savedItems` query recorded in the store's TSDoc.
 */
export const SavedLibrary = () => {
    const t = useTranslations()
    const router = useRouter()
    const dispatch = useAppDispatch()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { open: openAuthentication } = useAuthenticationOverlayState()

    useHydrateSavedItems()
    const items = useSavedItemsStore((state) => state.items)
    const isHydrated = useSavedItemsStore((state) => state.isHydrated)

    const [tab, setTab] = useState<SavedTab>("all")
    const [query, setQuery] = useState("")

    // mock datasets the saved ids join against
    const { resources, isLoading: resourcesLoading } = useQueryResourceHubSwr()
    const { courses, isLoading: coursesLoading } = useQueryCoursesSwr()
    const { posts: communityPosts, isLoading: communityLoading } = useQueryCommunityFeedSwr()
    const { posts: groupPosts, isLoading: groupLoading } = useQueryGroupFeedSwr("saved-library")
    const { posts: subjectPosts, isLoading: subjectLoading } = useQuerySubjectFeedSwr("saved-library", "forYou")

    const isJoining =
        !isHydrated ||
        resourcesLoading ||
        coursesLoading ||
        communityLoading ||
        groupLoading ||
        subjectLoading

    /** Saved entries resolved against the datasets, newest-saved first. */
    const rows = useMemo<Array<SavedRow>>(() => {
        const resolve = (entry: SavedItem): SavedRow | null => {
            if (entry.entityType === "resource") {
                const resource = resources.find((item) => item.id === entry.entityId)
                if (!resource) return null
                return {
                    entry,
                    href: `/resources/${resource.id}`,
                    title: resource.title,
                    context: `${resource.subject} · ${resource.sizeLabel}`,
                    haystack: resource.title,
                }
            }
            if (entry.entityType === "course") {
                const course = courses.find((item) => item.id === entry.entityId)
                if (!course) return null
                return {
                    entry,
                    href: `/courses/${course.id}`,
                    title: `${course.code} · ${course.name}`,
                    context: t("courseSystem.catalog.lessonsCount", { count: course.lessons }),
                    haystack: `${course.code} ${course.name}`,
                }
            }
            // post: author/snippet resolve at render; source label comes from the entry
            const community = communityPosts.find((item) => item.id === entry.entityId)
            const group = groupPosts.find((item) => item.id === entry.entityId)
            const subject = subjectPosts.find((item) => item.id === entry.entityId)
            const post = community
                ? { author: community.author, snippet: `${community.title} — ${community.snippet}` }
                : group
                    ? { author: group.author, snippet: group.text }
                    : subject
                        ? { author: subject.author, snippet: `${subject.title} — ${subject.snippet}` }
                        : null
            if (!post) return null
            const sourceLabel =
                entry.source?.kind === "community" || !entry.source
                    ? t("savedItems.source.community")
                    : entry.source.label
            return {
                entry,
                href: `/community/${entry.entityId}`,
                title: post.snippet,
                context: sourceLabel,
                author: post.author,
                haystack: `${post.author} ${post.snippet}`,
            }
        }
        return [...items]
            .sort((a, b) => b.savedAt - a.savedAt)
            .map(resolve)
            .filter((row): row is SavedRow => row !== null)
    }, [items, resources, courses, communityPosts, groupPosts, subjectPosts, t])

    const tabRows = rows.filter((row) => tab === "all" || row.entry.entityType === tab)
    const trimmedQuery = query.trim().toLowerCase()
    const visibleRows = tabRows.filter(
        (row) => trimmedQuery === "" || row.haystack.toLowerCase().includes(trimmedQuery),
    )

    /** Gate: guests see the inline sign-in prompt instead of the library. */
    const onSignIn = () => {
        dispatch(setAuthenticationModalTab(AuthenticationModalTab.SignIn))
        openAuthentication()
    }

    /** Per-tab browse CTA target (resources / courses / community feed). */
    const onBrowse = () => {
        if (tab === "resource") {
            router.push("/resources")
            return
        }
        if (tab === "post") {
            router.push("/community")
            return
        }
        router.push("/courses")
    }

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
            <Typography type="h4" weight="bold">
                {t("savedItems.title")}
            </Typography>

            {!authenticated ? (
                <EmptyState
                    icon={<SignInIcon aria-hidden focusable="false" />}
                    title={t("savedItems.signInTitle")}
                    description={t("savedItems.signInHint")}
                    action={
                        <Button size="sm" variant="primary" onPress={onSignIn}>
                            {t("savedItems.signInCta")}
                        </Button>
                    }
                />
            ) : (
                <>
                    {/* type tabs — icon + label; the label hides `<sm` (aria-label keeps the name) */}
                    <ExtendedTabs selectedKey={tab} onSelectionChange={(key) => setTab(key as SavedTab)}>
                        <Tabs.ListContainer>
                            <Tabs.List aria-label={t("savedItems.title")}>
                                {TABS.map(({ key, Icon }) => (
                                    <Tabs.Tab key={key} id={key} aria-label={t(`savedItems.tabs.${key}`)}>
                                        <span className="flex items-center gap-2">
                                            <Icon aria-hidden focusable="false" className="size-4" />
                                            <span className="hidden sm:inline">{t(`savedItems.tabs.${key}`)}</span>
                                        </span>
                                    </Tabs.Tab>
                                ))}
                            </Tabs.List>
                        </Tabs.ListContainer>
                    </ExtendedTabs>

                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={t("savedItems.searchPlaceholder")}
                        aria-label={t("savedItems.searchPlaceholder")}
                        className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
                    />

                    {isJoining ? (
                        <SavedLibrarySkeleton />
                    ) : tabRows.length === 0 ? (
                        <EmptyState
                            icon={<BookmarkSimpleIcon aria-hidden focusable="false" />}
                            title={t(`savedItems.empty.${tab}.title`)}
                            description={t(`savedItems.empty.${tab}.hint`)}
                            action={
                                <Button size="sm" variant="secondary" onPress={onBrowse}>
                                    {t(`savedItems.empty.${tab}.cta`)}
                                </Button>
                            }
                        />
                    ) : visibleRows.length === 0 ? (
                        <EmptyState
                            icon={<BookmarkSimpleIcon aria-hidden focusable="false" />}
                            title={t("savedItems.noResults")}
                        />
                    ) : (
                        <div className="flex flex-col gap-3">
                            {visibleRows.map((row) => (
                                <SavedRowItem key={`${row.entry.entityType}:${row.entry.entityId}`} row={row} showType={tab === "all"} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

/** One saved row: link to the detail page + unsave-in-place bookmark. */
const SavedRowItem = ({ row, showType }: { row: SavedRow; showType: boolean }) => {
    const t = useTranslations()
    const { entry } = row

    return (
        <Link
            href={row.href}
            className="flex items-center gap-3 rounded-large border border-separator p-4 no-underline transition-colors hover:bg-default/40"
        >
            {entry.entityType === "post" && row.author ? (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                    {row.author.slice(0, 1).toUpperCase()}
                </div>
            ) : null}
            <div className="min-w-0 flex-1">
                {entry.entityType === "post" && row.author ? (
                    <Typography type="body-xs" weight="medium">
                        {row.author}
                    </Typography>
                ) : null}
                <Typography
                    type="body-sm"
                    weight="medium"
                    className={entry.entityType === "post" ? "line-clamp-2" : "truncate"}
                >
                    {row.title}
                </Typography>
                <Typography type="body-xs" color="muted" className="truncate">
                    {row.context}
                </Typography>
            </div>
            {showType ? (
                <Chip size="sm" variant="soft" color="accent">
                    {t(`savedItems.tabs.${entry.entityType}`)}
                </Chip>
            ) : null}
            <SaveButton
                entityType={entry.entityType}
                entityId={entry.entityId}
                source={entry.source}
            />
        </Link>
    )
}

/** Skeleton mirroring the saved row list (heading/tabs/search stay outside). */
const SavedLibrarySkeleton = () => (
    <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((rowIndex) => (
            <div
                key={rowIndex}
                className="flex items-center gap-3 rounded-large border border-separator p-4"
            >
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-2/3 rounded-full" />
                    <Skeleton className="h-3 w-1/3 rounded-full" />
                </div>
                <Skeleton className="size-8 rounded-large" />
            </div>
        ))}
    </div>
)
