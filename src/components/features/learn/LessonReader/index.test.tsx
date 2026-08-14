import React from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { LearnLessonView } from "../hooks/useQueryLearnLessonSwr"

/**
 * Component — the lesson reader body wiring.
 *
 * The Content/Challenges tab bar and the top-bar exercise/material buttons were removed
 * (practice now lives in the right-rail "Practice this lesson" panel, documents in the
 * "Tài liệu cho lesson này" rail panel); the reader always renders the content view.
 * What this file still guards:
 *  - The DocumentReader path must NOT drop the reaction footer (it once silently lost
 *    like/reaction on every DOCUMENT lesson) — the footer mounts on BOTH the VIDEO/legacy
 *    reading-card path AND the DocumentReader path.
 *  - The after-content "Làm thử thách" TrialChallengeCta shows only for an accessible
 *    lesson carrying a FREE challenge.
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

/** `PUT /courses/lessons/{id}/progress` — the "lesson was opened" signal (case C). */
const reportProgress = vi.fn((_lessonId: string, _request: unknown) => Promise.resolve({}))
vi.mock("@/modules/api/rest/course", () => ({
    reportLessonProgress: (lessonId: string, request: unknown) => reportProgress(lessonId, request),
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
    ClipboardTextIcon: () => <span />,
    FileTextIcon: () => <span />,
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
    // Render the `actions` slot too — the top-bar challenge / materials buttons live there.
    PageHeader: ({ title, actions }: { title: React.ReactNode; actions?: React.ReactNode }) => (
        <div>{title}{actions}</div>
    ),
}))

vi.mock("@/components/blocks/navigation/ResponsiveBreadcrumb", () => ({
    ResponsiveBreadcrumb: () => <nav />,
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
// Phát ra chính danh sách url để test khẳng định được link nào lọt vào thẻ tài liệu.
vi.mock("./LessonResourceLinks", () => ({
    LessonResourceLinks: ({ urls }: { urls: Array<string> }) => (
        <div data-testid="resource-links">{urls.join(" ")}</div>
    ),
}))
vi.mock("./LessonVideoBlock", () => ({ LessonVideoBlock: () => <div data-testid="video-block" /> }))
vi.mock("./LessonDocumentHtml", () => ({ LessonDocumentHtml: () => <div /> }))
vi.mock("./ContentAiSelectionAsk/SelectionHintCallout", () => ({ SelectionHintCallout: () => <div /> }))
vi.mock("./LessonQuizBlock", () => ({ LessonQuizBlock: () => <div /> }))
vi.mock("@/components/features/course/PackageGateModal", () => ({ PackageGateModal: () => <div /> }))
// Danh sách gói cho tiêu đề tường phí — `swr` ở đây chỉ mock `mutate`, nên hook thật
// (dùng useSWR) sẽ nổ; trả list rỗng là đủ cho mọi case hiện có (packageSlugs: []).
vi.mock("@/components/features/course/hooks/useQueryCoursePackagesSwr", () => ({
    useQueryCoursePackagesSwr: () => ({ packages: [] }),
}))

import { LessonReader } from "./index"

/** A full lesson view; override the fields a case cares about. */
const makeLesson = (over: Partial<LearnLessonView> = {}): LearnLessonView => ({
    id: "l1",
    moduleId: "m1",
    courseRawId: "uuid-a",
    courseTitle: "Khóa A",
    courseCoverUrl: "",
    title: "Bài 1",
    description: "Mô tả",
    moduleTitle: "Học phần 1",
    moduleDescription: "",
    readTimeLabel: "",
    minutesRead: 0,
    challengeCount: 0,
    challenges: [],
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
    challengeFree: false,
    freeChallengeSlug: null,
    hasQuiz: false,
    quizId: null,
    isLocked: false,
    accessLevel: "FULL",
    packageSlugs: [],
    teaser: null,
    hasVideo: false,
    videoRef: null,
    documentHtml: null,
    externalRef: null,
    ...over,
})

beforeEach(() => {
    lessonHook.mockReset()
    reportProgress.mockClear()
})

describe("LessonReader — reaction footer + trial CTA wiring", () => {
    it("mounts the reaction footer on the DocumentReader (DOCUMENT) path", () => {
        lessonHook.mockReturnValue({ lesson: makeLesson({ contentType: "DOCUMENT" }), error: undefined, mutate: vi.fn() })
        render(<LessonReader />)
        expect(screen.getByTestId("document-reader")).toBeTruthy()
        const footer = screen.getByTestId("reaction-footer")
        expect(footer).toBeTruthy()
        expect(footer.textContent).toBe("l1:FULL")
    })

    it("shows the trial 'Làm thử thách' CTA when an accessible lesson has a free challenge", () => {
        // Free/trial FULL lesson carrying a free challenge → the CTA routes to its solver.
        lessonHook.mockReturnValue({
            lesson: makeLesson({ isLocked: false, accessLevel: "FULL", freeChallengeSlug: "warm-up" }),
            error: undefined,
            mutate: vi.fn(),
        })
        render(<LessonReader />)
        expect(screen.getByText("reader.trialChallengeCta")).toBeTruthy()
    })

    it("hides the trial CTA when the lesson has no free challenge", () => {
        lessonHook.mockReturnValue({
            lesson: makeLesson({ isLocked: false, freeChallengeSlug: null }),
            error: undefined,
            mutate: vi.fn(),
        })
        render(<LessonReader />)
        expect(screen.queryByText("reader.trialChallengeCta")).toBeNull()
    })

    it("hides the trial CTA on a locked lesson even with a free challenge slug", () => {
        // A free challenge on a NON-accessible lesson stays behind the lock — no trial CTA.
        lessonHook.mockReturnValue({
            lesson: makeLesson({ isLocked: true, accessLevel: "NONE", freeChallengeSlug: "warm-up" }),
            error: undefined,
            mutate: vi.fn(),
        })
        render(<LessonReader />)
        expect(screen.queryByText("reader.trialChallengeCta")).toBeNull()
    })
})

/**
 * C. Bài DOCUMENT phải BÁO "đã mở" cho BE ngay khi mount.
 *
 * BE từ chối `POST /courses/lessons/{id}/complete` bằng `409 COURSE_STATE_INVALID`
 * ("Lesson must be opened before it can be marked complete") khi chưa có bản ghi
 * `LessonProgress`. Bản ghi đó CHỈ sinh ra từ `PUT /courses/lessons/{id}/progress`, mà trước
 * đây chỉ có hook báo vị trí xem VIDEO gọi tới → mọi bài DOCUMENT hoàn thành xong đều bị 409
 * và tiến độ khoá đứng yên ở 0%.
 */
describe("LessonReader — bài DOCUMENT báo 'đã mở' để mark-complete không bị 409", () => {
    it("PUT tiến độ watchedSeconds=0 khi mở bài DOCUMENT chưa hoàn thành", () => {
        lessonHook.mockReturnValue({
            lesson: makeLesson({ contentType: "DOCUMENT", hasVideo: false, isCompleted: false }),
            error: undefined,
            mutate: vi.fn(),
        })
        render(<LessonReader />)
        expect(reportProgress).toHaveBeenCalledWith("l1", {
            watchedSeconds: 0,
            videoDurationSeconds: null,
        })
    })

    it("KHÔNG gọi khi bài đã hoàn thành (server seed) — không ghi đè gì thêm", () => {
        lessonHook.mockReturnValue({
            lesson: makeLesson({ contentType: "DOCUMENT", hasVideo: false, isCompleted: true }),
            error: undefined,
            mutate: vi.fn(),
        })
        render(<LessonReader />)
        expect(reportProgress).not.toHaveBeenCalled()
    })

    it("KHÔNG gọi cho bài VIDEO — vị trí xem đã do useWatchPositionReporter báo", () => {
        lessonHook.mockReturnValue({
            lesson: makeLesson({ contentType: "VIDEO", isVideoLesson: true, hasVideo: true }),
            error: undefined,
            mutate: vi.fn(),
        })
        render(<LessonReader />)
        expect(reportProgress).not.toHaveBeenCalled()
    })
})

describe("LessonReader — preview blur/teaser is DOCUMENT free-trial only", () => {
    /** The teaser fade is the only bottom-gradient in this tree. */
    const fadeCount = (container: HTMLElement) =>
        container.querySelectorAll('[class*="bg-gradient-to-b"]').length

    it("renders NO article fade but DOES show the enroll card for a VIDEO free-trial preview", () => {
        // A VIDEO lesson served as a PREVIEW (locked, accessLevel PREVIEW) with teaser text:
        // the video has its own preview-remaining clamp, so the article must NOT blur — but the
        // lesson is still locked, so the enroll card (previewTitle + "Enroll in course" CTA) MUST
        // render. Regression: the preview-gating change dropped the enroll card for locked videos.
        lessonHook.mockReturnValue({
            lesson: makeLesson({
                contentType: "VIDEO",
                isVideoLesson: true,
                hasVideo: false,
                isLocked: true,
                accessLevel: "PREVIEW",
                bodyByLang: { typescript: "Đoạn teaser của bài video." },
            }),
            error: undefined,
            mutate: vi.fn(),
        })
        const { container } = render(<LessonReader />)
        expect(fadeCount(container)).toBe(0)
        expect(screen.getByText("reader.previewTitle")).toBeTruthy()
        expect(screen.getByText("reader.enrollCta")).toBeTruthy()
    })

    it("bài SLIDE chỉ có link Drive: đã mở khoá thì hiện thẻ tài liệu, chưa mở khoá thì KHÔNG", () => {
        // 14 bài SLIDE của DIC201 mang bài giảng bằng link Drive trong videoRef. Link đó không
        // dựng được player (không phải YouTube/video_*) và không phải HTML thân bài, nên trước
        // đây rơi mất sạch: người ĐÃ MUA mở bài ra thấy trống trơn.
        const drive = "https://drive.google.com/file/d/1Q9whBOJY8hgZIqMdWIDodzy5hKn-hbGT/preview"
        lessonHook.mockReturnValue({
            lesson: makeLesson({
                contentType: "SLIDE",
                hasVideo: false,
                isLocked: false,
                accessLevel: "FULL",
                externalRef: drive,
                bodyByLang: { typescript: "" },
            }),
            error: undefined,
            mutate: vi.fn(),
        })
        const unlocked = render(<LessonReader />)
        expect(screen.getByTestId("resource-links").textContent).toContain(drive)
        unlocked.unmount()

        // Chưa mua: link Drive là TRỌN bài, không kẹp được mốc xem thử như player → tuyệt đối
        // không lộ. Người xem thử vẫn chỉ thấy tường phí.
        lessonHook.mockReturnValue({
            lesson: makeLesson({
                contentType: "SLIDE",
                hasVideo: false,
                isLocked: true,
                accessLevel: "PREVIEW",
                externalRef: drive,
                bodyByLang: { typescript: "" },
            }),
            error: undefined,
            mutate: vi.fn(),
        })
        render(<LessonReader />)
        expect(screen.queryByTestId("resource-links")).toBeNull()
        expect(screen.getByText("reader.previewTitle")).toBeTruthy()
    })

    it("still shows the hard paywall for a fully-locked (no-trial) VIDEO lesson", () => {
        // Fully-locked (accessLevel NONE) keeps its separate hard paywall (lockedTitle).
        lessonHook.mockReturnValue({
            lesson: makeLesson({
                contentType: "VIDEO",
                isVideoLesson: true,
                hasVideo: false,
                isLocked: true,
                accessLevel: "NONE",
                bodyByLang: { typescript: "" },
            }),
            error: undefined,
            mutate: vi.fn(),
        })
        render(<LessonReader />)
        expect(screen.getByText("reader.lockedTitle")).toBeTruthy()
        expect(screen.queryByText("reader.previewTitle")).toBeNull()
    })
})
