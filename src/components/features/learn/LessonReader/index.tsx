"use client"

import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    type Key,
} from "react"
import {
    Card,
    CardContent,
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    useParams,
    usePathname,
    useRouter,
    useSearchParams,
} from "next/navigation"
import {
    AdBanner,
} from "@/components/features/dashboard/AdBanner"
import type {
    ContentTabItem,
} from "./types"
import {
    ContentBody,
} from "./ContentBody"
import {
    ChallengeBody,
} from "./ChallengeBody"
import {
    SandboxBody,
} from "./SandboxBody"
import {
    AiLabBody,
} from "./AiLab"
import {
    E2eResultButton,
} from "./E2eResultButton"
import {
    ContentTabBar,
} from "./ContentTabBar"
import {
    ContentHeader,
} from "./ContentHeader"
import {
    LessonPager,
} from "./LessonPager"
import {
    ContentDiscussion,
} from "./ContentBody/ContentBodyV2/Discussion"
import {
    ContentReactionBar,
} from "./ContentBody/ContentBodyV2/Discussion/ContentReactionBar"
import {
    ContentBodySkeleton,
} from "./ContentBodySkeleton"
import {
    ContentHeaderSkeleton,
} from "./ContentHeaderSkeleton"
import {
    PremiumPaywall,
} from "./PremiumPaywall"
import { SelectionHintCallout } from "../ContentAiSelectionAsk/SelectionHintCallout"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { type WithClassNames } from "@/modules/types/base/class-name"
import { DEFAULT_PROGRAMMING_LANGUAGES, isProgrammingLangAvailable, resolveActiveProgrammingLang } from "@/modules/types/utils/programming-language"
import { listContentBodyLangs } from "@/modules/types/entities/content-body"
import { programmingLanguageIconMap } from "@/components/reuseable/ProgrammingLanguageTabs/map"
import type { TabsCardGroup } from "@/components/blocks/navigation/TabsCard"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { useQueryContentSwr } from "@/hooks/swr/api/graphql/queries/useQueryContentSwr"
import { useQueryContentStatusSwr } from "@/hooks/swr/api/graphql/queries/useQueryContentStatusSwr"
import { usePremiumGateOverlayState, useAdModalOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useQueryActiveAdvertisementSwr } from "@/hooks/swr/api/graphql/queries/useQueryActiveAdvertisementSwr"
import { useQueryAiLabPlaygroundSwr } from "@/hooks/swr/api/graphql/queries/useQueryAiLabPlaygroundSwr"
import { AdvertisementPlacement } from "@/modules/api/graphql/queries/types/active-advertisement"
import { ContentTab, setContentTab } from "@/redux/slices/tabs"
import { setContentSelectedProgrammingLang } from "@/redux/slices/content"

export type LessonReaderProps = WithClassNames<undefined>

/**
 * Learn content page layout for `/modules/[moduleId]/contents/[contentId]`.
 *
 * Owns data (content + status SWR, redux snapshot) and tab navigation, then
 * delegates the header, tab bar and active body to presentational children.
 * @param {LessonReaderProps} props Optional wrapper styling props.
 */
export const LessonReader = ({ className }: LessonReaderProps) => {
    const t = useTranslations()
    const params = useParams()
    const routeContentId = params.contentId as string | undefined
    const contentFromRedux = useAppSelector((state) => state.content.entity)
    const contentTab = useAppSelector((state) => state.tabs.contentTab)
    const queryContentSwr = useQueryContentSwr()
    /** Prefer Redux; fall back to SWR cache so returning to a lesson does not stick on skeleton. */
    const contentSnapshot = contentFromRedux ?? queryContentSwr.data
    /** Ignore stale entity rows left over after `contentId` changes until fetch/cache catches up. */
    const content =
        contentSnapshot?.id && routeContentId && contentSnapshot.id === routeContentId
            ? contentSnapshot
            : undefined
    useQueryContentStatusSwr()
    /** AI Lab playground bound to this lesson, if any (drives the AI Lab tab). */
    const playgroundSwr = useQueryAiLabPlaygroundSwr(content?.id)
    const playground = playgroundSwr.data
    const dispatch = useAppDispatch()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { open: openPremiumGate } = usePremiumGateOverlayState()
    const courseId = params.courseId as string | undefined

    // interstitial ad for the lesson — null server-side for members / viewers
    // already enrolled in this course, so a non-null result means "show it"
    const { data: interstitialAd } = useQueryActiveAdvertisementSwr({
        placement: AdvertisementPlacement.LessonInterstitial,
        courseId,
    })
    // inline banner at the foot of the lesson (same exemptions applied server-side)
    const { data: inlineAd } = useQueryActiveAdvertisementSwr({
        placement: AdvertisementPlacement.LessonInline,
        courseId,
    })
    const { open: openAdModal } = useAdModalOverlayState()
    /** Lesson id the interstitial already popped for — pop once per lesson open. */
    const adShownForRef = useRef<string | null>(null)

    // pop the interstitial immediately when a lesson opens (once per lesson)
    useEffect(
        () => {
            if (interstitialAd && content?.id && adShownForRef.current !== content.id) {
                adShownForRef.current = content.id
                openAdModal(interstitialAd)
            }
        },
        [
            interstitialAd,
            content?.id,
            openAdModal,
        ],
    )

    /**
     * Locked premium lesson ("trial read"): the backend returns a truncated body
     * with `isPremium=true` when the viewer is not entitled, so we fade the body
     * behind an inline paywall and gate the premium-only tabs (lesson/challenges)
     * behind the register modal.
     */
    const isLocked = content?.isPremium === true
    const isSandbox = Boolean(content?.isSandbox) && Boolean(content?.githubBaseUrl) && Boolean(content?.githubDir)
    const hasE2e = Array.isArray(content?.e2eFlows) && content.e2eFlows.length > 0

    /** Tab entries (key + label + body) rendered in the tab bar. */
    const tabItems = useMemo<Array<ContentTabItem>>(
        () => {
            const items: Array<ContentTabItem> = [
                {
                    key: ContentTab.Content,
                    label: t("content.tabs.content"),
                    component: <ContentBody />,
                },
            ]
            if (isSandbox) {
                items.push({
                    key: ContentTab.Sandbox,
                    label: "Sandbox",
                    component: <SandboxBody />,
                })
            }
            items.push({
                key: ContentTab.Challenges,
                label: t("content.tabs.challenges"),
                component: <ChallengeBody />,
                locked: isLocked,
            })
            if (playground) {
                items.push({
                    key: ContentTab.AILab,
                    label: t("aiLab.tabs.aiLab"),
                    component: <AiLabBody />,
                })
            }
            return items
        },
        [
            t,
            isLocked,
            isSandbox,
            playground,
        ],
    )

    /** Tab key shown in the bar (falls back to Content for an unknown `?tab=`). */
    const selectedTabKey = useMemo(
        () => tabItems.some((item) => item.key === contentTab)
            ? contentTab
            : ContentTab.Content,
        [
            contentTab,
            tabItems,
        ],
    )

    /** Tabs that span the full page width (no reading-width cap / article padding). */
    const isFullWidthTab =
        selectedTabKey === ContentTab.Sandbox || selectedTabKey === ContentTab.AILab

    /**
     * Tabs that keep the centered reading width but render flat on the canvas (no
     * "paper" reading card). The Challenges tab is already a list of bordered cards,
     * so wrapping it in the reading card would be a redundant card-in-card.
     */
    const isCardlessReadingTab = selectedTabKey === ContentTab.Challenges

    /** Body of the currently selected tab. */
    const bodyComponent = useMemo(
        () => tabItems.find((item) => item.key === selectedTabKey)?.component,
        [
            selectedTabKey,
            tabItems,
        ],
    )

    // Per-language switcher (SCHEMA V2 bodies): hoisted into the tab toolbar so the
    // reader keeps a single nav layer. Shown only on the Content tab and only when the
    // lesson actually ships more than one language.
    const langs = useMemo(
        () => listContentBodyLangs(content?.bodies),
        [content?.bodies],
    )
    const selectedLang = useAppSelector((state) => state.content.selectedProgrammingLang)
    const activeLang = useMemo(
        () => resolveActiveProgrammingLang(selectedLang, langs),
        [selectedLang, langs],
    )
    const onSelectLang = useCallback(
        (lang: string) => dispatch(setContentSelectedProgrammingLang(lang)),
        [dispatch],
    )
    /** Right-side language tab group for the toolbar (Content tab + multi-lang only). */
    const languageTabs = useMemo<TabsCardGroup | undefined>(
        () => {
            if (selectedTabKey !== ContentTab.Content || langs.length <= 1) {
                return undefined
            }
            return {
                ariaLabel: t("content.language"),
                selectedKey: activeLang,
                onSelectionChange: (key) => onSelectLang(String(key)),
                items: DEFAULT_PROGRAMMING_LANGUAGES.map((lang) => {
                    const Icon = programmingLanguageIconMap[lang]
                    return {
                        key: lang,
                        label: t(`programmingLanguage.${lang}`),
                        icon: <Icon aria-hidden className="size-5 shrink-0" />,
                        isDisabled: !isProgrammingLangAvailable(lang, langs),
                    }
                }),
            }
        },
        [selectedTabKey, langs, activeLang, onSelectLang, t],
    )

    const isLoading = queryContentSwr.isLoading && !content
    /**
     * Switch tabs, but intercept locked premium tabs: open the register modal
     * and keep the current tab selected instead of revealing the gated body.
     */
    const onTabChange = useCallback(
        (key: Key) => {
            const nextTab = key as ContentTab
            if (tabItems.find((item) => item.key === nextTab)?.locked) {
                openPremiumGate()
                return
            }
            dispatch(setContentTab(nextTab))
            const params = new URLSearchParams(searchParams.toString())
            params.set("tab", nextTab)
            router.replace(`${pathname}?${params.toString()}`)
        },
        [tabItems, openPremiumGate, dispatch, searchParams, router, pathname],
    )

    return (
        <div className={cn("flex flex-col gap-6", className)}>
            {/* header (tier 2) capped to the reading width; skeleton vs real via AsyncContent */}
            <div className="mx-auto w-full max-w-3xl">
                <AsyncContent
                    isLoading={isLoading}
                    skeleton={<ContentHeaderSkeleton />}
                >
                    <ContentHeader />
                </AsyncContent>
            </div>
            {/* REAL tab bar — static chrome, shows immediately (never skeleton-ised) */}
            <ContentTabBar
                tabItems={tabItems}
                selectedKey={selectedTabKey}
                ariaLabel={t("module.tabListAria")}
                onSelectionChange={onTabChange}
                rightTabs={languageTabs}
            />
            {/* body (tier 3) — skeleton mirrors the centered reading card while content loads */}
            <AsyncContent
                isLoading={isLoading}
                skeleton={(
                    <div className="mx-auto w-full max-w-3xl">
                        <Card>
                            <CardContent>
                                <ContentBodySkeleton variant="v2" />
                            </CardContent>
                        </Card>
                    </div>
                )}
            >
                {/* Sandbox / AI Lab span full width (no reading card); everything else
                    reads inside a centered "paper" card on the page canvas. */}
                {isFullWidthTab ? (
                    <div className="relative w-full">
                        {/* id scopes the "on this page" rail's heading scan (#lesson-article [data-toc]) */}
                        <div id="lesson-article">
                            {bodyComponent}
                        </div>
                    </div>
                ) : isCardlessReadingTab ? (
                    // capped reading width but flat — the Challenges body is already a list
                    // of cards, so it sits directly on the canvas (no paper card-in-card)
                    <div className="mx-auto w-full max-w-3xl">
                        <div id="lesson-article">
                            {bodyComponent}
                        </div>
                    </div>
                ) : (
                    <div className="mx-auto w-full max-w-3xl">
                        <Card>
                            <CardContent>
                                {/* one-time tip: highlight a passage to ask AI (selection feature
                                    is otherwise only discoverable AFTER selecting) */}
                                {!isLocked ? <SelectionHintCallout /> : null}
                                <div className="relative">
                                    <div id="lesson-article" className={cn(isLocked && "select-none")}>
                                        {bodyComponent}
                                    </div>
                                    {/* Medium-style teaser: fade the tail of the body into the
                                        card surface (pure opacity fade) behind the paywall. */}
                                    {isLocked ? (
                                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-b from-transparent via-surface/70 to-surface" />
                                    ) : null}
                                </div>
                                {/* paywall lives INSIDE the body card, under the faded teaser
                                    (flat — not a 2nd card). */}
                                {isLocked ? <PremiumPaywall /> : null}
                                {/* reaction footer (belongs to the lesson) — end-of-article strip
                                    inside the reading card, à la Medium / Substack; a border-t
                                    divider, NOT a nested card. Hidden behind the paywall. */}
                                {!isLocked ? (
                                    <ContentReactionBar className="mt-6 border-t border-default pt-4" />
                                ) : null}
                            </CardContent>
                        </Card>
                    </div>
                )}
                {/* engagement + navigation — rendered OUTSIDE the reading card as their own blocks,
                    each separated by gap-6: reaction (belongs to the lesson) + comments (own surface),
                    then the prev/next pager, then the quiet E2E-results link. Hidden on locked /
                    full-width tabs. */}
                {!isLocked && !isFullWidthTab ? (
                    <div className="flex flex-col gap-6 pb-6">
                        <ContentDiscussion className="mx-auto w-full max-w-3xl" />
                        <LessonPager className="mx-auto w-full max-w-3xl" />
                        {hasE2e ? (
                            <div className="mx-auto w-full max-w-3xl">
                                <E2eResultButton />
                            </div>
                        ) : null}
                    </div>
                ) : null}
                {/* inline house/sponsor banner at the foot of the lesson; null
                    server-side for members + enrolled viewers, so render only
                    when present and not on full-width (sandbox / AI lab) tabs */}
                {inlineAd && !isFullWidthTab ? (
                    <div className="mx-auto w-full max-w-3xl pb-6">
                        <AdBanner ad={inlineAd} />
                    </div>
                ) : null}
            </AsyncContent>
        </div>
    )
}
