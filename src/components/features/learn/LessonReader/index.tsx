"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, Chip, Typography, cn } from "@heroui/react"
import { ClockIcon, FlameIcon } from "@phosphor-icons/react"
import { useFormatter, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { mutate as globalMutate } from "swr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { revalidateLearnData } from "@/components/features/learn/hooks/revalidateLearnData"
import { usePostMarkLessonCompleteSwr } from "@/hooks/swr/api/rest/mutations/usePostMarkLessonCompleteSwr"
import { reportLessonProgress } from "@/modules/api/rest/course"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { ResponsiveBreadcrumb } from "@/components/blocks/navigation/ResponsiveBreadcrumb"
import type { ResponsiveBreadcrumbItem } from "@/components/blocks/navigation/ResponsiveBreadcrumb"
import { CheckListCard, CheckListItem } from "@/components/blocks/cards/CheckListCard"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { PressableCard } from "@/components/blocks/cards/PressableCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { ProgrammingLanguageTabs } from "@/components/reuseable/ProgrammingLanguageTabs"
import { ProgrammingLanguageTabsVariant } from "@/components/reuseable/ProgrammingLanguageTabs/enums"
import { resolveActiveProgrammingLang } from "@/modules/types/utils/programming-language"
import { useRouter } from "@/i18n/navigation"
import {
    BookOpenIcon,
    CaretLeftIcon,
    CaretRightIcon,
    ListIcon,
    LockSimpleIcon,
    PuzzlePieceIcon,
} from "@phosphor-icons/react"
import { Button } from "@heroui/react"
import { useQueryLearnLessonSwr } from "../hooks/useQueryLearnLessonSwr"
import { useLearnSidebarStore } from "@/hooks/zustand/learnSidebar/store"

import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { LessonReactionFooter } from "./LessonReactionFooter"
import { LessonComments } from "./LessonComments"
import { LessonResourceLinks } from "./LessonResourceLinks"
import { LessonVideoBlock } from "./LessonVideoBlock"
import type { LessonUpNextDestination } from "./hooks/useLessonUpNext"
import { LessonDocumentHtml } from "./LessonDocumentHtml"
import { SelectionHintCallout } from "./ContentAiSelectionAsk/SelectionHintCallout"
import { LessonQuizBlock } from "./LessonQuizBlock"
import { LessonCompleteCelebration } from "./LessonCompleteCelebration"
import { PackageGateModal } from "@/components/features/course/PackageGateModal"
import { DocumentReader } from "@/components/features/learn/DocumentReader"
import { useQueryCoursePackagesSwr } from "@/components/features/course/hooks/useQueryCoursePackagesSwr"
import { resolveTierLabel } from "@/components/features/course/tierLabels"

/** Build the reader / challenge route for a lesson id shaped "m<n>-l<k>". */
const readerHref = (courseId: string, lessonId: string) =>
    `/courses/${courseId}/learn/content/modules/${lessonId.split("-")[0]}/contents/${lessonId}`
/** Build the route to the lesson's linked challenge from the REAL ids (no `-c` mock). */
const challengeHref = (courseId: string, moduleId: string, contentId: string, challengeId: string) =>
    `/courses/${courseId}/learn/content/modules/${moduleId}/contents/${contentId}/challenges/${challengeId}`

/**
 * Extracts external links when a lesson body is essentially JUST link(s) — a URL (or
 * a few) with almost no other prose, the shape most migrated "Tài liệu / Link / Submit"
 * lessons take. Returns the URLs to render as resource cards, or an empty array for a
 * real written body (rendered as markdown as usual).
 */
const extractResourceLinks = (markdown: string): Array<string> => {
    const urls = markdown.match(/https?:\/\/[^\s)\]<>"']+/g) ?? []
    if (urls.length === 0) {
        return []
    }
    const prose = markdown
        .replace(/https?:\/\/[^\s)\]<>"']+/g, " ")
        .replace(/[[\]()`*_#>~|-]/g, " ")
        .replace(/\b(links?|tài liệu|tai lieu|submit|nộp bài|nop bai)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
    return prose.length <= 24 ? urls : []
}

/**
 * Lesson reader (StarCI port). Owns lesson data + the tab navigation, then
 * delegates the header (breadcrumb + meta chips + outcomes), the content tab bar
 * (Content / Challenges + a language switcher on the right), the reading card
 * (`#lesson-article`, anchored headings, the selection-ask hint), a prev/next
 * pager and the per-lesson discussion to presentational children.
 *
 * The 3 rails (content-map left, on-this-page right) + the AI tutor FAB now live
 * in the route layout, so this feature renders only its centered reading column.
 * Premium bodies are gated (`select-none` + a paywall) — unlock by enrolling.
 */
export const LessonReader = () => {
    const t = useTranslations("learn")
    const format = useFormatter()
    const router = useRouter()
    const { courseId, contentId } = useParams<{ courseId: string; contentId: string }>()
    const { lesson, error, mutate } = useQueryLearnLessonSwr(courseId, contentId)
    const { toggle: toggleSidebar } = useLearnSidebarStore()
    const [lang, setLang] = useState("typescript")
    const [gateOpen, setGateOpen] = useState(false)
    /** Which paywall entry opened the shared gate modal — drives its title/context. */
    const [gateContext, setGateContext] = useState<"document" | "video" | "challenge">("document")
    /**
     * Content id whose completion cheer should show. Set only on the learner-driven
     * video ≥50% completion so the transient cheer renders BESIDE the player (where
     * the learner is looking) rather than at the bottom completion block below the
     * fold. Gated on `=== contentId` so it self-clears when navigating to another
     * lesson.
     */
    const [celebratedId, setCelebratedId] = useState<string | null>(null)
    const handleCelebrate = useCallback(() => setCelebratedId(contentId), [contentId])

    // Auto-completion wiring. The video player reports ≥50% watched via
    // `handleHalfWatched`; the per-lesson (keyed) <LessonCompletion> registers its
    // guarded fire into `fireRef`, so watching a video and leaving a document both
    // route through the same idempotent mark-complete.
    const fireRef = useRef<(() => void) | null>(null)
    const registerFire = useCallback((fn: (() => void) | null) => {
        fireRef.current = fn
    }, [])
    const handleHalfWatched = useCallback(() => {
        fireRef.current?.()
    }, [])

    const activeLang = resolveActiveProgrammingLang(lang, lesson?.availableLangs ?? [])
    const bodyMd = lesson?.bodyByLang[activeLang] ?? ""
    const isLocked = lesson?.isLocked ?? false
    const accessLevel = lesson?.accessLevel ?? null
    const isPreview = accessLevel === "PREVIEW"
    const contentType = lesson?.contentType ?? ""
    /**
     * Free-trial preview = a locked lesson the BE serves as a partial PREVIEW
     * (accessLevel === "PREVIEW"), i.e. the "học thử" state where the first slice is
     * shown and the rest is paywalled.
     */
    const isTrialPreview = isLocked && isPreview
    /**
     * The Medium-style partial-blur cover (bottom fade gradient + `select-none` on the
     * article + the "You're viewing the preview / Subscribe to a package" teaser) is a
     * DOCUMENT free-trial concept ONLY. A VIDEO lesson gates on its OWN preview-remaining
     * clamp (the LessonVideoBlock countdown chip + lock overlay), so it must never also
     * blur the article; a fully-locked no-trial lesson gets the hard paywall instead of
     * the partial blur. User rule: "che mờ chỉ hiện ở loại document có mở cho học thử".
     * (Note: the DOCUMENT case is routed to <DocumentReader/> above, so in THIS legacy
     * reading-card path — reached only for non-DOCUMENT lessons — this is always false,
     * which is exactly the fix: video/mixed lessons drop the article blur + teaser.)
     */
    const showDocumentPreviewTeaser = isTrialPreview && contentType === "DOCUMENT"
    /**
     * The enroll paywall card (LockSimple + preview/locked title + "Enroll in course"
     * CTA) shown at the bottom of this legacy reading-card path. A locked NON-DOCUMENT
     * lesson (video/mixed) must show it whether it is a partial PREVIEW ("học thử") or a
     * fully-locked no-trial lesson — a locked video always needs a way to enroll. It also
     * stays true for a fully-locked DOCUMENT (harmless: DOCUMENT routes to <DocumentReader/>
     * so that branch is unreachable here). It does NOT gate on `showDocumentPreviewTeaser`
     * (the article blur), so a locked PREVIEW video gets the enroll card without the blur.
     */
    const showLegacyPaywall = isLocked && (contentType !== "DOCUMENT" || !isPreview)
    /**
     * Tường phí liệt kê TÊN các gói mở được bài này thay vì "Nội dung premium" chung chung
     * (góp ý 2026-07-26: "nên liệt kê hết các gói chứa học phần này"). Cùng nguồn dữ liệu
     * với badge gói ở CourseDetail (`GET /courses/{id}/packages`) nên SWR dedupe, không
     * thêm request mới; bỏ slug giả "free" và sắp rẻ-trước theo salePrice.
     */
    const paidPackageSlugs = (lesson?.packageSlugs ?? []).filter((slug) => slug !== "free")
    const { packages: coursePackages } = useQueryCoursePackagesSwr(lesson?.courseRawId, {
        enabled: showLegacyPaywall && paidPackageSlugs.length > 0,
    })
    const packagePriceBySlug = new Map(coursePackages.map((pkg) => [pkg.slug, Number(pkg.salePrice)]))
    const packageNameBySlug = new Map(coursePackages.map((pkg) => [pkg.slug, pkg.name]))
    const lockedPackageNames = [...paidPackageSlugs]
        .sort((a, b) => (packagePriceBySlug.get(a) ?? Infinity) - (packagePriceBySlug.get(b) ?? Infinity))
        .map((slug) => resolveTierLabel(slug, packageNameBySlug))
        .join(", ")
    /**
     * Link ngoài trong `videoRef` (Drive…) CHỈ hiện khi đã mở khoá. Link Drive là trọn bài giảng
     * và không có cách nào kẹp ở mốc xem thử như player YouTube/HLS — đưa cho người chưa mua là
     * tặng không cả bài. Người xem thử vẫn thấy tường phí như cũ.
     */
    const unlockedExternalRef = !isLocked ? (lesson?.externalRef ?? null) : null
    /** A readable lesson whose reading card would be blank (no body, no HTML, no video, no link). */
    const isReadingEmpty =
        !!lesson && !isLocked && !bodyMd && !lesson.documentHtml && !lesson.hasVideo && !unlockedExternalRef
    /** External links when the body is essentially just link(s) → render as resource cards. */
    const resourceLinks = [
        ...(bodyMd ? extractResourceLinks(bodyMd) : []),
        ...(unlockedExternalRef ? [unlockedExternalRef] : []),
    ]
    const isLinkOnly = resourceLinks.length > 0
    /** True when the lesson has real reading content (written body / HTML / resource links). */
    const hasWrittenBody = !!bodyMd || !!lesson?.documentHtml
    /**
     * Is there anything in the reading area to fade out? Same rule as `DocumentReader`: a locked
     * lesson with an EMPTY teaser has nothing to fade, so skip the overlay entirely (the fade is
     * an `inset-0` cover, so it stays contained by the article box and can't spill over the title,
     * but drawing it over a 0px body would be pointless).
     */
    const hasTeaserBody = hasWrittenBody || isLinkOnly
    /** Draw the reading card only when there is something to put in it (else e.g. video-only). */
    // `isLinkOnly` phải nằm trong điều kiện: bài chỉ có link ngoài thì không có thân bài, cũng
    // không còn tính là "rỗng" — thiếu vế này thẻ đọc không dựng và cái link lại rơi mất lần nữa.
    const showReadingCard = !!lesson && (isLocked || hasWrittenBody || isLinkOnly || isReadingEmpty)

    /**
     * The section crumb reads the section's REAL TITLE, not its ordinal: the BE splits a
     * section into `name` ("Phần 1") + `description` ("Làm quen với ngôn ngữ C/C++"), the
     * same split the content-map rail resolves as `description || title`. Falls back to the
     * ordinal when a section carries no title, and to the generic "Học phần" label when the
     * curriculum has neither — never an empty crumb.
     */
    const moduleCrumbLabel =
        lesson?.moduleDescription || lesson?.moduleTitle || t("content.moduleTitle")

    /** Tier-1 breadcrumb (Courses › <course> › Modules › <lesson>). */
    const breadcrumbItems = useMemo<Array<ResponsiveBreadcrumbItem>>(
        () => [
            { key: "courses", label: t("nav.sections.content"), onPress: () => router.push(`/courses/${courseId}/learn/content`) },
            {
                key: "module",
                // A real section title can be a full sentence — cap + ellipsis it (the same
                // `truncate` the breadcrumb already uses for its mobile back-link) so a long
                // title can never push the trail out of the header.
                label: (
                    <span className="block max-w-xs truncate" title={moduleCrumbLabel}>
                        {moduleCrumbLabel}
                    </span>
                ),
            },
        ],
        [t, router, courseId, moduleCrumbLabel],
    )

    /** Open the shared package gate with the given paywall context. */
    const openGate = useCallback((context: "document" | "video" | "challenge") => {
        setGateContext(context)
        setGateOpen(true)
    }, [])

    /**
     * Where the video hands off when it finishes ("xem hết video tự chuyển sang bài khác,
     * hoặc challenge nếu bài đó có challenge").
     *
     * Priority is the OWNER's: this lesson's own challenge first — practising what was just
     * watched beats moving on — then the next lesson. Both legs reuse the resolution that
     * already exists on this page rather than inventing a second one:
     *  - the challenge leg uses the same `moduleId`/`contentId`/slug route the content-map
     *    rail and the "Làm thử thách" CTA build (`challengeHref`), picking the LINKED
     *    challenge (`challengeId`) out of `challenges` for its slug — the route segment is
     *    the slug, not the id — and falling back to the first row, then to the raw id;
     *  - the next-lesson leg uses `nextId`/`nextTitle`, the exact fields <LessonPager/>
     *    renders below, so the button and the pager can never point at different lessons.
     *
     * Null when neither exists (last lesson, no challenge) → the player shows nothing and
     * never auto-advances.
     */
    const upNextDestination = useMemo<LessonUpNextDestination | null>(() => {
        if (!lesson) {
            return null
        }
        if (lesson.hasChallenge) {
            const linked =
                lesson.challenges.find((challenge) => challenge.id === lesson.challengeId)
                ?? lesson.challenges[0]
            const slug = linked?.slug ?? lesson.challengeId
            if (slug) {
                return {
                    href: challengeHref(courseId, lesson.moduleId, contentId, slug),
                    title: linked?.title ?? "",
                    kind: "challenge",
                }
            }
        }
        if (lesson.nextId) {
            return {
                href: readerHref(courseId, lesson.nextId),
                title: lesson.nextTitle ?? "",
                kind: "lesson",
            }
        }
        return null
    }, [lesson, courseId, contentId])

    return (
        <div className="flex flex-col gap-6">
            {/* header (tier 2) capped to the reading width */}
            <div className="mx-auto w-full max-w-3xl">
                <AsyncContent
                    isLoading={!lesson && !error}
                    skeleton={<HeaderSkeleton />}
                    error={!lesson ? error : undefined}
                    errorContent={{
                        title: t("reader.error"),
                        onRetry: () => { void mutate() },
                        retryLabel: t("common.retry"),
                    }}
                >
                    {lesson ? (
                        <div className="flex flex-col gap-6">
                            <PageHeader
                                breadcrumb={<ResponsiveBreadcrumb items={breadcrumbItems} />}
                                title={lesson.title}
                                description={lesson.description}
                                actions={(
                                    <div className="flex items-center gap-2">
                                        {/* "Bài trước" đi cặp với "Bài sau" (góp ý 2026-07-26). Điều hướng
                                            bằng router của next-intl để giữ prefix locale — thẻ <a> thuần
                                            sẽ reload cả trang và rơi về tiếng Anh. */}
                                        {lesson.prevId ? (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onPress={() => router.push(readerHref(courseId, lesson.prevId!))}
                                            >
                                                <span className="flex items-center gap-1">
                                                    <CaretLeftIcon aria-hidden focusable="false" className="size-4" />
                                                    {t("reader.prevLesson")}
                                                </span>
                                            </Button>
                                        ) : null}
                                        {lesson.nextId ? (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onPress={() => router.push(readerHref(courseId, lesson.nextId!))}
                                            >
                                                <span className="flex items-center gap-1">
                                                    {t("reader.nextLesson")}
                                                    <CaretRightIcon aria-hidden focusable="false" className="size-4" />
                                                </span>
                                            </Button>
                                        ) : null}
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="tertiary"
                                            aria-label={t("reader.toggleSidebar")}
                                            onPress={toggleSidebar}
                                        >
                                            <ListIcon aria-hidden focusable="false" className="size-5" />
                                        </Button>
                                    </div>
                                )}
                                meta={lesson.minutesRead > 0 || lesson.challengeCount > 0 ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                        {lesson.minutesRead > 0 ? (
                                            <Chip size="sm" variant="soft">
                                                <span className="flex items-center gap-1">
                                                    <ClockIcon aria-hidden focusable="false" className="size-3" />
                                                    {t("content.minutesRead", { minutes: lesson.minutesRead })}
                                                </span>
                                            </Chip>
                                        ) : null}
                                        {lesson.challengeCount > 0 ? (
                                            <Chip size="sm" variant="soft" color="accent">
                                                <span className="flex items-center gap-1">
                                                    <FlameIcon aria-hidden focusable="false" className="size-3" />
                                                    {t("content.challengeCount", { count: lesson.challengeCount })}
                                                </span>
                                            </Chip>
                                        ) : null}
                                    </div>
                                ) : undefined}
                            />
                            {lesson.outcomes.length > 0 ? (
                                <LabeledCard frameless label={t("content.outcomes")}>
                                    <CheckListCard>
                                        {lesson.outcomes.map((outcome) => (
                                            <CheckListItem key={outcome.id}>
                                                <Typography type="body-sm">{outcome.text}</Typography>
                                            </CheckListItem>
                                        ))}
                                    </CheckListCard>
                                </LabeledCard>
                            ) : null}
                        </div>
                    ) : null}
                </AsyncContent>
            </div>

            {/* language switcher — only when the lesson body ships in more than one language */}
            {lesson && lesson.availableLangs.length > 1 ? (
                <div className="mx-auto w-full max-w-3xl">
                    <ProgrammingLanguageTabs
                        availableLangs={lesson.availableLangs}
                        selectedLang={activeLang}
                        onSelectLang={setLang}
                        ariaLabel={t("reader.languageSwitcher")}
                        variant={ProgrammingLanguageTabsVariant.Pill}
                    />
                </div>
            ) : null}

            {/* body (tier 3) */}
            <AsyncContent
                isLoading={!lesson && !error}
                skeleton={(
                    <div className="mx-auto w-full max-w-3xl">
                        <Card>
                            <CardContent>
                                <Skeleton.Paragraph lines={6} />
                            </CardContent>
                        </Card>
                    </div>
                )}
                error={!lesson ? error : undefined}
                errorContent={{
                    title: t("reader.error"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("common.retry"),
                }}
            >
                {lesson ? (
                    <>
                        {/* video player (VIDEO lessons) — above the article */}
                        {lesson.hasVideo ? (
                            <LessonVideoBlock
                                key={contentId}
                                courseId={courseId}
                                lessonId={contentId}
                                courseRawId={lesson.courseRawId}
                                courseTitle={lesson.courseTitle}
                                courseCoverUrl={lesson.courseCoverUrl}
                                lessonTitle={lesson.title}
                                packageSlugs={lesson.packageSlugs}
                                videoRef={lesson.videoRef}
                                upNext={upNextDestination}
                                onHalfWatched={handleHalfWatched}
                                onPurchased={() => { void revalidateLearnData(courseId) }}
                            />
                        ) : null}
                        {/* completion cheer anchored beside the player — this fires on the
                                video ≥50% path, so the learner is looking here, not at the bottom
                                completion block. Keyed match self-clears on lesson change. */}
                        {celebratedId === contentId ? (
                            <LessonCompleteCelebration lessonId={contentId} className="mx-auto w-full max-w-3xl" />
                        ) : null}

                        {/* reading card — DOCUMENT lessons get the dedicated DocumentReader
                                (markdown/HTML/links + teaser fade + paywall). VIDEO lessons and
                                mixed-content lessons keep the legacy reading card path. */}
                        {lesson.contentType === "DOCUMENT" ? (
                            <DocumentReader
                                bodyMd={bodyMd}
                                documentHtml={lesson.documentHtml}
                                locked={isLocked}
                                teaser={lesson.teaser}
                                accessLevel={accessLevel}
                                contentType={lesson.contentType}
                                courseId={courseId}
                                courseRawId={lesson.courseRawId}
                                courseTitle={lesson.courseTitle}
                                courseCoverUrl={lesson.courseCoverUrl}
                                lessonId={contentId}
                                lessonTitle={lesson.title}
                                packageSlugs={lesson.packageSlugs}
                                onPurchased={() => { void revalidateLearnData(courseId) }}
                            />
                        ) : showReadingCard ? (
                            <div className="mx-auto w-full max-w-3xl">
                                <Card>
                                    <CardContent>
                                        {/* selection-hint only where there is real selectable text */}
                                        {!isLocked && hasWrittenBody && !isLinkOnly ? <SelectionHintCallout /> : null}
                                        <div className="relative">
                                            <div id="lesson-article" className={cn("flex flex-col gap-4", showDocumentPreviewTeaser && "select-none")}>
                                                {isLinkOnly ? (
                                                    <LessonResourceLinks urls={resourceLinks} />
                                                ) : bodyMd ? (
                                                    <MarkdownContent reading markdown={bodyMd} />
                                                ) : lesson.documentHtml ? (
                                                // Fallback for un-migrated lessons whose body still lives as HTML in `videoRef`.
                                                    <LessonDocumentHtml html={lesson.documentHtml} />
                                                ) : isReadingEmpty ? (
                                                    <EmptyContent
                                                        icon={<BookOpenIcon aria-hidden focusable="false" className="size-8 text-muted" />}
                                                        title={t("content.empty2")}
                                                    />
                                                ) : null}
                                            </div>
                                            {/* Medium-style teaser fade behind the paywall — ONLY for a
                                                    DOCUMENT free-trial preview with teaser text to fade. A VIDEO
                                                    (or fully-locked) lesson never gets this article blur — the
                                                    video has its own preview clamp; `showDocumentPreviewTeaser`
                                                    is false in this legacy (non-DOCUMENT) path. The overlay is
                                                    `inset-0` (exactly the article box) with a transparent top
                                                    half, so on a SHORT body it can never exceed the article and
                                                    spill upward over the title. */}
                                            {showDocumentPreviewTeaser && hasTeaserBody ? (
                                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-50% via-surface/60 to-surface" />
                                            ) : null}
                                        </div>
                                        {/* one-tap reaction + view count for a finished, readable lesson */}
                                        {!isLocked && !isReadingEmpty ? (
                                            <LessonReactionFooter contentId={contentId} accessLevel={accessLevel} />
                                        ) : null}
                                        {showLegacyPaywall ? (
                                            <div className="mt-6 flex flex-col items-start gap-3 border-t border-default pt-6">
                                                <LockSimpleIcon aria-hidden focusable="false" className="size-8 text-accent" />
                                                <Typography type="body" weight="semibold">
                                                    {isPreview
                                                        ? t("reader.previewTitle")
                                                        : lockedPackageNames
                                                            ? t("reader.lockedTitlePackages", { packages: lockedPackageNames })
                                                            : t("reader.lockedTitle")}
                                                </Typography>
                                                <Typography type="body-sm" color="muted">
                                                    {isPreview
                                                        ? t("reader.previewBody")
                                                        : t("reader.lockedBody")}
                                                </Typography>
                                                {isPreview && lesson?.teaser?.cheapestPackage ? (
                                                    <Typography type="body-sm" color="muted">
                                                        {t("reader.previewCheapest", {
                                                            name: lesson.teaser.cheapestPackage.name,
                                                            price: format.number(Number(lesson.teaser.cheapestPackage.salePrice)),
                                                        })}
                                                    </Typography>
                                                ) : null}
                                                <Button variant="primary" onPress={() => openGate(lesson.isVideoLesson ? "video" : "document")}>
                                                    {t("reader.enrollCta")}
                                                </Button>
                                            </div>
                                        ) : null}
                                    </CardContent>
                                </Card>
                            </div>
                        ) : !isLocked ? (
                        // video-only lesson: no empty paper — just the reaction bar
                            <div className="mx-auto w-full max-w-3xl">
                                <LessonReactionFooter contentId={contentId} accessLevel={accessLevel} />
                            </div>
                        ) : null}

                        {/* engagement + navigation OUTSIDE the reading card (hidden while locked) */}
                        {!isLocked ? (
                            <div className="flex flex-col gap-6 pb-6">
                                {/* "Làm thử thách" — a clear trial CTA after the lesson content
                                        when this accessible (free/trial FULL) lesson carries a FREE
                                        challenge, so a trial learner sees the challenge to do after
                                        studying. Routes to the free challenge's solver (no paywall).
                                        Non-free challenges leave `freeChallengeSlug` null → no CTA
                                        (they keep the existing Challenges-tab + BE access gate). */}
                                {lesson.freeChallengeSlug ? (
                                    <TrialChallengeCta
                                        className="mx-auto w-full max-w-3xl"
                                        onOpen={() =>
                                            router.push(
                                                challengeHref(
                                                    courseId,
                                                    lesson.moduleId,
                                                    contentId,
                                                        lesson.freeChallengeSlug!,
                                                ),
                                            )
                                        }
                                    />
                                ) : null}
                                {/* quiz block — real taker contract; only for lessons that
                                        carry a PUBLISHED quiz (no request otherwise) */}
                                {lesson.hasQuiz ? (
                                    <LessonQuizBlock
                                        lessonId={contentId}
                                        courseId={courseId}
                                        className="mx-auto w-full max-w-3xl"
                                    />
                                ) : null}
                                <LessonCompletion
                                    key={contentId}
                                    contentId={contentId}
                                    hasVideo={lesson.hasVideo}
                                    isCompleted={lesson.isCompleted}
                                    registerFire={registerFire}
                                    onCelebrate={handleCelebrate}
                                />
                                <LessonComments courseId={courseId} contentId={contentId} className="mx-auto w-full max-w-3xl" />
                                <LessonPager
                                    className="mx-auto w-full max-w-3xl"
                                    prevHref={lesson.prevId ? readerHref(courseId, lesson.prevId) : null}
                                    prevTitle={lesson.prevTitle}
                                    nextHref={lesson.nextId ? readerHref(courseId, lesson.nextId) : null}
                                    nextTitle={lesson.nextTitle}
                                />
                            </div>
                        ) : null}
                    </>
                ) : null}
            </AsyncContent>

            {lesson ? (
                <PackageGateModal
                    isOpen={gateOpen}
                    onClose={() => setGateOpen(false)}
                    courseId={courseId}
                    courseRawId={lesson.courseRawId}
                    courseTitle={lesson.courseTitle}
                    courseCoverUrl={lesson.courseCoverUrl}
                    lessonId={contentId}
                    lessonTitle={lesson.title}
                    packageSlugs={lesson.packageSlugs}
                    cheapestPackage={lesson.teaser?.cheapestPackage}
                    context={gateContext}
                    onPurchased={() => { void revalidateLearnData(courseId) }}
                />
            ) : null}
        </div>
    )
}

/**
 * Lesson completion — now fully automatic (no manual "Mark as complete" CTA).
 * Renders NOTHING: it is a headless progress engine (the sidebar row is where a
 * finished lesson reads as done), so never drop it for "looking empty".
 *
 *  - VIDEO lessons complete when the learner has watched ≥ 50% of the video: the
 *    player reports that through the parent's `onHalfWatched`, which the parent
 *    routes to this component's guarded `fire` via `registerFire`.
 *  - DOCUMENT lessons (no video) complete on EXIT — leaving the lesson (this keyed
 *    instance unmounts on a contentId change / route change) or closing the tab
 *    (`beforeunload`, best-effort).
 *
 * Idempotency: `completed` is SEEDED from the server (`isCompleted`), so a reload of
 * an already-complete lesson starts completed and never fires. `fire` is guarded by
 * both the seeded/live completed flag (via ref) and a per-session once-flag, then
 * revalidates every course-progress key so the rail meter + n/m counter advance.
 * Keyed on `contentId` by the caller, so each lesson gets its own guard + refs.
 */
const LessonCompletion = ({
    contentId,
    hasVideo,
    isCompleted,
    registerFire,
    onCelebrate,
}: {
    contentId: string
    hasVideo: boolean
    isCompleted: boolean
    registerFire: (fn: (() => void) | null) => void
    /**
     * Fired ONCE on a learner-driven, on-page completion (video ≥50%) so the parent
     * can render the transient cheer beside the player. Never called on the
     * server-seeded / late-flip already-complete path, so revisiting a finished
     * lesson never re-celebrates.
     */
    onCelebrate?: () => void
}) => {
    const mark = usePostMarkLessonCompleteSwr()
    const [completed, setCompleted] = useState(isCompleted)
    /** Per-session once-guard: never send twice for this lesson instance. */
    const firedRef = useRef(false)
    /** Latest known already-complete state — read inside fire / cleanup handlers. */
    const completedRef = useRef(isCompleted)
    completedRef.current = isCompleted || completed
    /** Stable trigger handle so `fire` doesn't churn while the mutation runs. */
    const triggerRef = useRef(mark.trigger)
    triggerRef.current = mark.trigger

    const fire = useCallback(async (opts?: { celebrate?: boolean }) => {
        // NEVER send if the lesson is already complete (server-seeded) or we already sent.
        if (completedRef.current || firedRef.current) {
            return
        }
        firedRef.current = true
        try {
            await triggerRef.current(contentId)
            setCompleted(true)
            // Celebrate only when the completion happened WHILE the learner is on the
            // page (video ≥50%) — the exit-fire path (document lessons) unmounts this
            // component, so there is nothing to cheer to. The parent renders the cheer
            // beside the player; the transient itself caps to once per lesson via persistence.
            if (opts?.celebrate) {
                onCelebrate?.()
            }
            // Revalidate any mounted course-progress query (the rail lives in another tree).
            await globalMutate((key) => Array.isArray(key) && key[0] === "GET_COURSE_PROGRESS")
        } catch {
            firedRef.current = false
        }
    }, [contentId, onCelebrate])

    // Register this lesson's guarded fire so the video player's ≥50% signal reaches it.
    // This is the on-page path, so it opts into the completion cheer.
    useEffect(() => {
        registerFire(() => void fire({ celebrate: true }))
        return () => registerFire(null)
    }, [registerFire, fire])

    // Late server progress (query resolves after mount) flips us to completed.
    useEffect(() => {
        if (isCompleted) {
            setCompleted(true)
        }
    }, [isCompleted])

    // Document lessons: tell the BE the lesson was OPENED, once, on mount.
    //
    // `POST /courses/lessons/{id}/complete` is rejected `409 COURSE_STATE_INVALID`
    // ("Lesson must be opened before it can be marked complete") unless a `LessonProgress`
    // row already exists — the BE's anti-cheat, so nobody can complete a lesson (and earn a
    // certificate) without ever opening it. The ONLY writer of that row is
    // `PUT /courses/lessons/{id}/progress`, which until now was called exclusively by
    // `useWatchPositionReporter` — a VIDEO-only hook. Document/slide lessons therefore never
    // had a progress row, so the exit-fire below ALWAYS 409'd and their completion never
    // persisted (course progress stuck at 0%, verified against apitest 2026-07-27).
    // A `watchedSeconds: 0` report is exactly the "opened" signal the BE guard asks for
    // (it upserts the row as `IN_PROGRESS`; the value is monotonic so it never lowers a
    // resume point). Fire-and-forget: a failure here just leaves the old 409 behaviour.
    useEffect(() => {
        if (hasVideo || isCompleted) {
            return
        }
        void reportLessonProgress(contentId, {
            watchedSeconds: 0,
            videoDurationSeconds: null,
        }).catch(() => {})
    }, [hasVideo, isCompleted, contentId])

    // Document lessons: complete on exit. This instance is keyed on contentId, so the
    // cleanup runs when the learner navigates to another lesson / leaves the reader
    // ("next lesson", prev, rail, breadcrumb). `beforeunload` covers a tab close.
    useEffect(() => {
        if (hasVideo) {
            return
        }
        const mountedAt = Date.now()
        const onExit = () => void fire()
        window.addEventListener("beforeunload", onExit)
        return () => {
            window.removeEventListener("beforeunload", onExit)
            // Only treat this as a real "left the lesson" exit after a brief dwell — this
            // skips React StrictMode's immediate dev remount (whose cleanup runs within a
            // tick) and a sub-second glance-and-leave (no meaningful engagement).
            if (Date.now() - mountedAt > 800) {
                onExit()
            }
        }
    }, [hasVideo, fire])

    // Nothing to render at the bottom of the lesson: no manual CTA and no "already
    // completed" badge (the content map turns a finished lesson green instead). The
    // transient cheer for an on-page completion is rendered by the parent beside the
    // player (see `onCelebrate`). The effects above are the whole job.
    return null
}

/** Prev / next pager cards (StarCI port — prev left, next right). */
const LessonPager = ({
    className,
    prevHref,
    prevTitle,
    nextHref,
    nextTitle,
}: {
    className?: string
    prevHref: string | null
    prevTitle: string | null
    nextHref: string | null
    nextTitle: string | null
}) => {
    const t = useTranslations("learn")
    if (!prevHref && !nextHref) {
        return null
    }
    return (
        <div className={className}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {prevHref ? (
                    <PressableCard href={prevHref}>
                        <div className="flex items-center gap-2">
                            <CaretLeftIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                            <div className="flex min-w-0 flex-col">
                                <Typography type="body-xs" color="muted">
                                    {t("content.prevLesson")}
                                </Typography>
                                <Typography type="body-sm" weight="medium" className="line-clamp-2">
                                    {prevTitle}
                                </Typography>
                            </div>
                        </div>
                    </PressableCard>
                ) : (
                    <div />
                )}
                {nextHref ? (
                    <PressableCard href={nextHref} className="sm:col-start-2">
                        <div className="flex items-center justify-end gap-2">
                            <div className="flex min-w-0 flex-col items-end">
                                <Typography type="body-xs" color="muted">
                                    {t("content.nextLesson")}
                                </Typography>
                                <Typography type="body-sm" weight="medium" className="line-clamp-2 text-right">
                                    {nextTitle}
                                </Typography>
                            </div>
                            <CaretRightIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                        </div>
                    </PressableCard>
                ) : null}
            </div>
        </div>
    )
}

/**
 * "Làm thử thách" — the trial call-to-action shown after the lesson content when the
 * lesson is accessible (free/trial FULL) and carries a FREE challenge. A prominent
 * accent card so a trial learner sees the challenge to do after studying, routing
 * straight into the free challenge's solver.
 */
const TrialChallengeCta = ({
    className,
    onOpen,
}: {
    className?: string
    onOpen: () => void
}) => {
    const t = useTranslations("learn")
    return (
        <div className={className}>
            <div className="flex flex-col items-start gap-3 rounded-3xl border border-accent/40 bg-accent/5 p-6">
                <div className="flex items-center gap-2">
                    <PuzzlePieceIcon aria-hidden focusable="false" className="size-6 text-accent" />
                    <Typography type="body" weight="semibold">
                        {t("reader.trialChallengeTitle")}
                    </Typography>
                    <Chip size="sm" variant="soft" color="accent" className="shrink-0">
                        {t("reader.trialChallengeBadge")}
                    </Chip>
                </div>
                <Typography type="body-sm" color="muted">
                    {t("reader.trialChallengeBody")}
                </Typography>
                <Button variant="primary" onPress={onOpen}>
                    <span className="flex items-center gap-1">
                        {t("reader.trialChallengeCta")}
                        <CaretRightIcon aria-hidden focusable="false" className="size-4" />
                    </span>
                </Button>
            </div>
        </div>
    )
}

/** Header skeleton — mirrors title + description + meta chips. */
const HeaderSkeleton = () => (
    <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-40 rounded-md" />
        <Skeleton className="h-7 w-2/3 rounded-large" />
        <Skeleton className="h-4 w-full rounded-md" />
        <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
        </div>
    </div>
)
