"use client"

import React, { useState } from "react"
import { Button, Modal, Skeleton, Typography } from "@heroui/react"
import {
    SparkleIcon,
    CalendarCheckIcon,
    NotepadIcon,
    CardsIcon,
    QuestionIcon,
    BugIcon,
    BriefcaseIcon,
    GraduationCapIcon,
    CaretRightIcon,
    BookOpenIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Link, useRouter } from "@/i18n/navigation"
import { useQueryMyCoursesSwr } from "@/components/features/course/hooks/useQueryMyCoursesSwr"
import {
    useQueryAiToolsSwr,
    type AiTool,
    type AiToolCategory,
} from "../hooks/useQueryAiToolsSwr"

/** Category render order for the hub sections. */
const CATEGORY_ORDER: Array<AiToolCategory> = ["student", "learning", "coding", "career"]

// ponytail: static icon-per-slug map (confirmed-compiling Phosphor set). Refine when
// §9 gets its own brainstorm; falls back to a generic sparkle for unknown keys.
const TOOL_ICONS: Record<string, React.ReactNode> = {
    tutor: <SparkleIcon className="size-6" />,
    planner: <CalendarCheckIcon className="size-6" />,
    summary: <NotepadIcon className="size-6" />,
    flashcards: <CardsIcon className="size-6" />,
    quiz: <QuestionIcon className="size-6" />,
    debug: <BugIcon className="size-6" />,
    cvReview: <BriefcaseIcon className="size-6" />,
}

/** The one intent-driven tile whose action is resolved from enrollments, not a URL. */
const TUTOR_KEY = "tutor"

/** Loading skeleton — mirrors the category sections + tool-card grid so the layout never jumps. */
const AiHubSkeleton = () => (
    <div className="flex flex-col gap-6">
        {[0, 1].map((section) => (
            <div key={section} className="flex flex-col gap-3">
                <Skeleton className="h-4 w-28 rounded-full" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[0, 1, 2].map((card) => (
                        <div
                            key={card}
                            className="flex flex-col gap-3 rounded-2xl border border-separator p-4"
                        >
                            <Skeleton className="size-11 shrink-0 rounded-large" />
                            <div className="flex flex-col gap-2">
                                <Skeleton className="h-4 w-32 rounded-full" />
                                <Skeleton className="h-3 w-full rounded-full" />
                                <Skeleton className="h-3 w-3/4 rounded-full" />
                            </div>
                            <Skeleton className="h-8 w-20 rounded-large" />
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
)

/**
 * §9 AI Platform — the AI tools hub. Mirrors the house catalog archetype
 * (see `SubjectCatalog`): title + subtitle + a card grid, here grouped by category.
 * Each card = accent icon badge + tool name + short desc + a real CTA.
 *
 * Tile wiring: every rendered tile drives somewhere real. Job/tool tiles navigate to
 * their `/ai/tools/*` surface via `href`; the `tutor` tile resolves "continue
 * learning" from the viewer's enrollments at press time (1 course → its learn shell;
 * several → a picker modal; none → a browse-catalog CTA). Any tile with neither an
 * `href` nor the tutor action is dead and is filtered out — no no-op CTA renders.
 */
export const AiHub = () => {
    const t = useTranslations("aiPlatform")
    const router = useRouter()
    const { tools, isLoading, error, mutate } = useQueryAiToolsSwr()
    const { courses, isLoading: coursesLoading } = useQueryMyCoursesSwr()
    const [isPickerOpen, setIsPickerOpen] = useState(false)

    // "Continue learning": one course → straight into it; otherwise let the modal
    // handle both the several-courses pick and the no-courses catalog CTA.
    const handleTutor = () => {
        if (courses.length === 1) {
            router.push(courses[0].href)
            return
        }
        setIsPickerOpen(true)
    }

    // Drop dead tiles — a tile renders only if it has a real destination (an `href`)
    // or is the tutor tile (intent-driven action).
    const liveTools = tools.filter((tool) => tool.key === TUTOR_KEY || !!tool.href)

    const byCategory = CATEGORY_ORDER.map((category) => ({
        category,
        tools: liveTools.filter((tool) => tool.category === category),
    })).filter((group) => group.tools.length > 0)

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-0">
                <Typography type="h4" weight="bold">
                    {t("title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("subtitle")}
                </Typography>
            </div>

            <AsyncContent
                isLoading={isLoading && liveTools.length === 0}
                skeleton={<AiHubSkeleton />}
                isEmpty={liveTools.length === 0}
                emptyContent={{ title: t("states.empty") }}
                error={liveTools.length === 0 ? error : undefined}
                errorContent={{
                    title: t("states.error"),
                    onRetry: () => void mutate(),
                    retryLabel: t("states.retry"),
                }}
            >
                <div className="flex flex-col gap-6">
                    {byCategory.map((group) => (
                        <section key={group.category} className="flex flex-col gap-3">
                            <Typography type="body" weight="medium" className="text-accent">
                                {t(`categories.${group.category}`)}
                            </Typography>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {group.tools.map((tool: AiTool) => (
                                    <div
                                        key={tool.id}
                                        className="flex flex-col gap-3 rounded-2xl border border-separator p-4 transition-colors hover:border-default hover:bg-default/40"
                                    >
                                        <span
                                            aria-hidden
                                            className="flex size-11 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent"
                                        >
                                            {TOOL_ICONS[tool.key] ?? <GraduationCapIcon className="size-6" />}
                                        </span>
                                        <div className="flex min-w-0 flex-col gap-0">
                                            <Typography type="body-sm" weight="medium" truncate>
                                                {t(`tools.${tool.key}.name`)}
                                            </Typography>
                                            <Typography type="body-sm" color="muted" className="line-clamp-2">
                                                {t(`tools.${tool.key}.desc`)}
                                            </Typography>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {tool.href ? (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onPress={() => router.push(tool.href as string)}
                                                >
                                                    {t("open")}
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    isPending={coursesLoading}
                                                    onPress={handleTutor}
                                                >
                                                    {t("open")}
                                                </Button>
                                            )}
                                            <Typography type="body-xs" color="muted">
                                                {t("quotaRemaining", { count: tool.remaining })}
                                            </Typography>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </AsyncContent>

            <TutorContinueModal
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                courses={courses}
            />
        </div>
    )
}

/** Props for {@link TutorContinueModal}. */
interface TutorContinueModalProps {
    /** Whether the picker is open. */
    isOpen: boolean
    /** Close the picker. */
    onClose: () => void
    /** The viewer's resumable enrolled courses (may be empty). */
    courses: ReturnType<typeof useQueryMyCoursesSwr>["courses"]
}

/**
 * The tutor "continue learning" picker. With several enrolled courses it lists them
 * (each a go-there row into that course's learn shell); with none it shows a
 * browse-catalog CTA so the tile is never a dead end.
 */
const TutorContinueModal = ({ isOpen, onClose, courses }: TutorContinueModalProps) => {
    const t = useTranslations("aiPlatform.tutorPicker")
    const router = useRouter()
    const hasCourses = courses.length > 0

    return (
        <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className="w-full max-w-md">
                        <Modal.Header>
                            <div className="flex items-start gap-3">
                                <div className="rounded-xl bg-accent/10 p-2 text-accent">
                                    <SparkleIcon aria-hidden focusable="false" className="size-5" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Typography type="body" weight="bold">
                                        {t("title")}
                                    </Typography>
                                    <Typography type="body-sm" color="muted">
                                        {hasCourses ? t("subtitle") : t("emptyHint")}
                                    </Typography>
                                </div>
                            </div>
                        </Modal.Header>
                        <Modal.Body className="flex flex-col gap-2">
                            {hasCourses ? (
                                <div className="flex flex-col divide-y divide-separator">
                                    {courses.map((course) => (
                                        <Link
                                            key={course.courseId}
                                            href={course.href}
                                            onClick={onClose}
                                            className="group flex items-center gap-3 py-3"
                                        >
                                            <BookOpenIcon
                                                aria-hidden
                                                focusable="false"
                                                className="size-5 shrink-0 text-muted"
                                            />
                                            <div className="flex min-w-0 flex-1 flex-col">
                                                <Typography
                                                    type="body-sm"
                                                    weight="semibold"
                                                    truncate
                                                    className="transition-colors group-hover:underline"
                                                >
                                                    {course.title}
                                                </Typography>
                                                <Typography type="body-xs" color="muted">
                                                    {t("progress", { percent: course.completionPercent })}
                                                </Typography>
                                            </div>
                                            <CaretRightIcon
                                                aria-hidden
                                                focusable="false"
                                                className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-1"
                                            />
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3 py-4 text-center">
                                    <Typography type="body" weight="semibold">
                                        {t("emptyTitle")}
                                    </Typography>
                                    <Button
                                        variant="primary"
                                        onPress={() => {
                                            onClose()
                                            router.push("/courses")
                                        }}
                                    >
                                        {t("browse")}
                                    </Button>
                                </div>
                            )}
                        </Modal.Body>
                        <Modal.Footer className="justify-end">
                            <Button variant="ghost" onPress={onClose}>
                                {t("close")}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
