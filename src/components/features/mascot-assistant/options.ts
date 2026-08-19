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
 * panel must not try to guess a course URL. `planner` is the AI STUDY-PLAN tool.
 *
 * ponytail: labels stay a static list, not a fetch of `/ai/quotas/me` — a hover
 * panel must not wait on the network, and every route here exists unconditionally.
 */
const CATALOG = {
    lessonChat: {
        key: "lessonChat",
        action: "openLessonChat",
        icon: ChatCircleDotsIcon,
    },
    chat: { key: "chat", href: "/ai", icon: SparkleIcon },
    planner: { key: "planner", href: "/ai/tools/planner", icon: MapTrifoldIcon },
    summary: { key: "summary", href: "/ai/tools/summary", icon: NotepadIcon },
    flashcards: { key: "flashcards", href: "/ai/tools/flashcards", icon: CardsIcon },
    quiz: { key: "quiz", href: "/ai/tools/quiz", icon: QuestionIcon },
    debug: { key: "debug", href: "/ai/tools/debug", icon: BugIcon },
    cv: { key: "cv", href: "/profile/cv", icon: ReadCvLogoIcon },
    cvReview: { key: "cvReview", href: "/ai/tools/cv-review", icon: BriefcaseIcon },
} as const satisfies Record<string, AssistantTarget & { key: string; icon: Icon }>

/** Catalog key → a full option row, with the i18n keys derived from the key itself. */
const row = (key: keyof typeof CATALOG): AssistantOption => ({
    ...CATALOG[key],
    labelKey: `mascot.assistant.options.${key}.label`,
    descriptionKey: `mascot.assistant.options.${key}.description`,
})

/**
 * WHICH tools each surface offers. Short lists on purpose — the panel is a nudge
 * toward the two or three things worth doing HERE, not a directory. `chat` (the AI
 * hub) closes every list as the way to everything else, so a short list never becomes
 * a dead end. Landing on the hub itself is the one place that does show the lot.
 */
const ROUTE_SETS: ReadonlyArray<{ pattern: RegExp; keys: ReadonlyArray<keyof typeof CATALOG> }> = [
    // the AI hub itself — the visitor came looking for tools, so show them all
    { pattern: /^\/ai(?:\/|$)/, keys: ["chat", "planner", "summary", "flashcards", "quiz", "debug", "cv", "cvReview"] },
    // course surfaces: planning and digesting material
    { pattern: /^\/courses(?:\/|$)/, keys: ["planner", "summary", "flashcards", "chat"] },
    // coding surfaces: fixing and drilling code
    { pattern: /^\/(?:challenges|practice|workflow)(?:\/|$)/, keys: ["debug", "quiz", "chat"] },
    // career surfaces
    { pattern: /^\/(?:profile|marketplace)(?:\/|$)/, keys: ["cv", "cvReview", "chat"] },
    // study material
    { pattern: /^\/(?:resources|blog|search)(?:\/|$)/, keys: ["summary", "flashcards", "chat"] },
]

/** Everywhere else (home, community, dashboard…): three starters + the hub. */
const DEFAULT_KEYS: ReadonlyArray<keyof typeof CATALOG> = ["chat", "planner", "cv"]

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
 * Picks the option list for the CURRENT route. The panel is CONTEXTUAL — it offers
 * the two or three tools that fit where the visitor is standing, not the whole
 * roster everywhere. Dumping all eight on the home page reads as a directory and
 * pushes the useful row off the first glance; the full list already has a home of
 * its own at `/ai`, which every short list links to.
 *
 *  - lesson reader (`/courses/<id>/learn/...`) → the grounded lesson chat FIRST
 *    (the thing a stuck learner wants), then what helps digest a lesson.
 *  - subject workspace (`/subjects/<id>/...`) → that subject's own AI tools, each
 *    deep-linking into the AI tab with `?tool=<key>`. The `AI` nav row was removed
 *    from the workspace rail, so this panel is the entry point to them.
 *  - other surfaces → see {@link ROUTE_SETS}.
 *  - everywhere else → three starters.
 *
 * Pure function of the LOCALE-STRIPPED pathname (`@/i18n/navigation`'s
 * `usePathname`), so it stays a plain call — no hook, no provider.
 *
 * @param pathname - Locale-stripped pathname, e.g. `/subjects/PRF192/practice`.
 * @returns The option set to render in the assistant panel.
 */
export const getAssistantOptions = (pathname: string): AssistantOptionSet => {
    if (LESSON_READER_ROUTE.test(pathname)) {
        return {
            titleKey: "mascot.assistant.title",
            subtitleKey: "mascot.assistant.lessonSubtitle",
            options: (["lessonChat", "summary", "flashcards", "quiz"] as const).map(row),
        }
    }
    const subject = SUBJECT_WORKSPACE_ROUTE.exec(pathname)
    if (subject !== null) {
        const subjectId = subject[1]
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
    const matched = ROUTE_SETS.find((entry) => entry.pattern.test(pathname))
    return {
        titleKey: "mascot.assistant.title",
        subtitleKey: "mascot.assistant.subtitle",
        options: (matched?.keys ?? DEFAULT_KEYS).map(row),
    }
}

/**
 * Lines with NO destination — the mascot just says hello. Used where nothing about
 * the page suggests a particular tool; clicking one simply opens the menu.
 */
const GENERIC_BUBBLES: readonly AssistantBubble[] = [
    "hello",
    "day",
    "help",
    "progress",
    "todayLearned",
    "break",
    "reviewHabit",
    "goal",
    "welcomeBack",
    "stuck",
].map((key) => ({ messageKey: `mascot.assistant.bubble.${key}` }))

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
