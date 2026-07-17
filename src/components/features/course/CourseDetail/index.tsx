"use client"

import React, { useMemo, useState } from "react"
import { Button, Chip, Link, Typography, cn } from "@heroui/react"
import {
    BookIcon,
    BookOpenIcon,
    CaretDownIcon,
    CaretRightIcon,
    CertificateIcon,
    CheckCircleIcon,
    CheckIcon,
    CircleIcon,
    ClockIcon,
    GithubLogoIcon,
    GlobeIcon,
    GraduationCapIcon,
    LinkedinLogoIcon,
    LockIcon,
    PlayCircleIcon,
    PuzzlePieceIcon,
    ShoppingCartIcon,
    StackIcon,
    StarIcon,
    TrashIcon,
    TrophyIcon,
    UsersIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { useParams } from "next/navigation"
import { useSWRConfig } from "swr"
import { useRouter } from "@/i18n/navigation"
import { useGetCoursePackageProductSwr } from "@/hooks/swr/api/rest/queries/useGetCoursePackageProductSwr"
import { useGetCartSwr } from "@/hooks/swr/api/rest/queries/useGetCartSwr"
import { usePostAddCartItemSwr } from "@/hooks/swr/api/rest/mutations/usePostAddCartItemSwr"
import { usePostRemoveCartItemSwr } from "@/hooks/swr/api/rest/mutations/usePostRemoveCartItemSwr"
import { usePaymentOverlayState } from "@/hooks/zustand/overlay/hooks"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { SaveButton } from "@/components/blocks/buttons/SaveButton"
import { HighlightChip } from "@/components/blocks/chips/HighlightChip"
import { ResponsiveBreadcrumb } from "@/components/blocks/navigation/ResponsiveBreadcrumb"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { FollowButton } from "@/components/reuseable/FollowButton"
import { StatRibbon } from "@/components/reuseable/StatRibbon"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { useQueryCourseDetailSwr, type CourseDetail as CourseDetailModel, type CourseEnrollmentPlan, type CourseInstructor } from "../hooks/useQueryCourseDetailSwr"
import { useCourseEnrollment } from "../hooks/useCourseEnrollment"
import { useQueryCoursePackagesSwr } from "../hooks/useQueryCoursePackagesSwr"
import { CourseRatings } from "./CourseRatings"
import { SelectableCardGroup } from "@/components/blocks/navigation/SelectableCardGroup"
import { PriceTag } from "@/components/blocks/commerce/PriceTag"
import type { PackageView } from "@/modules/api/rest/course"
import type { Icon } from "@phosphor-icons/react"

const ACHIEVEMENT_ICONS: Record<string, Icon> = {
    certificate: CertificateIcon,
    trophy: TrophyIcon,
    book: BookIcon,
}

/**
 * Fallback tier labels for the known package slugs — used only while the course's
 * package list is still loading (the real `PackageView.name` is the source of truth).
 */
const TIER_LABEL_FALLBACK: Record<string, string> = {
    free: "Miễn phí",
    basic: "Cơ bản",
    premium: "Premium",
    master: "Master",
    "on-tap-thuc-chien": "Ôn tập thực chiến",
}

/** Title-case a slug (`on-tap-thuc-chien` → `On Tap Thuc Chien`) as a last-resort label. */
const titleCaseSlug = (slug: string) =>
    slug
        .split("-")
        .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
        .join(" ")

/**
 * Build the reader route for a syllabus lesson — mirrors the learn rail's
 * `lessonHref` (`ContentMap`) so a syllabus click lands on the exact same reader
 * URL. The `[moduleId]` segment is cosmetic (the reader resolves purely from
 * `[contentId]`), so the rail derives it from the lesson id's first UUID segment;
 * we replicate that verbatim. `courseId` here is the slug (`course.id`).
 */
const lessonReaderHref = (courseId: string, lessonId: string) =>
    `/courses/${courseId}/learn/content/modules/${lessonId.split("-")[0]}/contents/${lessonId}`

/** Rich instructor profile card for the course detail page.
 *
 * A presentational feature sub-component: it receives the instructor data and
 * owns the follow toggle's local FE-only state. All styling is delegated to
 * existing reuseable primitives and HeroUI components.
 */
const InstructorCard = ({ instructor }: { instructor: CourseInstructor }) => {
    const t = useTranslations("courseSystem")
    const [following, setFollowing] = useState(false)
    const links = instructor.links
    const hasLinks = links && (links.github || links.linkedin || links.website)

    return (
        <div className="flex flex-col gap-3 border-t border-separator pt-6">
            <Typography type="h6" weight="bold">
                {t("detail.instructor.title")}
            </Typography>
            <div className="flex flex-col gap-4 rounded-2xl border border-separator p-4">
                <div className="flex items-start gap-3">
                    <UserAvatar
                        username={instructor.name}
                        avatar={instructor.avatarUrl}
                        seed={instructor.name}
                        size="lg"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-0">
                        <Typography type="body" weight="semibold">
                            {instructor.name}
                        </Typography>
                        <Typography type="body-sm" color="muted">
                            {instructor.title}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {instructor.role}
                        </Typography>
                    </div>
                    <FollowButton following={following} onToggle={() => setFollowing((prev) => !prev)} />
                </div>

                <StatRibbon
                    items={[
                        {
                            key: "courses",
                            icon: <GraduationCapIcon aria-hidden focusable="false" className="size-4" />,
                            value: instructor.stats.courses,
                            label: t("detail.instructor.stats.courses", { count: instructor.stats.courses }),
                        },
                        {
                            key: "students",
                            icon: <UsersIcon aria-hidden focusable="false" className="size-4" />,
                            value: instructor.stats.students.toLocaleString(),
                            label: t("detail.instructor.stats.students", { count: instructor.stats.students }),
                        },
                        {
                            key: "rating",
                            icon: <StarIcon aria-hidden focusable="false" className="size-4" weight="fill" />,
                            value: instructor.stats.rating.toFixed(1),
                            label: t("detail.instructor.stats.rating", { rating: instructor.stats.rating }),
                        },
                    ]}
                />

                <Typography type="body-sm" color="muted">
                    {instructor.bio}
                </Typography>

                <div className="flex flex-col gap-2">
                    <Typography type="body-sm" weight="medium">
                        {t("detail.instructor.achievements")}
                    </Typography>
                    <ul className="flex flex-col gap-2">
                        {instructor.achievements.map((achievement) => {
                            const IconComponent = ACHIEVEMENT_ICONS[achievement.icon]
                            return (
                                <li key={achievement.id} className="flex items-start gap-2">
                                    {IconComponent ? (
                                        <IconComponent
                                            aria-hidden
                                            focusable="false"
                                            className="mt-0.5 size-4 shrink-0 text-accent"
                                        />
                                    ) : null}
                                    <Typography type="body-sm" color="muted">
                                        {achievement.text}
                                    </Typography>
                                </li>
                            )
                        })}
                    </ul>
                </div>

                {hasLinks ? (
                    <div className="flex items-center gap-3">
                        {links?.github ? (
                            <Link
                                href={links.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={t("detail.instructor.social.github", { name: instructor.name })}
                                className="text-muted hover:text-accent"
                            >
                                <GithubLogoIcon aria-hidden focusable="false" className="size-5" />
                            </Link>
                        ) : null}
                        {links?.linkedin ? (
                            <Link
                                href={links.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={t("detail.instructor.social.linkedin", { name: instructor.name })}
                                className="text-muted hover:text-accent"
                            >
                                <LinkedinLogoIcon aria-hidden focusable="false" className="size-5" />
                            </Link>
                        ) : null}
                        {links?.website ? (
                            <Link
                                href={links.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={t("detail.instructor.social.website", { name: instructor.name })}
                                className="text-muted hover:text-accent"
                            >
                                <GlobeIcon aria-hidden focusable="false" className="size-5" />
                            </Link>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    )
}

/**
 * Course detail / sales page (§4) — direction A (chosen 2026-07-02): a two-column
 * layout, content scrolling on the left (hero → what-you'll-learn → syllabus →
 * reviews → instructor) with a STICKY enroll card on the right (cover, price,
 * enroll CTA, "what's included"). The Coursera sales pattern.
 *
 * CTA copy is ENROLL ("Đăng ký học"), never "buy"/"VIP" — premium content unlocks
 * by enrolling the course (rule premium-unlock-is-enroll-not-vip). Price is VND
 * (charged, via {@link PriceTag}) with a muted USD reference below.
 *
 * Feature owns data + routing + i18n; blocks (PriceTag, ResponsiveBreadcrumb,
 * AsyncContent, Skeleton) own their styling. ponytail: data is FE-mocked until the
 * BE course contract lands; the "Học thử" CTA is wired to `useMutateStartTrialSwr`
 * best-effort. The syllabus expander is hand-rolled (swap to HeroUI Accordion once
 * its v3 API is confirmed).
 */
export const CourseDetail = () => {
    const t = useTranslations("courseSystem")
    const router = useRouter()
    const { courseId } = useParams<{ courseId: string }>()
    const { course, error, mutate } = useQueryCourseDetailSwr(courseId)

    return (
        <div className="mx-auto w-full max-w-7xl p-6">
            <AsyncContent
                isLoading={!course && !error}
                skeleton={<CourseDetailSkeleton />}
                error={!course ? error : undefined}
                errorContent={{
                    title: t("detail.loadError"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("detail.retry"),
                }}
            >
                {course ? (
                    <CourseDetailView
                        course={course}
                        onCourses={() => router.push("/courses")}
                    />
                ) : null}
            </AsyncContent>
        </div>
    )
}

/** Presentation of a loaded course. Owns the syllabus expand/collapse UI state. */
const CourseDetailView = ({
    course,
    onCourses,
}: {
    course: CourseDetailModel
    onCourses: () => void
}) => {
    const t = useTranslations("courseSystem")
    const router = useRouter()
    // Open a non-locked syllabus lesson in the reader (same route the learn rail uses).
    // Fallback to the reader entry when a lesson id is somehow absent.
    const openLesson = (lessonId: string) =>
        router.push(lessonId ? lessonReaderHref(course.id, lessonId) : `/courses/${course.id}/learn`)
    // PACKAGE courses sell N distinct packages (each its own COURSE_UNLOCK product),
    // so they render the dedicated package picker (PackageEnrollCard) which resolves
    // per-package. Everything else (LEGACY / absent saleMode) keeps the legacy card.
    const isPackage = course.saleMode === "PACKAGE"
    // Package names for the syllabus tier badge: map `lesson.packageSlugs[0]` → the
    // admin-authored `PackageView.name`. Same SWR key as PackageEnrollCard's call →
    // deduped; gated on `isPackage` so it never fires for a LEGACY course.
    const { packages } = useQueryCoursePackagesSwr(course.rawId, { enabled: isPackage })
    const packageNameBySlug = useMemo(
        () => new Map(packages.map((pkg) => [pkg.slug, pkg.name])),
        [packages],
    )
    const resolveTierLabel = (slug: string) =>
        packageNameBySlug.get(slug) ?? TIER_LABEL_FALLBACK[slug] ?? titleCaseSlug(slug)
    // The legacy "Đăng ký học" CTA is a real buy: the enrollment hook resolves this
    // course's COURSE_UNLOCK product, adds it to the cart, and opens the shared
    // PaymentModal (VietQR / coin). The buy context is withheld for PACKAGE courses
    // (resolved per-package by PackageEnrollCard) so we never add an arbitrary product.
    const { isEnrolled, onEnroll, isEnrolling, onContinueLearning, onTryLearning } = useCourseEnrollment(
        course.id,
        course.enrollment,
        isPackage ? undefined : { rawId: course.rawId, title: course.name },
    )
    // ponytail: hand-rolled accordion state — first chapter open. Set, not boolean-per-row,
    // so multiple chapters can be open. Swap to HeroUI Accordion when its API is confirmed.
    const [openSections, setOpenSections] = useState<Set<string>>(
        () => new Set(course.sections[0] ? [course.sections[0].id] : []),
    )
    const toggle = (id: string) =>
        setOpenSections((prev) => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })

    const totalLessons = course.sections.reduce((sum, section) => sum + section.lessons.length, 0)
    const moduleCount = course.sections.length
    // Fields below are optional in the CourseDetail contract; render TODO when absent.
    const enrollmentCount = course.enrollmentCount ?? null
    const hoursValue = course.durationHours ?? null
    const challengeCountValue = course.challengeCount ?? null

    return (
        <div className="flex flex-col gap-6">
            <ResponsiveBreadcrumb
                items={[
                    { key: "courses", label: t("catalog.title"), onPress: onCourses },
                    { key: course.id, label: course.code },
                ]}
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
                {/* LEFT — scrolling content */}
                <div className="flex flex-col gap-6 md:col-span-3">
                    {/* hero */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                            <Typography type="h4" weight="bold" className="min-w-0 flex-1">
                                {course.code} · {course.name}
                            </Typography>
                            <SaveButton entityType="course" entityId={course.id} />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Chip size="sm" variant="soft" color="accent">
                                {t(`levels.${course.level}`)}
                            </Chip>
                            {course.credits > 0 ? (
                                <Chip size="sm" variant="soft" color="default">
                                    {t("detail.credits", { count: course.credits })}
                                </Chip>
                            ) : null}
                            <span className="flex items-center gap-2 text-sm text-muted">
                                <StarIcon aria-hidden focusable="false" weight="fill" className="size-4 text-accent" />
                                {course.rating.avg.toFixed(1)} · {t("detail.ratings", { count: course.rating.count })}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {enrollmentCount !== null ? (
                                <HighlightChip
                                    tone="neutral"
                                    icon={<UsersIcon aria-hidden focusable="false" className="size-4" />}
                                    value={enrollmentCount}
                                    label={t("detail.stats.learners")}
                                />
                            ) : null}
                            <HighlightChip
                                tone="neutral"
                                icon={<StackIcon aria-hidden focusable="false" className="size-4" />}
                                value={moduleCount}
                                label={t("detail.stats.modules")}
                            />
                            <HighlightChip
                                tone="neutral"
                                icon={<BookOpenIcon aria-hidden focusable="false" className="size-4" />}
                                value={totalLessons}
                                label={t("detail.stats.lessons")}
                            />
                            {hoursValue !== null ? (
                                <HighlightChip
                                    tone="neutral"
                                    icon={<ClockIcon aria-hidden focusable="false" className="size-4" />}
                                    value={hoursValue}
                                    label={t("detail.stats.hours")}
                                />
                            ) : null}
                            {challengeCountValue !== null ? (
                                <HighlightChip
                                    tone="neutral"
                                    icon={<PuzzlePieceIcon aria-hidden focusable="false" className="size-4" />}
                                    value={challengeCountValue}
                                    label={t("detail.stats.challenges")}
                                />
                            ) : null}
                        </div>
                        <Typography type="body-sm" color="muted">
                            {course.description}
                        </Typography>
                        {course.instructor ? (
                            <Typography type="body-sm" color="muted">
                                {t("detail.instructorLine", { name: course.instructor.name })}
                            </Typography>
                        ) : null}
                    </div>

                    {/* what you'll learn */}
                    {course.whatYouLearn.length > 0 ? (
                        <div className="flex flex-col gap-3 border-t border-separator pt-6">
                            <Typography type="h6" weight="bold">
                                {t("detail.whatYouLearn")}
                            </Typography>
                            <ul className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
                                {course.whatYouLearn.map((item) => (
                                    <li key={item} className="flex items-start gap-2">
                                        <CheckCircleIcon
                                            aria-hidden
                                            focusable="false"
                                            className="mt-0.5 size-5 shrink-0 text-accent"
                                        />
                                        <Typography type="body-sm" color="muted">
                                            {item}
                                        </Typography>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    {/* syllabus */}
                    <div className="flex flex-col gap-3 border-t border-separator pt-6">
                        <Typography type="h6" weight="bold">
                            {t("detail.outline")}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {t("detail.outlineMeta", {
                                sections: course.sections.length,
                                lessons: totalLessons,
                                duration: course.durationLabel,
                            })}
                        </Typography>
                        <div className="flex flex-col overflow-hidden rounded-2xl border border-separator">
                            {course.sections.map((section, index) => {
                                const isOpen = openSections.has(section.id)
                                return (
                                    <div
                                        key={section.id}
                                        className={cn(index > 0 && "border-t border-separator")}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => toggle(section.id)}
                                            aria-expanded={isOpen}
                                            className="flex w-full items-center gap-2 p-4 text-left transition-colors hover:bg-default/40"
                                        >
                                            {isOpen ? (
                                                <CaretDownIcon aria-hidden focusable="false" className="size-4 shrink-0 text-muted" />
                                            ) : (
                                                <CaretRightIcon aria-hidden focusable="false" className="size-4 shrink-0 text-muted" />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                {/* Description is the prominent title on top (e.g. "Tổng hợp
                                                    Tài Liệu"); the real section name (e.g. "Phần 0") is a small
                                                    muted tag below. No description → the name becomes the title
                                                    and the tag line is dropped (avoid an empty/duplicate label). */}
                                                <Typography type="body-sm" weight="medium" className="line-clamp-2">
                                                    {section.description || section.title}
                                                </Typography>
                                                {section.description ? (
                                                    <Typography type="body-xs" color="muted" className="line-clamp-1">
                                                        {section.title}
                                                    </Typography>
                                                ) : null}
                                            </div>
                                            <Typography type="body-xs" color="muted" className="shrink-0">
                                                {t("catalog.lessonsCount", { count: section.lessons.length })}
                                            </Typography>
                                        </button>
                                        {isOpen ? (
                                            <div className="flex flex-col">
                                                {section.lessons.map((lesson) => {
                                                    // Lock is the per-viewer `isLocked` (NOT `!free`): an enrolled
                                                    // viewer's premium lessons are unlocked → clickable into the reader.
                                                    const rowContent = (
                                                        <>
                                                            {lesson.isLocked ? (
                                                                <LockIcon aria-hidden focusable="false" className="size-4 shrink-0 text-muted" />
                                                            ) : (
                                                                <PlayCircleIcon aria-hidden focusable="false" className="size-4 shrink-0 text-accent" />
                                                            )}
                                                            <div className="min-w-0 flex-1">
                                                                <Typography type="body-sm" weight="medium" className="line-clamp-2">
                                                                    {lesson.description || lesson.title}
                                                                </Typography>
                                                                {lesson.description ? (
                                                                    <Typography type="body-xs" color="muted" className="line-clamp-1">
                                                                        {lesson.title}
                                                                    </Typography>
                                                                ) : null}
                                                            </div>
                                                            {(() => {
                                                                // Render ALL paid packages that unlock this lesson (except
                                                                // the pseudo "free" slug). Sort cheapest-first by salePrice.
                                                                const paidSlugs = (lesson.packageSlugs ?? [])
                                                                    .filter((slug) => slug !== "free")
                                                                const slugPrice = new Map(
                                                                    packages.map((pkg) => [pkg.slug, Number(pkg.salePrice)]),
                                                                )
                                                                const sortedSlugs = [...paidSlugs].sort(
                                                                    (a, b) => (slugPrice.get(a) ?? Infinity) - (slugPrice.get(b) ?? Infinity),
                                                                )
                                                                if (sortedSlugs.length > 0) {
                                                                    return (
                                                                        <div className="flex flex-wrap items-center justify-end gap-1">
                                                                            {sortedSlugs.map((slug) => (
                                                                                <Chip
                                                                                    key={slug}
                                                                                    size="sm"
                                                                                    variant="soft"
                                                                                    color="accent"
                                                                                    className="shrink-0"
                                                                                >
                                                                                    {resolveTierLabel(slug)}
                                                                                </Chip>
                                                                            ))}
                                                                        </div>
                                                                    )
                                                                }
                                                                // LEGACY course (no packageSlugs) still locked for the
                                                                // viewer → keep the old generic "Premium" tag.
                                                                if (paidSlugs.length === 0 && lesson.isLocked) {
                                                                    return (
                                                                        <Chip size="sm" variant="soft" color="accent" className="shrink-0">
                                                                            {t("detail.premium")}
                                                                        </Chip>
                                                                    )
                                                                }
                                                                return null
                                                            })()}
                                                            <Typography type="body-xs" color="muted">
                                                                {lesson.durationLabel}
                                                            </Typography>
                                                        </>
                                                    )
                                                    // Locked rows stay non-navigating (the sticky enroll card on this
                                                    // very page is the buy flow); unlocked rows open the reader.
                                                    return lesson.isLocked ? (
                                                        <div
                                                            key={lesson.id}
                                                            className="flex items-center gap-3 border-t border-separator px-4 py-3 pl-10"
                                                        >
                                                            {rowContent}
                                                        </div>
                                                    ) : (
                                                        <button
                                                            key={lesson.id}
                                                            type="button"
                                                            onClick={() => openLesson(lesson.id)}
                                                            className="flex w-full items-center gap-3 border-t border-separator px-4 py-3 pl-10 text-left transition-colors hover:bg-default/40"
                                                        >
                                                            {rowContent}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        ) : null}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* reviews — real BE-wired ratings (aggregate + list + composer) */}
                    <CourseRatings courseId={course.rawId} />

                    {/* instructor — hidden when the BE detail carries none */}
                    {course.instructor ? (
                        <InstructorCard instructor={course.instructor} />
                    ) : null}
                </div>

                {/* RIGHT — sticky enroll card. PACKAGE courses get the real package
                    picker; LEGACY / absent saleMode keep the Free/Premium tiers. */}
                <div className="md:col-span-2">
                    {isPackage ? (
                        <PackageEnrollCard
                            course={course}
                            isEnrolled={isEnrolled}
                            onContinueLearning={onContinueLearning}
                            onTryLearning={onTryLearning}
                        />
                    ) : (
                        <EnrollCard
                            course={course}
                            isEnrolled={isEnrolled}
                            onEnroll={onEnroll}
                            isEnrolling={isEnrolling}
                            onContinueLearning={onContinueLearning}
                            onTryLearning={onTryLearning}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

type EnrollCardProps = {
    course: CourseDetailModel
    isEnrolled: boolean
    onEnroll: () => void
    /** Add-to-cart in flight — drives the enroll CTA's pending state. */
    isEnrolling?: boolean
    onContinueLearning: () => void
    onTryLearning: () => void
}

/**
 * The sticky purchase/enroll card on the course detail right column.
 *
 * - Not enrolled: shows a Free/Premium tier switcher, the selected tier's price,
 *   a primary "Đăng ký học" CTA and a secondary "Học thử miễn phí" CTA.
 * - Enrolled: collapses to a single "Tiếp tục học" primary CTA.
 *
 * ponytail: plan data, prices, and benefits are mock until the BE course contract
 * lands. The "continue" / "try" routes use the canonical `/learn` path which is
 * currently a FE placeholder.
 */
const EnrollCard = ({
    course,
    isEnrolled,
    onEnroll,
    isEnrolling,
    onContinueLearning,
    onTryLearning,
}: EnrollCardProps) => {
    const t = useTranslations("courseSystem")
    const [selectedTier, setSelectedTier] = useState<"free" | "premium">("free")
    const activePlan: CourseEnrollmentPlan = course.plans[selectedTier]

    return (
        <div className="flex flex-col gap-2.5 rounded-2xl border border-separator p-4 md:sticky md:top-20">
            <CardCover coverUrl={course.coverUrl} alt={course.name} />

            {isEnrolled ? (
                <>
                    <Button variant="primary" fullWidth onPress={onContinueLearning}>
                        {t("detail.continueLearning")}
                    </Button>
                    <Typography type="body-xs" color="muted" align="center">
                        {t("detail.enrolledHint")}
                    </Typography>
                </>
            ) : (
                <>
                    <SelectableCardGroup
                        ariaLabel={t("detail.planSelectorAria")}
                        columns={1}
                        value={selectedTier}
                        onChange={setSelectedTier}
                        items={(["free", "premium"] as const).map((key) => {
                            const plan = course.plans[key]
                            const isSelected = selectedTier === key
                            return {
                                value: key,
                                icon: isSelected ? (
                                    <CircleIcon aria-hidden focusable="false" weight="fill" className="size-5 text-accent" />
                                ) : (
                                    <CircleIcon aria-hidden focusable="false" className="size-5 text-muted" />
                                ),
                                label: t(`detail.planNames.${plan.name}`),
                                // ponytail: price rendered as PLAIN spans, not PriceTag/Typography —
                                // those wrap React-Aria `Text`, which throws "slot prop required" when
                                // nested inside the RadioGroup's Text context.
                                badge: (
                                    <span className="flex items-center gap-2 text-sm">
                                        {plan.originalPriceVnd && plan.originalPriceVnd > plan.priceVnd ? (
                                            <span className="text-xs text-muted line-through">
                                                {plan.originalPriceVnd.toLocaleString("vi-VN")}₫
                                            </span>
                                        ) : null}
                                        <span className="font-medium text-foreground">
                                            {plan.priceVnd > 0
                                                ? `${plan.priceVnd.toLocaleString("vi-VN")}₫`
                                                : t("detail.planNames.free")}
                                        </span>
                                    </span>
                                ),
                            }
                        })}
                    />

                    {selectedTier === "premium" && course.price.usd > 0 ? (
                        <Typography type="body-xs" color="muted">
                            {t("detail.usdApprox", {
                                price: course.price.usd.toLocaleString("en-US", { style: "currency", currency: "USD" }),
                            })}
                        </Typography>
                    ) : null}

                    {selectedTier === "free" ? (
                        <Button variant="primary" fullWidth onPress={onTryLearning}>
                            {t("detail.tryFree")}
                        </Button>
                    ) : (
                        <>
                            <Button variant="primary" fullWidth onPress={onEnroll} isPending={isEnrolling}>
                                {t("detail.enroll")}
                            </Button>
                            <Button variant="secondary" fullWidth onPress={onTryLearning}>
                                {t("detail.tryFree")}
                            </Button>
                        </>
                    )}

                    <div className="flex flex-col gap-2 border-t border-separator pt-3">
                        <div className="flex items-center justify-between">
                            <Typography type="body-xs" weight="medium" color="muted">
                                {t("detail.includesTitle")}
                            </Typography>
                            {activePlan.badge ? (
                                <Chip size="sm" variant="soft" color="accent">
                                    {t(`detail.planBadges.${activePlan.badge}`)}
                                </Chip>
                            ) : null}
                        </div>
                        {activePlan.includes.map((item) => {
                            const params = item.params ?? {}
                            return (
                                <IncludeRow
                                    key={item.key}
                                    icon={<CheckCircleIcon aria-hidden focusable="false" className="size-4 text-accent" />}
                                >
                                    {t(`detail.planIncludes.${item.key}`, params)}
                                </IncludeRow>
                            )
                        })}
                    </div>
                    {course.enrollmentCount ? (
                        <Typography type="body-xs" color="muted" align="center">
                            {t("detail.enrolledCount", { count: course.enrollmentCount })}
                        </Typography>
                    ) : null}
                </>
            )}
        </div>
    )
}

/** The enroll card's 16:9 cover — the real course image, else a play-icon placeholder. */
const CardCover = ({ coverUrl, alt }: { coverUrl?: string; alt: string }) => (
    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl bg-default/40">
        {coverUrl ? (
            // ponytail: `unoptimized` skips the Next optimizer (no remotePatterns needed)
            <Image src={coverUrl} alt={alt} fill unoptimized className="object-cover" />
        ) : (
            <PlayCircleIcon aria-hidden focusable="false" className="size-10 text-muted" />
        )}
    </div>
)

/** One "what's included" row: a muted icon + label. */
const IncludeRow = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="flex items-center gap-2">
        <span className="shrink-0">{icon}</span>
        <Typography type="body-sm" color="muted">
            {children}
        </Typography>
    </div>
)

/** A package's charged (discounted) amount + the pre-discount `original` PriceTag
 * strikes through (null when there's no real saving). BE prices are strings. */
const packagePrice = (pkg: PackageView): { discounted: number; original: number | null } => {
    // salePrice is the CHARGED amount (0 = a genuinely free package); originalPrice is
    // only a strike-through reference, shown on a real paid discount. Do NOT fall back
    // to originalPrice when salePrice is 0 — that made a "FREE" package read as 100.000₫.
    const discounted = Number(pkg.salePrice) || 0
    const original = Number(pkg.originalPrice) || 0
    return { discounted, original: discounted > 0 && original > discounted ? original : null }
}

/**
 * A package's remaining scarcity/slot figure, when the contract carries one.
 *
 * ponytail: today's `PackageView` exposes NO slot/scarcity field, so this always
 * returns `null` and the orange scarcity line stays hidden — we NEVER fabricate a
 * number (see tasks Findings). The read is intentionally tolerant so the line lights
 * up the moment BE adds a real `slotAvailable` figure, without a contract change here.
 */
const packageSlots = (pkg: PackageView): number | null => {
    const slot = (pkg as { slotAvailable?: number | null }).slotAvailable
    return typeof slot === "number" && slot >= 0 ? slot : null
}

type PackageEnrollCardProps = {
    course: CourseDetailModel
    isEnrolled: boolean
    onContinueLearning: () => void
    onTryLearning: () => void
}

/**
 * The sticky enroll card for a PACKAGE course: a real package picker built from the
 * course's `GET /courses/{id}/packages` list (instead of the fabricated Free/Premium
 * tiers). Each option shows the package name, its price, and a short entitlement
 * summary; selecting one + pressing "Đăng ký gói" resolves THAT package's
 * COURSE_UNLOCK productId (via the packageId-scoped for-course endpoint) and runs the
 * exact same cart + PaymentModal checkout as the legacy buy.
 *
 * Degrades gracefully: a loading skeleton while packages resolve, and an
 * "Đang cập nhật gói" panel (never a crash) when the list errors or is empty.
 * Enrolled viewers collapse to a single "Tiếp tục học" CTA, matching {@link EnrollCard}.
 */
const PackageEnrollCard = ({
    course,
    isEnrolled,
    onContinueLearning,
    onTryLearning,
}: PackageEnrollCardProps) => {
    const t = useTranslations("courseSystem")
    const { packages, isLoading, isError, isEmpty } = useQueryCoursePackagesSwr(course.rawId, {
        enabled: !isEnrolled,
    })

    // Default selection = the flagged default package, else the first (the hook
    // already sorts by sortOrder). Derived (not effect-synced) so it settles the
    // moment packages arrive and a mount-time reset can never clobber the viewer's pick.
    const defaultId = useMemo(() => {
        if (packages.length === 0) return undefined
        return (packages.find((pkg) => pkg.defaultPackage) ?? packages[0]).id
    }, [packages])
    const [chosenId, setChosenId] = useState<string | undefined>(undefined)
    const selectedId = chosenId ?? defaultId
    const selectedPackage = packages.find((pkg) => pkg.id === selectedId)

    // Resolve the chosen package's COURSE_UNLOCK product id for the cart. Gated on a
    // real selection and skipped entirely once enrolled. `productLoading` is true only
    // during an actual fetch → the "resolving" caption shows transiently, never as a
    // permanent line once the product settles (or is unresolvable).
    const { data: product, isLoading: productLoading } = useGetCoursePackageProductSwr(
        isEnrolled ? undefined : course.rawId,
        isEnrolled ? undefined : selectedId,
    )
    const addCart = usePostAddCartItemSwr()
    const removeCart = usePostRemoveCartItemSwr()
    const payment = usePaymentOverlayState()
    const { mutate: mutateSwr } = useSWRConfig()

    // Cart membership for the resolved product → drives the primary CTA's
    // "Đăng ký gói" ↔ "Đã thêm vào giỏ" (remove) toggle. Signed-in only, and
    // skipped once enrolled (no re-buy) so a guest never fires the authed call.
    const { data: cart } = useGetCartSwr(!isEnrolled)
    const cartItem = product ? cart?.items.find((item) => item.productId === product.id) : undefined
    const inCart = Boolean(cartItem)

    // Same cart + PaymentModal checkout as the legacy onBuy, for the resolved
    // per-package product. Idle when the product hasn't resolved (buy CTA disabled).
    // If the package is ALREADY in the cart (added via the secondary CTA), reuse that
    // line instead of adding a duplicate before opening checkout.
    const onBuyPackage = async () => {
        if (!product || !selectedPackage) return
        try {
            let itemId = cartItem?.id
            if (!itemId) {
                const item = await addCart.trigger({ productId: product.id, quantity: 1 })
                itemId = item.id
                void mutateSwr("GET_CART_SWR")
            }
            payment.open({
                itemIds: [itemId],
                title: `${course.name} · ${selectedPackage.name}`,
                amountVnd: product.priceVnd ?? 0,
                amountCoin: product.priceCoin ?? undefined,
            })
        } catch {
            // add-to-cart failed → SWR surfaces the error; leave the CTA idle
        }
    }

    // Secondary CTA: add the resolved product to the cart WITHOUT opening checkout
    // (the StarCI "Thêm vào giỏ" peer action). Same add-cart trigger as buy; no-op
    // once it's already in the cart (the button flips to the remove state then).
    const onAddToCartPackage = async () => {
        if (!product || inCart) return
        try {
            await addCart.trigger({ productId: product.id, quantity: 1 })
            void mutateSwr("GET_CART_SWR")
        } catch {
            // add-to-cart failed → SWR surfaces the error; leave the CTA idle
        }
    }

    // Remove the resolved product from the cart (reachable only once it IS in cart).
    const onRemovePackage = async () => {
        if (!cartItem) return
        try {
            await removeCart.trigger(cartItem.id)
            void mutateSwr("GET_CART_SWR")
        } catch {
            // remove failed → SWR surfaces the error; leave the item in place
        }
    }

    return (
        <div className="flex flex-col gap-2.5 rounded-2xl border border-separator p-4 md:sticky md:top-20">
            <CardCover coverUrl={course.coverUrl} alt={course.name} />

            {isEnrolled ? (
                <>
                    <Button variant="primary" fullWidth onPress={onContinueLearning}>
                        {t("detail.continueLearning")}
                    </Button>
                    <Typography type="body-xs" color="muted" align="center">
                        {t("detail.enrolledHint")}
                    </Typography>
                </>
            ) : isLoading ? (
                <PackagePickerSkeleton />
            ) : isError || isEmpty || packages.length === 0 ? (
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1 rounded-xl border border-separator bg-default/40 p-4 text-center">
                        <Typography type="body-sm" weight="medium">
                            {t("detail.package.updatingTitle")}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {t("detail.package.updatingHint")}
                        </Typography>
                    </div>
                    <Button variant="secondary" fullWidth onPress={onTryLearning}>
                        {t("detail.tryFree")}
                    </Button>
                </div>
            ) : (
                <>
                    {/* headline: the selected package's price (big) + struck original +
                        −% badge (all via PriceTag), plus ONE orange scarcity line when the
                        contract exposes a slot figure. Free package → the free label. */}
                    {selectedPackage ? (
                        (() => {
                            const slots = packageSlots(selectedPackage)
                            return (
                                <div className="flex flex-col gap-2">
                                    {packagePrice(selectedPackage).discounted > 0 ? (
                                        <PriceTag
                                            discounted={packagePrice(selectedPackage).discounted}
                                            original={packagePrice(selectedPackage).original}
                                            size="lg"
                                        />
                                    ) : (
                                        <Typography type="h3" weight="bold">
                                            {t("detail.planNames.free")}
                                        </Typography>
                                    )}
                                    {/* scarcity: hidden today — `PackageView` carries no slot
                                        figure (see tasks Findings); lights up the moment BE
                                        sends one. Never a fabricated number. */}
                                    {slots != null ? (
                                        <Typography type="body-sm" className="text-warning">
                                            {t("detail.earlyBirdSlots", { count: slots })}
                                        </Typography>
                                    ) : null}
                                </div>
                            )
                        })()
                    ) : null}

                    <SelectableCardGroup
                        ariaLabel={t("detail.package.selectorAria")}
                        variant="plain"
                        value={selectedId ?? ""}
                        onChange={setChosenId}
                        items={packages.map((pkg) => {
                            const { discounted, original } = packagePrice(pkg)
                            const count = pkg.entitlements?.length ?? 0
                            const isSelected = pkg.id === selectedId
                            return {
                                value: pkg.id,
                                // radio affordance (matches the legacy EnrollCard)
                                icon: isSelected ? (
                                    <CircleIcon aria-hidden focusable="false" weight="fill" className="size-5 text-accent" />
                                ) : (
                                    <CircleIcon aria-hidden focusable="false" className="size-5 text-muted" />
                                ),
                                // compact single-line row: name on the left with a small "N phần"
                                // annotation inline (never a full description sub-line). The row
                                // itself is accent-highlighted by the list variant when selected.
                                label: (
                                    <span className="flex items-baseline gap-1.5">
                                        <span className="truncate">{pkg.name}</span>
                                        {count > 0 ? (
                                            <span className="shrink-0 text-[11px] leading-none text-muted">
                                                {t("detail.package.entitlementSummary", { count })}
                                            </span>
                                        ) : null}
                                    </span>
                                ),
                                // right cluster: the open package carries a compact accent
                                // "Đang mở" text label (not a Chip — a chip bloats the row
                                // height), then the price. Prices are PLAIN spans, not PriceTag —
                                // PriceTag wraps React-Aria Text, which throws "slot prop
                                // required" when nested in the RadioGroup's Text context; the
                                // headline PriceTag above renders the selected price normally.
                                badge: (
                                    <span className="flex items-center gap-2 text-sm">
                                        {isSelected ? (
                                            <span className="shrink-0 text-[11px] font-medium text-accent">
                                                {t("detail.package.active")}
                                            </span>
                                        ) : null}
                                        {original ? (
                                            <span className="text-xs text-muted line-through">
                                                {original.toLocaleString("vi-VN")}₫
                                            </span>
                                        ) : null}
                                        <span className={cn("font-medium", isSelected ? "text-accent" : "text-foreground")}>
                                            {discounted > 0
                                                ? `${discounted.toLocaleString("vi-VN")}₫`
                                                : t("detail.planNames.free")}
                                        </span>
                                    </span>
                                ),
                            }
                        })}
                    />

                    {/* CTA cluster (StarCI shape): one dominant primary "Nhận gói này"
                        (buy → checkout), a secondary "Thêm vào giỏ" peer that flips to an
                        "Đã ở trong giỏ" remove state, and a quiet tertiary "Học thử miễn phí". */}
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="primary"
                            fullWidth
                            onPress={onBuyPackage}
                            isDisabled={!product}
                            isPending={addCart.isMutating && !inCart}
                        >
                            {t("detail.package.buy")}
                        </Button>
                        {inCart ? (
                            <Button
                                variant="secondary"
                                fullWidth
                                onPress={onRemovePackage}
                                isPending={removeCart.isMutating}
                            >
                                <CheckIcon aria-hidden focusable="false" className="size-5" />
                                {t("detail.inCart")}
                                <TrashIcon aria-hidden focusable="false" className="size-4" />
                            </Button>
                        ) : (
                            <Button
                                variant="secondary"
                                fullWidth
                                onPress={onAddToCartPackage}
                                isDisabled={!product}
                                isPending={addCart.isMutating}
                            >
                                <ShoppingCartIcon aria-hidden focusable="false" className="size-5" />
                                {t("detail.package.addToCart")}
                            </Button>
                        )}
                        <Button variant="tertiary" size="sm" fullWidth onPress={onTryLearning}>
                            {t("detail.tryFree")}
                        </Button>
                    </div>
                    {/* resolving caption: only while the product id is ACTUALLY being
                        fetched — never a permanent line once it settles/can't resolve. */}
                    {productLoading ? (
                        <Typography type="body-xs" color="muted" align="center">
                            {t("detail.package.resolving")}
                        </Typography>
                    ) : null}
                    {course.enrollmentCount ? (
                        <Typography type="body-xs" color="muted" align="center">
                            {t("detail.enrolledCount", { count: course.enrollmentCount })}
                        </Typography>
                    ) : null}
                </>
            )}
        </div>
    )
}

/** Loading skeleton for the package picker — mirrors the picker's card rows + CTAs. */
const PackagePickerSkeleton = () => (
    <div className="flex flex-col gap-3">
        <Skeleton.Typography type="body-xs" width="1/3" />
        <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-xl" />
            ))}
        </div>
        <div className="border-t border-separator pt-3">
            <Skeleton className="h-7 w-1/2 rounded-large" />
        </div>
        {/* CTA cluster: primary + secondary (add-to-cart) + smaller tertiary (try free) */}
        <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full rounded-large" />
            <Skeleton className="h-10 w-full rounded-large" />
            <Skeleton className="h-8 w-full rounded-large" />
        </div>
    </div>
)

/** Loading skeleton — mirrors the two-column detail layout so it never jumps on resolve. */
const CourseDetailSkeleton = () => (
    <div className="flex flex-col gap-6">
        <Skeleton.Breadcrumbs />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
            <div className="flex flex-col gap-3 md:col-span-3">
                <Skeleton className="h-8 w-2/3 rounded-large" />
                <div className="flex flex-wrap gap-2">
                    <Skeleton.Chip />
                    <Skeleton.Chip />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Skeleton.Chip />
                    <Skeleton.Chip />
                    <Skeleton.Chip />
                    <Skeleton.Chip />
                    <Skeleton.Chip />
                </div>
                <Skeleton.Paragraph lines={2} />
                <div className="flex flex-col gap-3 border-t border-separator pt-6">
                    <Skeleton.Typography type="h6" width="1/3" />
                    <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Skeleton className="size-5 shrink-0 rounded-full" />
                                <Skeleton.Typography type="body-sm" className="min-w-0 flex-1" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="md:col-span-2">
                <Skeleton className="h-80 w-full rounded-large" />
            </div>
        </div>
    </div>
)
