import React from "react"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Component — {@link ResourceRating} composer against `GET/DELETE /resources/{id}/ratings/me`.
 *
 * A viewer who had already rated used to face an empty composer and a "submit" button, with
 * no way to withdraw the rating at all. Pinned here: the stored stars/review are PREFILLED
 * from the BE, the CTA switches to "update" (the POST is an upsert), and a confirmed delete
 * clears the composer and refreshes BOTH the aggregate (avg/count) and the own-rating cache
 * — a delete that only dropped the row would leave a stale average on screen.
 */

const RESOURCE = "resource-uuid"

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, values?: Record<string, unknown>) =>
        values ? `${key}(${Object.values(values).join(",")})` : key,
    useLocale: () => "vi",
}))

vi.mock("next/navigation", () => ({ useParams: () => ({ resourceId: RESOURCE }) }))

vi.mock("@phosphor-icons/react", () => ({
    StarIcon: () => <span />,
    TrashIcon: () => <span />,
}))

vi.mock("@heroui/react", () => {
    const strip = (rest: Record<string, unknown>) => {
        const {
            variant,
            size,
            className,
            isIconOnly,
            isPending,
            isDisabled,
            color,
            type,
            weight,
            truncate,
            rows,
            ...dom
        } = rest
        void variant
        void size
        void className
        void isIconOnly
        void isPending
        void color
        void type
        void weight
        void truncate
        void rows
        return { dom, isDisabled: Boolean(isDisabled) }
    }
    return {
        Button: ({
            children,
            onPress,
            ...rest
        }: {
            children?: React.ReactNode
            onPress?: () => void
            [k: string]: unknown
        }) => {
            const { dom, isDisabled } = strip(rest)
            return (
                <button type="button" disabled={isDisabled} onClick={() => onPress?.()} {...dom}>
                    {children}
                </button>
            )
        },
        Skeleton: () => <div />,
        Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
        TextField: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
        TextArea: (props: Record<string, unknown>) => {
            const { dom } = strip(props)
            return <textarea {...(dom as React.ComponentProps<"textarea">)} />
        },
        cn: (...args: Array<unknown>) => args.filter(Boolean).join(" "),
        toast: { success: vi.fn(), danger: vi.fn(), warning: vi.fn() },
    }
})

vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({ children, isEmpty }: { children?: React.ReactNode; isEmpty?: boolean }) =>
        isEmpty ? <div data-testid="empty" /> : <>{children}</>,
}))

vi.mock("@/components/reuseable/PostEngagementBar", () => ({
    ConfirmDialog: ({
        isOpen,
        onConfirm,
        onClose,
    }: {
        isOpen: boolean
        onConfirm: () => void
        onClose: () => void
    }) =>
        isOpen ? (
            <div>
                <button type="button" data-testid="confirm" onClick={onConfirm}>
                    confirm
                </button>
                <button type="button" data-testid="cancel" onClick={onClose}>
                    cancel
                </button>
            </div>
        ) : null,
}))

vi.mock("@/components/reuseable/UserAvatar", () => ({ UserAvatar: () => <span /> }))

vi.mock("@/components/features/community/hooks/relativeTime", () => ({
    formatRelativeTime: () => "hôm qua",
}))

vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (state: unknown) => unknown) =>
        selector({ user: { user: { id: "viewer" } }, keycloak: { authenticated: true } }),
}))

vi.mock("@/hooks/useRequireAuth", () => ({
    useRequireAuth: () => ({ authenticated: true, requireAuth: () => true }),
}))

const listMutate = vi.fn()
vi.mock("../hooks/useQueryReviewsSwr", () => ({
    REVIEW_STAR_BUCKETS: [5, 4, 3, 2, 1],
    useQueryReviewsSwr: () => ({
        summary: { avg: 4, count: 1 },
        reviews: [],
        avg: 4,
        count: 1,
        distribution: {},
        total: 0,
        isLoading: false,
        isValidating: false,
        error: undefined,
        mutate: listMutate,
    }),
}))

const rateSubmit = vi.fn()
vi.mock("../hooks/useMutateRateResourceSwr", () => ({
    useMutateRateResourceSwr: () => ({ submit: rateSubmit, isMutating: false }),
}))

/** The rating `GET /ratings/me` answers with — `null` = the viewer has not rated. */
let storedRating: {
    id: string
    userId: string
    stars: number
    review?: string
    updatedAt?: string
} | null = null
const myRatingMutate = vi.fn()
vi.mock("../hooks/useQueryMyResourceRatingSwr", () => ({
    useQueryMyResourceRatingSwr: () => ({
        myRating: storedRating,
        hasRating: Boolean(storedRating),
        isLoading: false,
        error: undefined,
        mutate: myRatingMutate,
    }),
}))

const removeRating = vi.fn()
vi.mock("../hooks/useMutateDeleteMyResourceRatingSwr", () => ({
    useMutateDeleteMyResourceRatingSwr: () => ({ remove: removeRating, isMutating: false }),
}))

import { ResourceRating } from "./index"

/** The review textarea (the only one on the page). */
const composer = () => screen.getByPlaceholderText("reviews.placeholder") as HTMLTextAreaElement

/** Star buttons, 1 → 5. */
const stars = () => [1, 2, 3, 4, 5].map((star) => screen.getByLabelText(`reviews.starLabel(${star})`))

beforeEach(() => {
    storedRating = null
    listMutate.mockReset()
    myRatingMutate.mockReset()
    rateSubmit.mockReset()
    removeRating.mockReset()
})

afterEach(cleanup)

describe("ResourceRating — own rating", () => {
    it("leaves the composer empty and offers no delete when nothing is stored", () => {
        render(<ResourceRating />)

        expect(composer().value).toBe("")
        expect(stars().every((star) => star.getAttribute("aria-pressed") === "false")).toBe(true)
        expect(screen.getByText("reviews.submit")).toBeTruthy()
        expect(screen.queryByText("reviews.delete")).toBeNull()
    })

    it("prefills the stored stars + review and switches the CTA to update", () => {
        storedRating = {
            id: "rating-1",
            userId: "viewer",
            stars: 4,
            review: "tài liệu tốt",
            updatedAt: "2026-07-20T00:00:00Z",
        }
        render(<ResourceRating />)

        expect(composer().value).toBe("tài liệu tốt")
        expect(stars().map((star) => star.getAttribute("aria-pressed"))).toEqual([
            "true",
            "true",
            "true",
            "true",
            "false",
        ])
        expect(screen.getByText("reviews.update")).toBeTruthy()
        expect(screen.queryByText("reviews.submit")).toBeNull()
    })

    it("submits the prefilled rating as an upsert without retyping it", async () => {
        storedRating = { id: "rating-1", userId: "viewer", stars: 4, review: "tài liệu tốt" }
        rateSubmit.mockResolvedValue({ status: "rated", rating: { id: "rating-1" } })
        render(<ResourceRating />)

        fireEvent.click(screen.getByText("reviews.update"))

        await waitFor(() =>
            expect(rateSubmit).toHaveBeenCalledWith(RESOURCE, {
                stars: 4,
                review: "tài liệu tốt",
            }),
        )
        // The composer keeps showing what is now stored instead of blanking out.
        expect(composer().value).toBe("tài liệu tốt")
        expect(listMutate).toHaveBeenCalled()
        expect(myRatingMutate).toHaveBeenCalled()
    })

    it("asks before deleting and writes nothing when the confirm is cancelled", () => {
        storedRating = { id: "rating-1", userId: "viewer", stars: 4, review: "tài liệu tốt" }
        render(<ResourceRating />)

        fireEvent.click(screen.getByText("reviews.delete"))
        expect(removeRating).not.toHaveBeenCalled()

        fireEvent.click(screen.getByTestId("cancel"))
        expect(removeRating).not.toHaveBeenCalled()
        expect(composer().value).toBe("tài liệu tốt")
    })

    it("clears the composer and refreshes list + own rating on a confirmed delete", async () => {
        storedRating = { id: "rating-1", userId: "viewer", stars: 4, review: "tài liệu tốt" }
        removeRating.mockResolvedValue({ status: "deleted" })
        render(<ResourceRating />)

        fireEvent.click(screen.getByText("reviews.delete"))
        fireEvent.click(screen.getByTestId("confirm"))

        await waitFor(() => expect(removeRating).toHaveBeenCalledWith(RESOURCE))
        await waitFor(() => expect(composer().value).toBe(""))
        expect(stars().every((star) => star.getAttribute("aria-pressed") === "false")).toBe(true)
        // The aggregate moves with the deleted rating, so BOTH caches are revalidated.
        expect(listMutate).toHaveBeenCalled()
        expect(myRatingMutate).toHaveBeenCalled()
    })

    it("keeps the composer intact when the delete is refused", async () => {
        storedRating = { id: "rating-1", userId: "viewer", stars: 4, review: "tài liệu tốt" }
        removeRating.mockResolvedValue({ status: "forbidden" })
        render(<ResourceRating />)

        fireEvent.click(screen.getByText("reviews.delete"))
        fireEvent.click(screen.getByTestId("confirm"))

        await waitFor(() => expect(removeRating).toHaveBeenCalledWith(RESOURCE))
        expect(composer().value).toBe("tài liệu tốt")
        expect(listMutate).not.toHaveBeenCalled()
    })
})
