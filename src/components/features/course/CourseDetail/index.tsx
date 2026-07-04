"use client"

import React, { useState } from "react"
import { Button, Chip, Link, Typography, cn } from "@heroui/react"
import {
    BookIcon,
    BookOpenIcon,
    CaretDownIcon,
    CaretRightIcon,
    CertificateIcon,
    CheckIcon,
    ClockIcon,
    FileTextIcon,
    GithubLogoIcon,
    GlobeIcon,
    GraduationCapIcon,
    LinkedinLogoIcon,
    LockIcon,
    PlayCircleIcon,
    PuzzlePieceIcon,
    StackIcon,
    StarIcon,
    TargetIcon,
    TrophyIcon,
    UsersIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { SaveButton } from "@/components/blocks/buttons/SaveButton"
import { HighlightChip } from "@/components/blocks/chips/HighlightChip"
import { PriceTag } from "@/components/blocks/commerce/PriceTag"
import { ResponsiveBreadcrumb } from "@/components/blocks/navigation/ResponsiveBreadcrumb"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { FollowButton } from "@/components/reuseable/FollowButton"
import { StatRibbon } from "@/components/reuseable/StatRibbon"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { useQueryCourseDetailSwr, type CourseDetail as CourseDetailModel, type CourseInstructor } from "../hooks/useQueryCourseDetailSwr"
import type { Icon } from "@phosphor-icons/react"

const ACHIEVEMENT_ICONS: Record<string, Icon> = {
    certificate: CertificateIcon,
    trophy: TrophyIcon,
    book: BookIcon,
}

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
 * AsyncContent, Skeleton) own their styling. ponytail: enroll/try CTAs are no-ops
 * (no BE); the syllabus expander is hand-rolled (swap to HeroUI Accordion once its
 * v3 API is confirmed in this repo).
 */
export const CourseDetail = () => {
    const t = useTranslations("courseSystem")
    const router = useRouter()
    const { courseId } = useParams<{ courseId: string }>()
    const { course, error, mutate } = useQueryCourseDetailSwr(courseId)
    // guests pressing the enroll CTA get the auth modal (enroll context) and STAY here
    const { guard } = useRequireAuth()

    return (
        <div className="mx-auto w-full max-w-6xl p-6">
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
                        onEnroll={guard(() => router.push(`/courses/${courseId}/enroll`), "auth.context.enroll")}
                    />
                ) : null}
            </AsyncContent>
        </div>
    )
}

/** Presentation of a loaded course. Owns only the syllabus expand/collapse UI state. */
const CourseDetailView = ({
    course,
    onCourses,
    onEnroll,
}: {
    course: CourseDetailModel
    onCourses: () => void
    onEnroll: () => void
}) => {
    const t = useTranslations("courseSystem")
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
                            <Chip size="sm" variant="soft" color="default" className="font-semibold text-accent">
                                {t(`levels.${course.level}`)}
                            </Chip>
                            <Chip size="sm" variant="soft" color="default" className="font-semibold text-accent">
                                {t("detail.credits", { count: course.credits })}
                            </Chip>
                            <span className="flex items-center gap-1 text-sm text-muted">
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
                        <Typography type="body-sm" color="muted">
                            {t("detail.instructorLine", { name: course.instructor.name })}
                        </Typography>
                    </div>

                    {/* what you'll learn */}
                    <div className="flex flex-col gap-3 border-t border-separator pt-6">
                        <Typography type="h6" weight="bold">
                            {t("detail.whatYouLearn")}
                        </Typography>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {course.whatYouLearn.map((item) => (
                                <div key={item} className="flex items-start gap-2">
                                    <CheckIcon
                                        aria-hidden
                                        focusable="false"
                                        className="mt-0.5 size-5 shrink-0 text-accent"
                                    />
                                    <Typography type="body-sm" color="muted">
                                        {item}
                                    </Typography>
                                </div>
                            ))}
                        </div>
                    </div>

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
                                            <Typography type="body-sm" weight="medium" className="min-w-0 flex-1 truncate">
                                                {section.title}
                                            </Typography>
                                            <Typography type="body-xs" color="muted">
                                                {t("catalog.lessonsCount", { count: section.lessons.length })}
                                            </Typography>
                                        </button>
                                        {isOpen ? (
                                            <div className="flex flex-col">
                                                {section.lessons.map((lesson) => (
                                                    <div
                                                        key={lesson.id}
                                                        className="flex items-center gap-3 border-t border-separator px-4 py-3 pl-10"
                                                    >
                                                        {lesson.isPremium ? (
                                                            <LockIcon aria-hidden focusable="false" className="size-4 shrink-0 text-muted" />
                                                        ) : (
                                                            <PlayCircleIcon aria-hidden focusable="false" className="size-4 shrink-0 text-accent" />
                                                        )}
                                                        <Typography type="body-sm" color="muted" className="min-w-0 flex-1 truncate">
                                                            {lesson.title}
                                                        </Typography>
                                                        {lesson.isPremium ? (
                                                            <Chip size="sm" variant="soft" color="accent">
                                                                {t("detail.premium")}
                                                            </Chip>
                                                        ) : null}
                                                        <Typography type="body-xs" color="muted">
                                                            {lesson.durationLabel}
                                                        </Typography>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* reviews */}
                    <div className="flex flex-col gap-3 border-t border-separator pt-6">
                        <Typography type="h6" weight="bold">
                            {t("detail.reviews")}
                        </Typography>
                        {course.reviews.map((review) => (
                            <div key={review.id} className="flex gap-3">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                                    {review.author.slice(0, 1).toUpperCase()}
                                </div>
                                <div className="flex min-w-0 flex-col gap-0">
                                    <div className="flex items-center gap-2">
                                        <Typography type="body-sm" weight="medium">
                                            {review.author}
                                        </Typography>
                                        <span className="flex items-center gap-0.5 text-accent" aria-label={`${review.rating}/5`}>
                                            {Array.from({ length: review.rating }).map((_, i) => (
                                                <StarIcon key={i} aria-hidden focusable="false" weight="fill" className="size-3" />
                                            ))}
                                        </span>
                                    </div>
                                    <Typography type="body-sm" color="muted">
                                        {review.text}
                                    </Typography>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* instructor */}
                    <InstructorCard instructor={course.instructor} />
                </div>

                {/* RIGHT — sticky enroll card */}
                <div className="md:col-span-2">
                    <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4 md:sticky md:top-20">
                        <div className="flex aspect-video w-full items-center justify-center rounded-large bg-default/40">
                            <PlayCircleIcon aria-hidden focusable="false" className="size-10 text-muted" />
                        </div>
                        <div className="flex flex-col gap-0">
                            <PriceTag
                                discounted={course.price.vnd}
                                original={course.price.originalVnd}
                                currency="VND"
                                size="lg"
                            />
                            <Typography type="body-xs" color="muted">
                                {t("detail.usdApprox", {
                                    price: course.price.usd.toLocaleString("en-US", { style: "currency", currency: "USD" }),
                                })}
                            </Typography>
                        </div>
                        <Button variant="primary" fullWidth onPress={onEnroll}>
                            {t("detail.enroll")}
                        </Button>
                        <Button variant="secondary" fullWidth>
                            {t("detail.tryFree")}
                        </Button>
                        <div className="flex flex-col gap-2 border-t border-separator pt-3">
                            <Typography type="body-xs" weight="medium" color="muted">
                                {t("detail.includesTitle")}
                            </Typography>
                            <IncludeRow icon={<ClockIcon aria-hidden focusable="false" className="size-4 text-muted" />}>
                                {t("detail.includes.video", { duration: course.durationLabel })}
                            </IncludeRow>
                            <IncludeRow icon={<FileTextIcon aria-hidden focusable="false" className="size-4 text-muted" />}>
                                {t("detail.includes.lessons", { count: totalLessons })}
                            </IncludeRow>
                            <IncludeRow icon={<TargetIcon aria-hidden focusable="false" className="size-4 text-muted" />}>
                                {t("detail.includes.challenge")}
                            </IncludeRow>
                            <IncludeRow icon={<CertificateIcon aria-hidden focusable="false" className="size-4 text-muted" />}>
                                {t("detail.includes.certificate")}
                            </IncludeRow>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/** One "what's included" row: a muted icon + label. */
const IncludeRow = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="flex items-center gap-2">
        <span className="shrink-0">{icon}</span>
        <Typography type="body-sm" color="muted">
            {children}
        </Typography>
    </div>
)

/** Loading skeleton — mirrors the two-column detail layout so it never jumps on resolve. */
const CourseDetailSkeleton = () => (
    <div className="flex flex-col gap-6">
        <Skeleton.Breadcrumbs />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
            <div className="flex flex-col gap-4 md:col-span-3">
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
                <Skeleton className="h-40 w-full rounded-large" />
            </div>
            <div className="md:col-span-2">
                <Skeleton className="h-80 w-full rounded-large" />
            </div>
        </div>
    </div>
)
