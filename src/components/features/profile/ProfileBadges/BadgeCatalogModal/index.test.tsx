import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { BadgeCatalogItem } from "@/modules/api/rest/gamification"

/**
 * Unit — body of the "All badges" dialog.
 *
 * Two contracts are pinned here, both of which the screen got wrong before:
 *
 *  1. **Empty is not broken.** A catalog that legitimately contains zero badges
 *     must render the neutral empty state, NOT "Could not load the badge list"
 *     with a retry button — telling the user to retry a request that already
 *     succeeded sends them into a loop that can never end.
 *  2. **Not-earned reads grey, and still says how to earn it.** The whole point
 *     of listing a badge the viewer does not have is the unlock condition, so the
 *     greying must hit the emblem and the name and must NOT swallow the
 *     description.
 */

vi.mock("next-intl", () => ({
    // Keys come back verbatim, with ICU values appended, so assertions can match
    // on the key instead of on translated prose.
    useTranslations: () => (key: string, values?: Record<string, unknown>) =>
        values ? `${key}:${Object.values(values).join("|")}` : key,
    useLocale: () => "vi",
}))

vi.mock("@heroui/react", () => {
    const cn = (...parts: Array<unknown>) => parts.filter(Boolean).join(" ")
    return {
        cn,
        Typography: ({
            children,
            color,
            className,
        }: {
            children?: React.ReactNode
            color?: string
            className?: string
        }) => (
            <p data-color={color ?? "default"} className={className}>
                {children}
            </p>
        ),
        Chip: ({ children, color }: { children?: React.ReactNode; color?: string }) => (
            <span data-chip-color={color}>{children}</span>
        ),
        Button: ({ children, onPress }: { children?: React.ReactNode; onPress?: () => void }) => (
            <button type="button" onClick={onPress}>
                {children}
            </button>
        ),
        // HeroUI's ProgressBar takes `maxValue` (not `max`) — ProgressMeter forwards
        // that name, so the stub has to use it or the assertions read null.
        ProgressBar: Object.assign(
            ({ value, maxValue }: { value?: number; maxValue?: number }) => (
                <div role="progressbar" aria-valuenow={value} aria-valuemax={maxValue} />
            ),
            { Track: () => <div />, Fill: () => <div /> },
        ),
    }
})

vi.mock("@phosphor-icons/react", () => {
    const Icon = () => <svg />
    return {
        CheckCircleIcon: Icon,
        LockSimpleIcon: Icon,
        MedalIcon: Icon,
        TrophyIcon: Icon,
        TrayIcon: Icon,
        WarningOctagonIcon: Icon,
    }
})

// The skeleton block pulls in ~20 sub-components that are irrelevant here.
vi.mock("@/components/blocks/skeleton/Skeleton", () => {
    const Skeleton = Object.assign(() => <div data-testid="skeleton" />, {
        Typography: () => <div />,
        ProgressBar: () => <div />,
    })
    return { Skeleton }
})

const { BadgeCatalogList } = await import("./BadgeCatalogList")

const item = (over: Partial<BadgeCatalogItem> = {}): BadgeCatalogItem => ({
    code: "FIRST_LESSON",
    kind: "BADGE",
    name: "Bài học đầu tiên",
    description: "Hoàn thành bài học đầu tiên",
    iconUrl: null,
    counterKey: "lesson.completed",
    threshold: 1,
    progress: 0,
    earned: false,
    awardedAt: null,
    sortOrder: 10,
    ...over,
})

describe("BadgeCatalogList — empty is not an error", () => {
    it("renders the neutral empty state (no retry) when the system has no badges", () => {
        render(<BadgeCatalogList isLoading={false} error={undefined} items={[]} onRetry={vi.fn()} />)

        expect(screen.getByText("empty")).toBeTruthy()
        expect(screen.getByText("emptyDescription")).toBeTruthy()
        // The failure mode being pinned: an empty catalog must not accuse the server.
        expect(screen.queryByText("error")).toBeNull()
        expect(screen.queryByText("retry")).toBeNull()
    })

    it("renders the error state with a retry only when the request actually failed", () => {
        render(
            <BadgeCatalogList
                isLoading={false}
                error={new Error("404")}
                items={[]}
                onRetry={vi.fn()}
            />,
        )

        expect(screen.getByText("error")).toBeTruthy()
        expect(screen.getByText("retry")).toBeTruthy()
        expect(screen.queryByText("empty")).toBeNull()
    })

    it("fires the retry handler from the error state", () => {
        const onRetry = vi.fn()
        render(
            <BadgeCatalogList isLoading={false} error={new Error("boom")} items={[]} onRetry={onRetry} />,
        )

        screen.getByText("retry").click()

        expect(onRetry).toHaveBeenCalledTimes(1)
    })
})

describe("BadgeCatalogList — earned in colour, locked in grey", () => {
    it("greys the emblem and the name of a badge the viewer has not earned", () => {
        render(
            <BadgeCatalogList
                isLoading={false}
                error={undefined}
                items={[item({ code: "LOCKED_ONE", iconUrl: "https://cdn.example/badge.png" })]}
                onRetry={vi.fn()}
            />,
        )

        const row = screen.getByTestId("badge-row-LOCKED_ONE")
        expect(row.getAttribute("data-earned")).toBe("false")
        // The ARTWORK is what a user reads first — a full-colour icon on a locked
        // row is exactly the bug ("hiện xám" was the ask).
        const icon = row.querySelector("img")
        expect(icon?.className).toContain("grayscale")
        // …and the NAME is muted, so the row reads locked even without artwork.
        expect(row.querySelector("p")?.getAttribute("data-color")).toBe("muted")
    })

    it("keeps the unlock condition visible and labelled on a locked badge", () => {
        render(
            <BadgeCatalogList
                isLoading={false}
                error={undefined}
                items={[item({ code: "LOCKED_TWO", description: "Hoàn thành 10 bài học" })]}
                onRetry={vi.fn()}
            />,
        )

        // Labelled as the unlock condition, not left as bare flavour text.
        expect(screen.getByText("howToEarn:Hoàn thành 10 bài học")).toBeTruthy()
        expect(screen.getByText("locked")).toBeTruthy()
    })

    it("renders an earned badge in full colour with its award date", () => {
        render(
            <BadgeCatalogList
                isLoading={false}
                error={undefined}
                items={[
                    item({
                        code: "EARNED_ONE",
                        earned: true,
                        progress: 1,
                        awardedAt: "2026-08-01T03:00:00Z",
                        iconUrl: "https://cdn.example/badge.png",
                    }),
                ]}
                onRetry={vi.fn()}
            />,
        )

        const row = screen.getByTestId("badge-row-EARNED_ONE")
        expect(row.getAttribute("data-earned")).toBe("true")
        expect(row.querySelector("img")?.className).not.toContain("grayscale")
        expect(row.querySelector("p")?.getAttribute("data-color")).toBe("default")
        expect(screen.getByText(/^earnedOn:/)).toBeTruthy()
        // An earned badge shows WHEN, not a progress bar it already finished.
        expect(row.querySelector("[role='progressbar']")).toBeNull()
    })

    it("draws progress toward the threshold for a measurable locked badge", () => {
        render(
            <BadgeCatalogList
                isLoading={false}
                error={undefined}
                items={[item({ code: "POST_20", counterKey: "community.post.created", threshold: 20, progress: 12 })]}
                onRetry={vi.fn()}
            />,
        )

        const bar = screen.getByTestId("badge-row-POST_20").querySelector("[role='progressbar']")
        expect(bar?.getAttribute("aria-valuenow")).toBe("12")
        expect(bar?.getAttribute("aria-valuemax")).toBe("20")
    })

    it("draws no progress bar for a badge with no measurable counter", () => {
        render(
            <BadgeCatalogList
                isLoading={false}
                error={undefined}
                items={[item({ code: "MYSTERY", counterKey: null, threshold: 0 })]}
                onRetry={vi.fn()}
            />,
        )

        expect(
            screen.getByTestId("badge-row-MYSTERY").querySelector("[role='progressbar']"),
        ).toBeNull()
    })
})
