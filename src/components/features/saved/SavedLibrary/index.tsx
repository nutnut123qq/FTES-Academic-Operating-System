"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Button, Chip, Skeleton, Tabs, Typography } from "@heroui/react"
import {
    BookmarkSimpleIcon,
    ChatCircleTextIcon,
    FileTextIcon,
    GraduationCapIcon,
    SquaresFourIcon,
} from "@phosphor-icons/react"
import { FtesMascot } from "@/components/reuseable/FtesMascot"
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
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { SearchInput } from "@/components/reuseable/SearchInput"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import { useQueryResourceHubSwr } from "@/components/features/resource/hooks/useQueryResourceHubSwr"
import { useQueryCoursesSwr } from "@/components/features/course/hooks/useQueryCoursesSwr"
import { displayCourseCode } from "@/components/features/course/courseCode"
import {
    useQueryBookmarkedPostsSwr,
    type SavedPost,
} from "@/components/features/community/hooks/useQueryBookmarkedPostsSwr"

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
 * Data sources: saved resource/course ids join against the same mock datasets the
 * hub/catalog use; saved POSTS hydrate from the caller's REAL backend bookmarks
 * (`GET /api/v1/community/bookmarks/posts`, via {@link useQueryBookmarkedPostsSwr}) —
 * NOT by re-fetching a group/subject feed. The old join called the group/subject feed
 * with a placeholder id `"saved-library"`, which the BE forced to `UUID` → 400; the real
 * bookmark endpoint returns the viewer's saved posts already author-enriched.
 *
 * The saved-POST SET is driven by that SERVER list, not by localStorage: on load the
 * server bookmarks are reconciled into the `savedItems` store (additive merge), so a
 * post bookmarked on another device / after a storage clear still appears (previously it
 * was silently dropped because the store — client-only — never had its id). The
 * newest-first order + the "source" line still come from each store entry (server-merged
 * entries default their source to "Cộng đồng"). Resource/course sets stay on the store.
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
    const mergeSavedPosts = useSavedItemsStore((state) => state.mergeSavedPosts)

    const [tab, setTab] = useState<SavedTab>("all")
    const [query, setQuery] = useState("")

    // resource/course display data joins against the hub/catalog mock datasets;
    // saved POSTS hydrate from the caller's real BE bookmarks (no fake-id feed calls).
    const { resources, isLoading: resourcesLoading, error: resourcesError, mutate: mutateResources } = useQueryResourceHubSwr()
    const { courses, isLoading: coursesLoading, error: coursesError, mutate: mutateCourses } = useQueryCoursesSwr()
    const { posts: bookmarkedPosts, isLoading: postsLoading, error: postsError, mutate: mutatePosts } = useQueryBookmarkedPostsSwr()

    /** Real bookmarked posts keyed by id — the display source for saved post rows. */
    const postsById = useMemo(() => {
        const map = new Map<string, SavedPost>()
        for (const post of bookmarkedPosts) {
            map.set(post.id, post)
        }
        return map
    }, [bookmarkedPosts])

    // Reconcile the store with the REAL server bookmark list: the BE bookmark
    // endpoint — not this browser's localStorage — is the source of truth for which
    // POSTS are saved. Any post bookmarked on the server but missing from the local
    // store (saved on another device / after a storage clear) is merged in so it
    // actually renders (and its per-row un-bookmark button reads the right state).
    // `mergeSavedPosts` is additive + no-ops once every id is present, so this is
    // loop-safe despite `bookmarkedPosts` changing identity each render.
    useEffect(() => {
        if (bookmarkedPosts.length === 0) {
            return
        }
        mergeSavedPosts(bookmarkedPosts.map((post) => ({ entityId: post.id })))
    }, [bookmarkedPosts, mergeSavedPosts])

    const isJoining =
        !isHydrated ||
        resourcesLoading ||
        coursesLoading ||
        postsLoading

    // any join dataset failing → the library can't resolve rows: show one error + retry all
    const joinError = resourcesError || coursesError || postsError
    const retryJoins = () => {
        void mutateResources()
        void mutateCourses()
        void mutatePosts()
    }

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
                // mã gói nội bộ (…_PACKAGE_MAIN) không phải mã môn → helper trả "" và kicker biến mất,
                // nhưng haystack giữ mã THÔ để tìm theo mã (kể cả mã gói) vẫn trúng
                const code = displayCourseCode(course.code)
                return {
                    entry,
                    href: `/courses/${course.id}`,
                    title: code ? `${code} · ${course.name}` : course.name,
                    context: t("courseSystem.catalog.lessonsCount", { count: course.lessons }),
                    haystack: `${course.code} ${course.name}`,
                }
            }
            // post: author/title/snippet come from the real BE bookmark endpoint; the
            // source label comes from the entry captured at save time
            const post = postsById.get(entry.entityId)
            if (!post) return null
            const snippet = post.title ? `${post.title} — ${post.snippet}` : post.snippet
            const sourceLabel =
                entry.source?.kind === "community" || !entry.source
                    ? t("savedItems.source.community")
                    : entry.source.label
            return {
                entry,
                href: `/community/${entry.entityId}`,
                title: snippet,
                context: sourceLabel,
                author: post.authorName,
                haystack: `${post.authorName} ${snippet}`,
            }
        }
        return [...items]
            .sort((a, b) => b.savedAt - a.savedAt)
            .map(resolve)
            .filter((row): row is SavedRow => row !== null)
    }, [items, resources, courses, postsById, t])

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
                <EmptyContent
                    icon={<FtesMascot pose="greeting" size="lg" />}
                    title={t("savedItems.signInTitle")}
                    description={t("mascot.greeting.guest")}
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

                    <SearchInput
                        value={query}
                        onValueChange={setQuery}
                        placeholder={t("savedItems.searchPlaceholder")}
                        className="sm:max-w-none"
                    />

                    <AsyncContent
                        isLoading={isJoining}
                        skeleton={<SavedLibrarySkeleton />}
                        error={joinError}
                        errorContent={{
                            title: t("savedItems.error.title"),
                            description: t("savedItems.error.hint"),
                            onRetry: retryJoins,
                            retryLabel: t("savedItems.error.retry"),
                        }}
                        isEmpty={tabRows.length === 0 || visibleRows.length === 0}
                        emptyContent={
                            tabRows.length === 0
                                ? {
                                    icon: <FtesMascot pose="explain" size="lg" />,
                                    title: t(`savedItems.empty.${tab}.title`),
                                    description: t(`savedItems.empty.${tab}.hint`),
                                    action: (
                                        <Button size="sm" variant="secondary" onPress={onBrowse}>
                                            {t(`savedItems.empty.${tab}.cta`)}
                                        </Button>
                                    ),
                                }
                                : {
                                    icon: <BookmarkSimpleIcon aria-hidden focusable="false" className="size-8 text-muted" />,
                                    title: t("savedItems.noResults"),
                                }
                        }
                    >
                        <div className="flex flex-col gap-3">
                            {visibleRows.map((row) => (
                                <SavedRowItem key={`${row.entry.entityType}:${row.entry.entityId}`} row={row} showType={tab === "all"} />
                            ))}
                        </div>
                    </AsyncContent>
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
            className="flex items-center gap-3 rounded-2xl border border-separator px-4 py-3 no-underline transition-colors hover:bg-default/40"
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
                className="flex items-center gap-3 rounded-2xl border border-separator px-4 py-3"
            >
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-2/3 rounded-full" />
                    <Skeleton className="h-3 w-1/3 rounded-full" />
                </div>
                {/* trailing type-chip + unsave bookmark, mirroring the real row */}
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="size-8 rounded-full" />
            </div>
        ))}
    </div>
)
