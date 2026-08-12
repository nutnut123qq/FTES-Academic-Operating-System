import {
    BookOpenIcon,
    BriefcaseIcon,
    BugIcon,
    CardsIcon,
    ChatCircleDotsIcon,
    FolderIcon,
    MapTrifoldIcon,
    NotepadIcon,
    QuestionIcon,
    ReadCvLogoIcon,
    SparkleIcon,
    SquaresFourIcon,
    TargetIcon,
    type Icon,
} from "@phosphor-icons/react"

/**
 * What activating a row (or a proactive bubble) does. Exactly ONE of the two is set:
 * most entries navigate, but the lesson tutor has no route of its own — its chat is a
 * floating panel on the page you are already on, so it is opened by ACTION instead.
 */
export type AssistantTarget =
    /** Navigate to this route (verified to exist in `src/app/[locale]`). */
    | { readonly href: string; readonly action?: never }
    /** Run a named action; {@link MascotAssistant} maps the name to a handler. */
    | { readonly action: "openLessonChat"; readonly href?: never }

/** One entry in the assistant's option list. */
export type AssistantOption = AssistantTarget & {
    /** Stable list key (also the `?tool=` value for the subject-space set). */
    readonly key: string
    /** Leading icon. */
    readonly icon: Icon
    /** ABSOLUTE i18n key (root namespace) for the row label. */
    readonly labelKey: string
    /** ABSOLUTE i18n key (root namespace) for the row description. */
    readonly descriptionKey: string
}

/**
 * A line the mascot floats on its own, unprompted. Unlike an option row it is a
 * QUESTION aimed at what the visitor is doing right now ("Cần mình giải đáp thắc mắc
 * buổi học không?"), and activating it goes straight to that one feature rather than
 * opening the whole menu.
 */
export interface AssistantBubble {
    /** ABSOLUTE i18n key (root namespace) for the line. */
    readonly messageKey: string
    /** Route the line leads to. Omit together with {@link action} for small talk. */
    readonly href?: string
    /** Action the line runs. Omit together with {@link href} for small talk. */
    readonly action?: "openLessonChat"
}

/** A contextual option list plus the panel heading that frames it. */
export interface AssistantOptionSet {
    /** ABSOLUTE i18n key for the panel title. */
    readonly titleKey: string
    /** ABSOLUTE i18n key for the panel subtitle. */
    readonly subtitleKey: string
    /** The rows, in the order a learner needs them. */
    readonly options: readonly AssistantOption[]
}

/**
 * Default set — the WHOLE "Trợ lý AI" surface, moved into the mascot panel. The
 * account menu no longer carries an AI entry (the `explore-shortcuts` row was
 * deleted), so this list is now the site-wide entry point to every AI feature.
 *
 * The rows mirror the AI hub catalog one-for-one (`useQueryAiToolsSwr`'s
 * `TOOL_CATALOG`: tutor · planner · summary · flashcards · quiz · debug · cvReview),
 * plus the CV BUILDER (`/profile/cv`, which lives outside `/ai/tools` but is the
 * "làm CV" half of the career pair). `tutor` maps to the hub itself (`/ai`) — its
 * "continue learning" jump is resolved there from the viewer's enrollments, so the
 * panel must not try to guess a course URL. `planner` is the AI STUDY-PLAN tool,
 * NOT the career roadmap page, per the product decision recorded for that change.
 *
 * ponytail: labels stay a static list, not a fetch of `/ai/quotas/me` — a hover
 * panel must not wait on the network, and every route here exists unconditionally.
 */
const DEFAULT_SET: AssistantOptionSet = {
    titleKey: "mascot.assistant.title",
    subtitleKey: "mascot.assistant.subtitle",
    options: [
        {
            key: "chat",
            href: "/ai",
            icon: SparkleIcon,
            labelKey: "mascot.assistant.options.chat.label",
            descriptionKey: "mascot.assistant.options.chat.description",
        },
        {
            key: "planner",
            href: "/ai/tools/planner",
            icon: MapTrifoldIcon,
            labelKey: "mascot.assistant.options.planner.label",
            descriptionKey: "mascot.assistant.options.planner.description",
        },
        {
            key: "summary",
            href: "/ai/tools/summary",
            icon: NotepadIcon,
            labelKey: "mascot.assistant.options.summary.label",
            descriptionKey: "mascot.assistant.options.summary.description",
        },
        {
            key: "flashcards",
            href: "/ai/tools/flashcards",
            icon: CardsIcon,
            labelKey: "mascot.assistant.options.flashcards.label",
            descriptionKey: "mascot.assistant.options.flashcards.description",
        },
        {
            key: "quiz",
            href: "/ai/tools/quiz",
            icon: QuestionIcon,
            labelKey: "mascot.assistant.options.quiz.label",
            descriptionKey: "mascot.assistant.options.quiz.description",
        },
        {
            key: "debug",
            href: "/ai/tools/debug",
            icon: BugIcon,
            labelKey: "mascot.assistant.options.debug.label",
            descriptionKey: "mascot.assistant.options.debug.description",
        },
        {
            key: "cv",
            href: "/profile/cv",
            icon: ReadCvLogoIcon,
            labelKey: "mascot.assistant.options.cv.label",
            descriptionKey: "mascot.assistant.options.cv.description",
        },
        {
            key: "cvReview",
            href: "/ai/tools/cv-review",
            icon: BriefcaseIcon,
            labelKey: "mascot.assistant.options.cvReview.label",
            descriptionKey: "mascot.assistant.options.cvReview.description",
        },
    ],
}

/**
 * A subject workspace route: `/subjects/<subjectId>[/...]`. The bare `/subjects`
 * index does NOT match (there is no subject to scope the tools to), so the list
 * page keeps the default set.
 */
const SUBJECT_WORKSPACE_ROUTE = /^\/subjects\/([^/]+)(?:\/|$)/

/**
 * The REAL AI tools of the subject space, in the same order the AI tab renders
 * them (`useQuerySubjectAiToolsSwr` roster: tutor · summary · quiz · flashcards ·
 * ocr) and with the same icons, so the mascot panel and the tab read as one
 * surface. Labels reuse the tab's own strings (`subjects.aiTools.tools.*`) — one
 * source of truth, no second copy to drift.
 */
const SUBJECT_AI_TOOLS: ReadonlyArray<{ key: string; icon: Icon }> = [
    { key: "tutor", icon: SparkleIcon },
    { key: "summary", icon: BookOpenIcon },
    { key: "quiz", icon: TargetIcon },
    { key: "flashcards", icon: SquaresFourIcon },
    { key: "ocr", icon: FolderIcon },
]

/** The lesson reader: `/courses/<id>/learn/...`, where a lesson is open on screen. */
const LESSON_READER_ROUTE = /^\/courses\/[^/]+\/learn(?:\/|$)/
/** A course surface that is NOT the reader — catalog, detail page, my-courses. */
const COURSE_ROUTE = /^\/courses(?:\/|$)/
/** The learner's own profile area. */
const PROFILE_ROUTE = /^\/profile(?:\/|$)/

/**
 * Lesson-reader set. `tutor` is the grounded chat about the OPEN LESSON — it has no
 * route of its own (the chat is a floating panel on this very page), so it is an
 * ACTION. It leads, because on this page it is the thing a stuck learner wants; the
 * generic tools follow so the panel is never a dead end.
 */
const LESSON_SET: AssistantOptionSet = {
    titleKey: "mascot.assistant.title",
    subtitleKey: "mascot.assistant.lessonSubtitle",
    options: [
        {
            key: "lessonChat",
            action: "openLessonChat",
            icon: ChatCircleDotsIcon,
            labelKey: "mascot.assistant.options.lessonChat.label",
            descriptionKey: "mascot.assistant.options.lessonChat.description",
        },
        ...DEFAULT_SET.options.filter((option) => option.key !== "chat"),
    ],
}

/**
 * Picks the option list for the CURRENT route:
 *
 *  - lesson reader (`/courses/<id>/learn/...`) → the grounded lesson chat first,
 *    then the generic tools.
 *  - inside a subject workspace (`/subjects/<id>/...`) → the subject's AI tools,
 *    each deep-linking into the AI tab with `?tool=<key>` (the tab reads that
 *    query and opens the matching surface). The `AI` nav row was removed from the
 *    workspace rail, so this panel is now the entry point to those tools.
 *  - everywhere else → the full roster.
 *
 * Pure function of the LOCALE-STRIPPED pathname (`@/i18n/navigation`'s
 * `usePathname`), so it stays a plain call — no hook, no provider.
 *
 * @param pathname - Locale-stripped pathname, e.g. `/subjects/PRF192/practice`.
 * @returns The option set to render in the assistant panel.
 */
export const getAssistantOptions = (pathname: string): AssistantOptionSet => {
    if (LESSON_READER_ROUTE.test(pathname)) {
        return LESSON_SET
    }
    const match = SUBJECT_WORKSPACE_ROUTE.exec(pathname)
    if (match === null) {
        return DEFAULT_SET
    }
    const subjectId = match[1]
    return {
        titleKey: "mascot.assistant.subjectTitle",
        subtitleKey: "mascot.assistant.subjectSubtitle",
        options: SUBJECT_AI_TOOLS.map(({ key, icon }) => ({
            key,
            href: `/subjects/${subjectId}/ai?tool=${key}`,
            icon,
            labelKey: `subjects.aiTools.tools.${key}.title`,
            descriptionKey: `subjects.aiTools.tools.${key}.desc`,
        })),
    }
}

/**
 * Lines with NO destination — the mascot just says hello. Used where nothing about
 * the page suggests a particular tool; clicking one simply opens the menu.
 */
const GENERIC_BUBBLES: readonly AssistantBubble[] = [
    { messageKey: "mascot.assistant.bubble.hello" },
    { messageKey: "mascot.assistant.bubble.day" },
    { messageKey: "mascot.assistant.bubble.help" },
]

/**
 * Picks what the mascot may say UNPROMPTED on the current route, and where each line
 * goes when clicked.
 *
 * This is the difference between a mascot that decorates and one that helps: on a
 * lesson page it offers to answer questions ABOUT THAT LESSON and opens the grounded
 * chat; in a subject workspace it offers that subject's revision tools; and only when
 * the route says nothing useful does it fall back to small talk that just opens the
 * menu.
 *
 * @param pathname - Locale-stripped pathname.
 * @returns Candidate lines; one is picked at random each time a bubble is shown.
 */
export const getAssistantBubbles = (pathname: string): readonly AssistantBubble[] => {
    if (LESSON_READER_ROUTE.test(pathname)) {
        return [
            { messageKey: "mascot.assistant.bubble.lessonQuestion", action: "openLessonChat" },
            { messageKey: "mascot.assistant.bubble.lessonStuck", action: "openLessonChat" },
        ]
    }
    const subject = SUBJECT_WORKSPACE_ROUTE.exec(pathname)
    if (subject !== null) {
        return [
            {
                messageKey: "mascot.assistant.bubble.subjectFlashcards",
                href: `/subjects/${subject[1]}/ai?tool=flashcards`,
            },
            { messageKey: "mascot.assistant.bubble.subjectQuiz", href: `/subjects/${subject[1]}/ai?tool=quiz` },
        ]
    }
    if (COURSE_ROUTE.test(pathname)) {
        return [{ messageKey: "mascot.assistant.bubble.coursePlanner", href: "/ai/tools/planner" }]
    }
    if (PROFILE_ROUTE.test(pathname)) {
        return [{ messageKey: "mascot.assistant.bubble.profileCv", href: "/profile/cv" }]
    }
    return GENERIC_BUBBLES
}
