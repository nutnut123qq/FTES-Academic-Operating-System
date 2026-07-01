"use client"

import React from "react"
import {
    Modal,
    Tabs,
    Typography,
    cn,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import {
    FOLLOW_LIST_PAGE_LIMIT,
} from "@/hooks/swr/api/graphql/queries/useQueryUserFollowersInfiniteSwr"
import type {
    FollowListTab,
} from "@/hooks/zustand/overlay/store"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useFollowListOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { useQueryUserFollowersInfiniteSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserFollowersInfiniteSwr"
import { useQueryUserFollowingInfiniteSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserFollowingInfiniteSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { InfiniteScrollSentinel } from "@/components/blocks/async/InfiniteScrollSentinel"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { pathConfig } from "@/resources/path"

/** The two follow-graph directions, in tab order. */
const TABS: ReadonlyArray<FollowListTab> = ["followers", "following"]

/**
 * Global follow-list modal: the followers / following lists for one profile,
 * each an infinite-scroll roster of clickable users. Opened via
 * {@link useFollowListOverlayState} (`open({ username, tab })`) from the profile
 * identity column; mounted once in `ModalContainer`.
 *
 * Self-contained: reads the target username + initial tab from the overlay
 * context, drives a `useSWRInfinite` hook per direction (only the active tab
 * fetches), and navigates to a user's profile on click (closing the modal).
 */
export const FollowListModal = ({ className }: WithClassNames<undefined>) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const { isOpen, setOpen, context } = useFollowListOverlayState()
    const username = context?.username ?? null

    // active tab is ephemeral UI state; seed it from the context each time the
    // modal opens (or the caller switches which count they clicked)
    const [tab, setTab] = React.useState<FollowListTab>("followers")
    React.useEffect(() => {
        if (isOpen && context?.tab) {
            setTab(context.tab)
        }
    }, [isOpen, context?.tab])

    const { data: profile } = useQueryUserProfileSwr(username)
    // only the visible tab fetches (the hidden one is gated by `enabled`)
    const followers = useQueryUserFollowersInfiniteSwr(username, isOpen && tab === "followers")
    const following = useQueryUserFollowingInfiniteSwr(username, isOpen && tab === "following")
    const active = tab === "followers" ? followers : following

    const items = (active.data ?? []).flat()
    const lastPage = active.data?.[active.data.length - 1]
    // a full last page means there may be more rows behind it
    const hasMore = !!lastPage && lastPage.length === FOLLOW_LIST_PAGE_LIMIT
    const isInitialLoading = active.isLoading && items.length === 0

    const counts: Record<FollowListTab, number> = {
        followers: profile?.followerCount ?? 0,
        following: profile?.followingCount ?? 0,
    }

    /** Go to a user's profile and close the modal. */
    const onOpenUser = (userName: string) => {
        router.push(pathConfig().locale(locale).profile(userName).build())
        setOpen(false)
    }

    return (
        <Modal isOpen={isOpen} onOpenChange={setOpen}>
            <Modal.Backdrop>
                <Modal.Container size="sm">
                    <Modal.Dialog className={cn(className)}>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Typography type="h4" weight="bold">
                                {t("followList.title")}
                            </Typography>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="flex flex-col gap-3">
                                <Tabs
                                    variant="secondary"
                                    selectedKey={tab}
                                    onSelectionChange={(key) => setTab(String(key) as FollowListTab)}
                                    className="extended-tabs"
                                >
                                    <Tabs.ListContainer>
                                        <Tabs.List aria-label={t("followList.title")}>
                                            {TABS.map((tabId) => (
                                                <Tabs.Tab key={tabId} id={tabId}>
                                                    <span className="flex items-center gap-1.5">
                                                        {t(`profile.${tabId}`)}
                                                        <span className="tabular-nums text-muted">
                                                            {counts[tabId]}
                                                        </span>
                                                    </span>
                                                    <Tabs.Indicator />
                                                </Tabs.Tab>
                                            ))}
                                        </Tabs.List>
                                    </Tabs.ListContainer>
                                </Tabs>

                                <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
                                    <AsyncContent
                                        isLoading={isInitialLoading}
                                        skeleton={(
                                            <div className="flex flex-col gap-2">
                                                {[0, 1, 2, 3, 4].map((row) => (
                                                    <div key={row} className="flex items-center gap-3 p-2">
                                                        <Skeleton.Avatar size="sm" />
                                                        <div className="flex flex-col gap-2">
                                                            <Skeleton.Typography type="body-sm" width="1/2" />
                                                            <Skeleton.Typography type="body-xs" width="1/4" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        isEmpty={items.length === 0}
                                        emptyContent={{
                                            title: t(`followList.empty.${tab}`),
                                        }}
                                        error={active.error}
                                        errorContent={{
                                            title: t("publicProfile.loadError"),
                                            onRetry: () => active.mutate(),
                                            retryLabel: t("publicProfile.loadErrorRetry"),
                                        }}
                                    >
                                        {items.map((follow) => (
                                            <button
                                                key={follow.globalId}
                                                type="button"
                                                onClick={() => onOpenUser(follow.username)}
                                                className="flex items-center gap-3 rounded-large p-2 text-left transition-colors hover:bg-default/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                                            >
                                                <UserAvatar
                                                    username={follow.displayName ?? follow.username}
                                                    avatar={follow.avatar}
                                                    seed={follow.username}
                                                    size="sm"
                                                />
                                                <div className="flex min-w-0 flex-col gap-0">
                                                    <Typography type="body-sm" weight="medium" truncate>
                                                        {follow.displayName ?? follow.username}
                                                    </Typography>
                                                    <Typography type="body-xs" color="muted" truncate>
                                                        @{follow.username}
                                                    </Typography>
                                                </div>
                                            </button>
                                        ))}
                                        {/* grow the list as the sentinel scrolls into view */}
                                        <InfiniteScrollSentinel
                                            onReach={() => active.setSize((size) => size + 1)}
                                            disabled={!hasMore || active.isValidating}
                                        />
                                    </AsyncContent>
                                </div>
                            </div>
                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
