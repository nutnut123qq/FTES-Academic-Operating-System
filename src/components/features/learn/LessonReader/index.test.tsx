import React from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { LearnLessonView } from "../hooks/useQueryLearnLessonSwr"

/**
 * Component — the lesson reader body wiring (two E2E regressions).
 *
 *  A. `hasChallenge` now comes from the CURRICULUM tree (via the hook), so a lesson
 *     that reports a challenge shows the Challenges tab — even a VIDEO lesson whose
 *     `/content` endpoint 404s (empty body). The tab is gated on `hasChallenge &&
 *     challengeId`, both sourced from the tree.
 *  B. The DocumentReader path used to DROP the reaction footer, silently losing
 *     like/reaction on every DOCUMENT lesson. The footer must mount on BOTH the
 *     VIDEO/legacy reading-card path AND the DocumentReader path.
 */

const lessonHook = vi.fn()
vi.mock("../hooks/useQueryLearnLessonSwr", () => ({
    useQueryLearnLessonSwr: () => lessonHook(),
}))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useFormatter: () => ({ number: (n: number) => String(n) }),
}))

vi.mock("next/navigation", () => ({
    useParams: () => ({ courseId: "khoa-a", contentId: "l1" }),
}))

vi.mock("@/i18n/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("swr", () => ({ mutate: vi.fn() }))

vi.mock("@/hooks/zustand/learnSidebar/store", () => ({
    useLearnSidebarStore: () => ({ toggle: vi.fn() }),
}))

vi.mock("@/hooks/swr/api/rest/mutations/usePostMarkLessonCompleteSwr", () => ({
    usePostMarkLessonCompleteSwr: () => ({ trigger: vi.fn() }),
}))

vi.mock("@heroui/react", () => ({
    Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Chip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    Button: ({ children, onPress }: { children?: React.ReactNode; onPress?: () => void }) => (
        <button type="button" onClick={onPress}>{children}</button>
    ),
    cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
}))

vi.mock("@phosphor-icons/react", () => ({
    CheckCircleIcon: () => <span />,
    ClockIcon: () => <span />,
    FlameIcon: () => <span />,
    BookOpenIcon: () => <span />,
    CaretLeftIcon: () => <span />,
    CaretRightIcon: () => <span />,
    ListIcon: () => <span />,
    LockSimpleIcon: () => <span />,
    PuzzlePieceIcon: () => <span />,
}))

// AsyncContent: with a resolved lesson (no loading, no error) it renders its children.
vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({ isLoading, skeleton, children }: { isLoading: boolean; skeleton: React.ReactNode; children: React.ReactNode }) =>
        isLoading ? <>{skeleton}</> : <>{children}</>,
}))

vi.mock("@/components/blocks/async/EmptyContent", () => ({ EmptyContent: () => <div data-testid="empty" /> }))

vi.mock("@/components/blocks/layout/PageHeader", () => ({
    PageHeader: ({ title }: { title: React.ReactNode }) => <div>{title}</div>,
}))

vi.mock("@/components/blocks/navigation/ResponsiveBreadcrumb", () => ({
    ResponsiveBreadcrumb: () => <nav />,
}))

// Probe the tab bar: dumps one testid per tab item so we can assert the Challenges tab.
vi.mock("@/components/blocks/navigation/TabsCard", () => ({
    TabsCard: ({ leftTabs }: { leftTabs: { items: Array<{ key: string; label: React.ReactNode }> } }) => (
        <div data-testid="tabs">
            {leftTabs.items.map((item) => (
                <span key={item.key} data-testid={`tab-${item.key}`}>{item.label}</span>
            ))}
        </div>
    ),
}))

vi.mock("@/components/blocks/cards/CheckListCard", () => ({
    CheckListCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    CheckListItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock("@/components/blocks/cards/LabeledCard", () => ({
    LabeledCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock("@/components/blocks/cards/PressableCard", () => ({
    PressableCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/components/blocks/skeleton/Skeleton", () => {
    const S = () => <div />
    ;(S as unknown as { Paragraph: () => React.ReactElement }).Paragraph = () => <div />
    return { Skeleton: S }
})

vi.mock("@/components/reuseable/ProgrammingLanguageTabs", () => ({ ProgrammingLanguageTabs: () => <div /> }))
vi.mock("@/components/reuseable/ProgrammingLanguageTabs/enums", () => ({
    ProgrammingLanguageTabsVariant: { Pill: "pill" },
}))
vi.mock("@/modules/types/utils/programming-language", () => ({
    resolveActiveProgrammingLang: (lang: string) => lang,
}))

vi.mock("@/components/reuseable/MarkdownContent", () => ({ MarkdownContent: () => <div /> }))

// The two probes at the heart of the regressions.
vi.mock("@/components/features/learn/DocumentReader", () => ({
    DocumentReader: () => <div data-testid="document-reader" />,
}))
vi.mock("./LessonReactionFooter", () => ({
    LessonReactionFooter: ({ contentId, accessLevel }: { contentId: string; accessLevel: string | null }) => (
        <div data-testid="reaction-footer">{`${contentId}:${String(accessLevel)}`}</div>
    ),
}))

vi.mock("./LessonComments", () => ({ LessonComments: () => <div /> }))
vi.mock("./LessonResourceLinks", () => ({ LessonResourceLinks: () => <div /> }))
vi.mock("./LessonVideoBlock", () => ({ LessonVideoBlock: () => <div data-testid="video-block" /> }))
vi.mock("./LessonDocumentHtml", () => ({ LessonDocumentHtml: () => <div /> }))
vi.mock("./LessonDocumentsBlock", () => ({ LessonDocumentsBlock: () => <div /> }))
vi.mock("./ContentAiSelectionAsk/SelectionHintCallout", () => ({ SelectionHintCallout: () => <div /> }))
vi.mock("./LessonAiStudy", () => ({ LessonAiStudy: () => <div /> }))
vi.mock("./LessonAssignmentBlock", () => ({ LessonAssignmentBlock: () => <div /> }))
vi.mock("./LessonQuizBlock", () => ({ LessonQuizBlock: () => <div /> }))
vi.mock("@/components/features/course/PackageGateModal", () => ({ PackageGateModal: () => <div /> }))

import { LessonReader } from "./index"

/** A full lesson view; override the fields a case cares about. */
const makeLesson = (over: Partial<LearnLessonView> = {}): LearnLessonView => ({
    id: "l1",
    moduleId: "m1",
    courseRawId: "uuid-a",
    courseTitle: "Khóa A",
    title: "Bài 1",
    description: "Mô tả",
    moduleTitle: "Học phần 1",
    readTimeLabel: "",
    minutesRead: 0,
    challengeCount: 0,
    outcomes: [],
    availableLangs: ["typescript"],
    bodyByLang: { typescript: "Nội dung tài liệu." },
    prevId: null,
    nextId: null,
    prevTitle: null,
    nextTitle: null,
    isCompleted: false,
    contentType: "DOCUMENT",
    isVideoLesson: false,
    hasChallenge: false,
    challengeId: null,
    hasQuiz: false,
    quizId: null,
    isLocked: false,
    accessLevel: "FULL",
    packageSlugs: [],
    teaser: null,
    hasVideo: false,
    videoRef: null,
    documentHtml: null,
    ...over,
})

beforeEach(() => {
    lessonHook.mockReset()
})

describe("LessonReader — challenge tab + reaction footer wiring", () => {
    it("mounts the reaction footer on the DocumentReader (DOCUMENT) path", () => {
        lessonHook.mockReturnValue({ lesson: makeLesson({ contentType: "DOCUMENT" }), error: undefined, mutate: vi.fn() })
        render(<LessonReader />)
        expect(screen.getByTestId("document-reader")).toBeTruthy()
        const footer = screen.getByTestId("reaction-footer")
        expect(footer).toBeTruthy()
        expect(footer.textContent).toBe("l1:FULL")
    })

    it("shows the Challenges tab for a VIDEO lesson with no content body when the tree reports a challenge", () => {
        // VIDEO lesson, empty body (its `/content` 404'd) — the tab must still appear.
        lessonHook.mockReturnValue({
            lesson: makeLesson({
                contentType: "VIDEO",
                bodyByLang: { typescript: "" },
                hasChallenge: true,
                challengeId: "ch-1",
            }),
            error: undefined,
            mutate: vi.fn(),
        })
        render(<LessonReader />)
        expect(screen.getByTestId("tab-challenges")).toBeTruthy()
    })

    it("hides the Challenges tab when the lesson reports no challenge", () => {
        lessonHook.mockReturnValue({
            lesson: makeLesson({ hasChallenge: false, challengeId: null }),
            error: undefined,
            mutate: vi.fn(),
        })
        render(<LessonReader />)
        expect(screen.queryByTestId("tabs")).toBeNull()
    })
})
