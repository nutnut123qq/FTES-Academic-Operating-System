import {
    BookOpenIcon,
    BriefcaseIcon,
    BugIcon,
    CardsIcon,
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

/** One entry in the assistant's option list. */
export interface AssistantOption {
    /** Stable list key (also the `?tool=` value for the subject-space set). */
    readonly key: string
    /** Target route — every one of these is verified to exist in `src/app/[locale]`. */
    readonly href: string
    /** Leading icon. */
    readonly icon: Icon
    /** ABSOLUTE i18n key (root namespace) for the row label. */
    readonly labelKey: string
    /** ABSOLUTE i18n key (root namespace) for the row description. */
    readonly descriptionKey: string
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

/**
 * Picks the option list for the CURRENT route:
 *
 *  - inside a subject workspace (`/subjects/<id>/...`) → the subject's AI tools,
 *    each deep-linking into the AI tab with `?tool=<key>` (the tab reads that
 *    query and opens the matching surface). The `AI` nav row was removed from the
 *    workspace rail, so this panel is now the entry point to those tools.
 *  - everywhere else → the default three shortcuts.
 *
 * Pure function of the LOCALE-STRIPPED pathname (`@/i18n/navigation`'s
 * `usePathname`), so it stays a plain call — no hook, no provider.
 *
 * @param pathname - Locale-stripped pathname, e.g. `/subjects/PRF192/practice`.
 * @returns The option set to render in the assistant panel.
 */
export const getAssistantOptions = (pathname: string): AssistantOptionSet => {
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
