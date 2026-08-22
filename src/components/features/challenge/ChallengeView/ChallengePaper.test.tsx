import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * Component — {@link ChallengePaper}: the two-pane PE paper surface of a `pe`-tagged
 * challenge.
 *
 * Two things are pinned, because both are decisions rather than styling:
 *
 * 1. **Which LEFT pane a paper gets.** A photographed sheet must reach the SHARED
 *    `ExamImageViewer` (zoom/pan already solved there) and be handed exactly ONE image —
 *    the challenge contract carries a single `paperUrl`, and a fabricated multi-page array
 *    would make the viewer offer carets for pages that do not exist. A PDF keeps the
 *    embedded frame, an archive and an unknown format keep their own cards, and a paperless
 *    challenge renders nothing at all so the caller can fall back to the solve surface.
 *
 * 2. **The hand-in block is present and DEAD.** AI grading for papers is unsold, so the
 *    right column must be laid out (so unlocking is a flag, not a redesign) yet impossible
 *    to start: the action disabled, the reason stated, and — the part that actually
 *    matters — no file input anywhere in the tree.
 *
 * 3. **The uploader block DEGRADES.** `ChallengeView.author` is nullable by contract (no
 *    `created_by`, no profile, or an older BE), so the block must vanish entirely rather
 *    than print a placeholder identity — and must render the real card when there is one.
 *
 * `t` echoes the key, with any params appended after `#`, so assertions key off message ids.
 */

vi.mock("next-intl", () => ({
    useTranslations:
        () =>
            (key: string, params?: Record<string, unknown>) =>
                params ? `${key}#${Object.values(params).join(",")}` : key,
    // The uploader's posted time is formatted against the active locale.
    useLocale: () => "vi",
}))

vi.mock("@heroui/react", () => {
    const Typography = ({ children }: { children?: React.ReactNode }) => <span>{children}</span>
    return {
        Typography,
        Chip: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
        Button: ({
            children,
            isDisabled,
        }: {
            children?: React.ReactNode
            isDisabled?: boolean
        }) => (
            <button type="button" disabled={isDisabled}>
                {children}
            </button>
        ),
        cn: (...args: Array<unknown>) => args.filter(Boolean).join(" "),
    }
})

vi.mock("@phosphor-icons/react", () => ({
    ArrowSquareOutIcon: () => <span />,
    FileXIcon: () => <span />,
    FileZipIcon: () => <span />,
    LockSimpleIcon: () => <span />,
    UploadSimpleIcon: () => <span />,
}))

/**
 * The shared viewer is stubbed down to what it was HANDED: this spec is about branch
 * selection and the single-image contract, while the viewer's own paging/zoom behaviour is
 * pinned in `ExamImageViewer/index.test.tsx`.
 */
vi.mock("@/components/features/subject/ExamImageViewer", () => ({
    ExamImageViewer: ({ images }: { images: Array<{ id: string; imageUrl: string }> }) => (
        <div data-testid="exam-image-viewer" data-count={images.length}>
            {images.map((image) => (
                <span key={image.id}>{image.imageUrl}</span>
            ))}
        </div>
    ),
}))

/**
 * The SHARED identity link is stubbed down to what it was handed — this spec is about
 * whether the uploader is named AT ALL and with which card; the hovercard, profile link
 * and avatar fallback are pinned in `UserLink/index.test.tsx`. `showAvatar={false}` is
 * echoed so the double-render (avatar column + name row) stays visible to assertions.
 */
vi.mock("@/components/features/identity", () => ({
    UserLink: ({
        username,
        displayName,
        avatar,
        showAvatar = true,
    }: {
        username?: string | null
        displayName?: string | null
        avatar?: string | null
        showAvatar?: boolean
    }) => (
        <span
            data-testid="user-link"
            data-username={username ?? ""}
            data-avatar={avatar ?? ""}
            data-with-avatar={String(showAvatar)}
        >
            {displayName}
        </span>
    ),
}))

/**
 * The comment thread is stubbed to its INPUTS: it owns its own SWR reads, composer and
 * pager (and has its own adapter concerns), while what this spec pins is that the paper
 * surface mounts it and keys it off the challenge's real UUID. Stubbing it also keeps the
 * "no input / no form" pin about the HAND-IN block, which is what that pin is for.
 */
vi.mock("./ChallengePaperCommentThread", () => ({
    ChallengePaperCommentThread: ({ challengeId }: { challengeId: string }) => (
        <div data-testid="challenge-comments" data-challenge-id={challengeId} />
    ),
}))

import { ChallengePaper, IS_PAPER_GRADING_OPEN } from "./ChallengePaper"
import type { ChallengeAuthorView } from "@/modules/api/rest/challenges/types"

/** A resolved uploader card, the shape the BE `AuthorView` ships. */
const AUTHOR: ChallengeAuthorView = {
    userId: "11111111-1111-1111-1111-111111111111",
    username: "minhdev",
    displayName: "Minh Dev",
    avatarUrl: "https://cdn/avatar.png",
}

/** Renders the paper surface for one BE (`paperUrl`, `paperMime`) pair. */
const setup = (
    paperUrl: string | null,
    paperMime: string | null,
    extra?: {
        challengeId?: string
        author?: ChallengeAuthorView | null
        createdAt?: string | null
        inModal?: boolean
        heading?: React.ReactNode
    },
) =>
    render(
        <ChallengePaper
            paperUrl={paperUrl}
            paperMime={paperMime}
            title="PE PRF192"
            challengeId={extra?.challengeId}
            author={extra?.author}
            createdAt={extra?.createdAt}
            inModal={extra?.inModal}
            heading={extra?.heading}
        />,
    )

describe("ChallengePaper — left pane by paper kind", () => {
    it("sends a photographed sheet to the SHARED viewer, as exactly one image", () => {
        setup("https://storage/de-pe.jpg", "image/png")
        const viewer = screen.getByTestId("exam-image-viewer")
        expect(viewer.getAttribute("data-count")).toBe("1")
        expect(screen.getByText("https://storage/de-pe.jpg")).toBeTruthy()
    })

    it("classifies from the URL when the BE ships no MIME, and still uses the viewer", () => {
        setup("https://storage/de-pe.webp?sig=abc", null)
        expect(screen.getByTestId("exam-image-viewer")).toBeTruthy()
    })

    it("keeps the embedded frame for a PDF instead of the picture viewer", () => {
        const { container } = setup("https://storage/de-pe.pdf", "application/pdf")
        expect(screen.queryByTestId("exam-image-viewer")).toBeNull()
        const frame = container.querySelector("iframe")
        expect(frame?.getAttribute("src")).toBe("https://storage/de-pe.pdf")
    })

    it("keeps the download card for an archive — not the failure copy", () => {
        setup("https://storage/de-pe.zip", "application/zip")
        expect(screen.getByText("paper.archiveHint")).toBeTruthy()
        expect(screen.queryByText("paper.noPreview")).toBeNull()
        expect(screen.queryByTestId("exam-image-viewer")).toBeNull()
    })

    it("says plainly that an unshowable format cannot be rendered inline", () => {
        setup("https://storage/de-pe.docx", "application/msword")
        expect(screen.getByText("paper.noPreview")).toBeTruthy()
        expect(screen.queryByTestId("exam-image-viewer")).toBeNull()
    })

    it("renders nothing for a challenge that carries no paper", () => {
        const { container } = setup(null, "image/png")
        expect(container.firstChild).toBeNull()
    })

    it("always offers the escape hatch to the original file", () => {
        const { container } = setup("https://storage/de-pe.docx", "application/msword")
        expect(container.querySelector("a")?.getAttribute("href")).toBe(
            "https://storage/de-pe.docx",
        )
        expect(screen.getByText("paper.open")).toBeTruthy()
    })
})

describe("ChallengePaper — the gated hand-in column", () => {
    it("is still SOLD LATER — the flag the column is built around stays off", () => {
        expect(IS_PAPER_GRADING_OPEN).toBe(false)
    })

    it("renders the hand-in block next to the paper, with its reason", () => {
        setup("https://storage/de-pe.jpg", "image/png")
        expect(screen.getByText("paper.submit.title")).toBeTruthy()
        expect(screen.getByText("paper.submit.dropzone")).toBeTruthy()
        expect(screen.getByText("paper.submit.lockedBadge")).toBeTruthy()
        expect(screen.getByText("paper.gradingLocked")).toBeTruthy()
    })

    it("cannot be started: the action is disabled and no file input exists", () => {
        const { container } = setup("https://storage/de-pe.pdf", "application/pdf")
        const action = screen.getByText("paper.submit.cta").closest("button")
        expect((action as HTMLButtonElement).disabled).toBe(true)
        expect(container.querySelector("input")).toBeNull()
        expect(container.querySelector("form")).toBeNull()
    })

    it("accompanies every paper kind, not just the ones with a viewer", () => {
        setup("https://storage/de-pe.docx", "application/msword")
        expect(screen.getByText("paper.submit.title")).toBeTruthy()
    })

    it("stays inert once the uploader + thread share the column with it", () => {
        const { container } = setup("https://storage/de-pe.jpg", "image/png", {
            challengeId: "c-1",
            author: AUTHOR,
        })
        const action = screen.getByText("paper.submit.cta").closest("button")
        expect((action as HTMLButtonElement).disabled).toBe(true)
        expect(container.querySelector("input")).toBeNull()
        expect(container.querySelector("form")).toBeNull()
    })
})

/**
 * Inside a DIALOG the surface keeps the same responsive two-pane layout as FE; the ONE
 * thing that differs is where the frame's height comes from.
 *
 * Cái này từng làm ngược: `inModal` gỡ sạch mọi ràng buộc chiều cao và để cả dialog cuộn
 * như một khối, nên khung xem đề mắc kẹt ở sàn `60dvh` — người ta mở popup lên để NHÌN
 * ĐỀ mà đề lại là thứ nhỏ nhất trong popup. Giờ dialog tự ghim `h-[92vh]`, khung đề
 * `lg:flex-1` vào phần còn lại, và cột phải cuộn trong chính nó y như trên trang. Ba mắt
 * xích (`section` → khung → pane) đều được ghim ở đây vì thiếu MỘT mắt là `flex-1` rơi
 * vào chiều cao auto và khung lại bẹp về `60dvh` — hỏng im lặng, nhìn ảnh chụp mới thấy.
 */
describe("ChallengePaper — inside a dialog", () => {
    it("takes its height from the DIALOG (flex-1), not from the viewport", () => {
        const { container } = setup("https://storage/de-pe.jpg", "image/png", {
            challengeId: "c-1",
            author: AUTHOR,
            inModal: true,
        })
        const markup = container.innerHTML
        expect(markup).not.toContain("lg:h-[calc(100dvh-12rem)]")
        // Mắt xích giữa: section phải nhường chiều cao xuống, nếu không khung `flex-1`
        // vào một cột auto và không cao thêm được chút nào.
        const section = container.querySelector("section")
        expect(section?.className).toContain("lg:flex-1")
        expect(markup).toContain("lg:flex-1")
        // ★ …nhưng CHỈ từ `lg`. `min-h-0` trần bỏ sàn co ở mọi cỡ màn, và dưới `lg` cột
        // `overflow-y-auto` của ChallengeView sẽ bóp section này lại rồi `overflow-hidden`
        // của khung cắt mất khối nộp bài + thảo luận — không có thanh cuộn nào để tới.
        expect(section?.className).toContain("lg:min-h-0")
        expect(section?.className.split(/\s+/)).not.toContain("min-h-0")
        // …và cột phải co giãn theo bề ngang popup (sàn 25rem) thay vì một sợi 400px cố
        // định để pane trái letterbox gần 1000px nền trống ở 1920.
        expect(markup).toContain("lg:grid-cols-[minmax(0,1fr)_minmax(25rem,32%)]")
        expect(markup).not.toContain("2xl:grid-cols-[minmax(0,1fr)_30rem]")
    })

    it("cột phải cuộn TRONG chính nó — đó là thứ giữ khung đề cao", () => {
        const { container } = setup("https://storage/de-pe.jpg", "image/png", {
            challengeId: "c-1",
            author: AUTHOR,
            inModal: true,
        })
        // Không cap thì khối nộp bài + thảo luận cao tự nhiên và đẩy khung đề bẹp lại.
        expect(container.innerHTML).toContain("lg:max-h-[45%]")
        expect(screen.getByText("paper.submit.title")).toBeTruthy()
        expect(screen.getByText("paper.submit.dropzone")).toBeTruthy()
        expect(screen.getByTestId("challenge-comments")).toBeTruthy()
    })

    it("đặt cụm tiêu đề chủ gọi trao vào ĐẦU cột phải, chỉ từ lg", () => {
        const { container } = setup("https://storage/de-pe.jpg", "image/png", {
            challengeId: "c-1",
            author: AUTHOR,
            inModal: true,
            heading: <span data-testid="paper-heading">SWE202c_SP26_PE1</span>,
        })
        const heading = screen.getByTestId("paper-heading")
        expect(heading).toBeTruthy()
        // `hidden lg:flex`: dưới `lg` hai pane xếp dọc và bản trên cùng của ChallengeView
        // mới là bản đúng thứ tự đọc — đúng một bản hiện tại mỗi lúc.
        expect(heading.parentElement?.className).toContain("hidden")
        expect(heading.parentElement?.className).toContain("lg:flex")
        // Đứng TRƯỚC "Tệp đính kèm"/khối nộp bài trong cột phải.
        expect(container.innerHTML.indexOf("paper-heading")).toBeLessThan(
            container.innerHTML.indexOf("paper.submit.title"),
        )
        // ★ …nhưng NGOÀI dải bị cap `lg:max-h-[45%]`. Nằm trong đó thì trên laptop 768px
        // (dải ≈ 264px) riêng cụm tiêu đề đã ăn ~150px và nút "Nộp bài" bị đẩy khuất.
        expect(heading.closest("[class*='lg:max-h-[45%]']")).toBeNull()
    })

    it("không có cụm tiêu đề nào được trao → cột phải y như cũ", () => {
        setup("https://storage/de-pe.jpg", "image/png", {
            challengeId: "c-1",
            inModal: true,
        })
        expect(screen.queryByTestId("paper-heading")).toBeNull()
    })

    it("leaves the page layout exactly as it was when it is NOT in a dialog", () => {
        const { container } = setup("https://storage/de-pe.jpg", "image/png", {
            challengeId: "c-1",
            author: AUTHOR,
        })
        const markup = container.innerHTML
        expect(markup).toContain("lg:h-[calc(100dvh-12rem)]")
        expect(markup).toContain("lg:max-h-[45%]")
        // Bố cục TRANG không đổi: cột phải vẫn 400px cố định — "chỉ đổi khi inModal".
        expect(markup).toContain("lg:grid-cols-[minmax(0,1fr)_400px]")
        // Trang không mượn chiều cao của ai: không `flex-1` ở đâu trong chuỗi.
        expect(markup).not.toContain("lg:flex-1")
    })
})

describe("ChallengePaper — who uploaded the paper", () => {
    it("names the uploader from the BE card, with the handle", () => {
        setup("https://storage/de-pe.jpg", "image/png", { author: AUTHOR })
        expect(screen.getByText("paper.uploader")).toBeTruthy()
        expect(screen.getAllByText("Minh Dev").length).toBeGreaterThan(0)
        expect(screen.getByText("@minhdev")).toBeTruthy()
    })

    it("hands the shared identity component the real card", () => {
        setup("https://storage/de-pe.jpg", "image/png", { author: AUTHOR })
        const links = screen.getAllByTestId("user-link")
        expect(links.length).toBe(2)
        expect(links.every((link) => link.getAttribute("data-username") === "minhdev")).toBe(
            true,
        )
        // One instance carries the avatar column, the other the name row.
        expect(links.map((link) => link.getAttribute("data-with-avatar")).sort()).toEqual([
            "false",
            "true",
        ])
        expect(links[0]?.getAttribute("data-avatar")).toBe("https://cdn/avatar.png")
    })

    it("HIDES the block entirely when the BE ships no author", () => {
        setup("https://storage/de-pe.jpg", "image/png", { author: null })
        expect(screen.queryByText("paper.uploader")).toBeNull()
        expect(screen.queryAllByTestId("user-link").length).toBe(0)
    })

    it("hides it just the same when the field is absent (older BE)", () => {
        setup("https://storage/de-pe.pdf", "application/pdf")
        expect(screen.queryByText("paper.uploader")).toBeNull()
    })

    it("falls back to the username when the profile carries no display name", () => {
        setup("https://storage/de-pe.jpg", "image/png", {
            author: { ...AUTHOR, displayName: null },
        })
        expect(screen.getAllByText("minhdev").length).toBeGreaterThan(0)
    })

    it("drops the handle line when the profile carries no username", () => {
        setup("https://storage/de-pe.jpg", "image/png", {
            author: { ...AUTHOR, username: null },
        })
        expect(screen.getByText("paper.uploader")).toBeTruthy()
        expect(screen.queryByText("@null")).toBeNull()
        expect(screen.queryByText("@")).toBeNull()
    })

    /**
     * WHEN the paper went up, next to WHO put it up — the pairing the FE album already
     * prints. The important half is the negative one: `ChallengeViews.ChallengeView`
     * exposes NO creation instant today, so the surface has to stay silent rather than
     * reach for `startsAt` (a different fact) or the client clock (a fabricated one).
     */
    describe("posted time", () => {
        it("prints a relative timestamp beside the uploader when the BE sends one", () => {
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            setup("https://storage/de-pe.jpg", "image/png", {
                author: AUTHOR,
                createdAt: twoHoursAgo,
            })
            expect(screen.getByText("2 giờ trước")).toBeTruthy()
        })

        it("says nothing at all when the BE ships no timestamp (every build today)", () => {
            const { container } = setup("https://storage/de-pe.jpg", "image/png", {
                author: AUTHOR,
            })
            expect(screen.getByText("paper.uploader")).toBeTruthy()
            expect(container.textContent).not.toMatch(/trước|ago|Invalid/)
        })

        it("ignores an unparseable instant instead of rendering 'Invalid Date'", () => {
            const { container } = setup("https://storage/de-pe.jpg", "image/png", {
                author: AUTHOR,
                createdAt: "not-a-date",
            })
            expect(container.textContent).not.toMatch(/Invalid/)
        })
    })
})

describe("ChallengePaper — the discussion thread", () => {
    it("mounts the thread keyed off the challenge's real UUID", () => {
        setup("https://storage/de-pe.jpg", "image/png", { challengeId: "chal-uuid-1" })
        const thread = screen.getByTestId("challenge-comments")
        expect(thread.getAttribute("data-challenge-id")).toBe("chal-uuid-1")
    })

    it("accompanies every paper kind, uploader or not", () => {
        setup("https://storage/de-pe.zip", "application/zip", { challengeId: "chal-uuid-2" })
        expect(screen.getByTestId("challenge-comments")).toBeTruthy()
        expect(screen.queryByText("paper.uploader")).toBeNull()
    })

    it("is not mounted at all without an id to key it off", () => {
        setup("https://storage/de-pe.jpg", "image/png", { author: AUTHOR })
        expect(screen.queryByTestId("challenge-comments")).toBeNull()
    })
})
