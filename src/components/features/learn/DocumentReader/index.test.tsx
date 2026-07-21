import React from "react"
import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * Component — the locked-document teaser fade.
 *
 * Regression: a locked lesson whose teaser body is EMPTY (`bodyMd: ""` — what the BE returns for
 * DOCUMENT lessons carrying files/links instead of markdown) left the article container 0px tall,
 * so the `absolute bottom-0 h-72` gradient spilled UPWARD over the lesson title: a white veil
 * across content that was never there. The fade must only exist when there is text to fade out.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useFormatter: () => ({ number: (n: number) => String(n) }),
}))

vi.mock("@phosphor-icons/react", () => ({
    LockSimpleIcon: () => <span />,
    BookOpenIcon: () => <span />,
}))

vi.mock("@heroui/react", () => ({
    Button: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
    Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
}))

vi.mock("@/components/reuseable/MarkdownContent", () => ({
    MarkdownContent: ({ markdown }: { markdown: string }) => <div>{markdown}</div>,
}))
vi.mock("@/components/blocks/async/EmptyContent", () => ({ EmptyContent: () => <div /> }))
vi.mock("@/components/features/learn/LessonReader/LessonResourceLinks", () => ({
    LessonResourceLinks: () => <div />,
}))
vi.mock("@/components/features/learn/LessonReader/LessonDocumentHtml", () => ({
    LessonDocumentHtml: () => <div />,
}))
vi.mock("@/components/features/learn/LessonReader/ContentAiSelectionAsk/SelectionHintCallout", () => ({
    SelectionHintCallout: () => <div />,
}))
vi.mock("@/components/features/course/PackageGateModal", () => ({ PackageGateModal: () => <div /> }))

import { DocumentReader } from "./index"

const props = {
    documentHtml: "",
    accessLevel: "PREVIEW",
    teaser: { reason: "PREVIEW", cheapestPackage: null },
    courseId: "khoa-a",
    courseRawId: "uuid-a",
    courseTitle: "Khóa A",
    lessonId: "l1",
    lessonTitle: "Bài 1",
    packageSlugs: [],
    onPurchased: vi.fn(),
}

/** The teaser fade is the only gradient in this tree. */
const fadeCount = (container: HTMLElement) =>
    container.querySelectorAll('[class*="bg-gradient-to-b"]').length

describe("DocumentReader — locked teaser fade", () => {
    it("renders no fade when the locked lesson has no teaser body", () => {
        const { container } = render(<DocumentReader {...props} bodyMd="" locked />)
        expect(fadeCount(container)).toBe(0)
    })

    it("renders the fade when the locked lesson does have teaser text", () => {
        const { container } = render(<DocumentReader {...props} bodyMd="Đoạn teaser thật." locked />)
        expect(fadeCount(container)).toBe(1)
    })

    it("renders no fade once the lesson is unlocked", () => {
        const { container } = render(
            <DocumentReader {...props} bodyMd="Nội dung đầy đủ." locked={false} accessLevel="FULL" />,
        )
        expect(fadeCount(container)).toBe(0)
    })
})
