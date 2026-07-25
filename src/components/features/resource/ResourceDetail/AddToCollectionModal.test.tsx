import React from "react"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Component — {@link AddToCollectionModal} ("Thêm vào bộ sưu tập" picker).
 *
 * Pins the wiring the button row depends on:
 *  - picking a collection posts to THAT collection id with the open resource id
 *    (`POST /resources/collections/{id}/items`, body `{resourceId}`),
 *  - the item count bumps optimistically and is rolled back off the fresh cache
 *    when the POST fails,
 *  - the BE's duplicate answer (400 `RESOURCE_VALIDATION`, not 409) gets its own
 *    copy instead of the generic failure line,
 *  - the inline "tạo và thêm" creates first, then files the resource into the
 *    brand-new collection id returned by the server.
 */

const h = vi.hoisted(() => {
    /** Stand-in for the REST error the client throws (hoisted → no TDZ in factories). */
    class MockRestError extends Error {
        status: number
        errorCode?: string
        constructor(message: string, status: number, errorCode?: string) {
            super(message)
            this.name = "RestError"
            this.status = status
            this.errorCode = errorCode
        }
    }
    return { RestError: MockRestError }
})

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, values?: Record<string, unknown>) =>
        values ? `${key}(${Object.values(values).join(",")})` : key,
}))

vi.mock("@phosphor-icons/react", () => ({
    CheckIcon: () => <span />,
    PlusIcon: () => <span />,
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
        return { dom, isDisabled: Boolean(isDisabled) }
    }
    const Button = ({
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
    }
    const Passthrough = ({ children }: { children?: React.ReactNode; [k: string]: unknown }) => (
        <div>{children}</div>
    )
    const Modal = Object.assign(
        ({ children, isOpen }: { children?: React.ReactNode; isOpen?: boolean }) =>
            isOpen ? <div>{children}</div> : null,
        {
            Backdrop: Passthrough,
            Container: Passthrough,
            Dialog: Passthrough,
            Header: Passthrough,
            Body: Passthrough,
            Footer: Passthrough,
        },
    )
    const Input = ({ ...rest }: { [k: string]: unknown }) => {
        const { dom } = strip(rest)
        return <input {...(dom as React.InputHTMLAttributes<HTMLInputElement>)} />
    }
    const Label = ({
        children,
        htmlFor,
    }: {
        children?: React.ReactNode
        htmlFor?: string
        [k: string]: unknown
    }) => <label htmlFor={htmlFor}>{children}</label>
    return {
        Button,
        Modal,
        Input,
        Label,
        TextField: Passthrough,
        Chip: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
        Skeleton: () => <div />,
        Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
        toast: { success: vi.fn(), danger: vi.fn() },
    }
})

vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({ children, isEmpty }: { children?: React.ReactNode; isEmpty?: boolean }) =>
        isEmpty ? <div data-testid="empty" /> : <>{children}</>,
}))

vi.mock("@/modules/api/rest/client", () => ({ RestError: h.RestError }))

const addCollectionItem = vi.fn()
vi.mock("@/modules/api/rest/resource", () => ({
    addCollectionItem: (...args: Array<unknown>) => addCollectionItem(...args),
}))

/** Raw BE rows behind the shared collections SWR cache. */
let cache: Array<{ id: string; title: string; itemCount: number }> = []
const mutate = vi.fn(async (updater?: unknown) => {
    if (typeof updater === "function") {
        cache = (updater as (current: unknown) => typeof cache)(cache)
    }
    return cache
})
const create = vi.fn()

vi.mock("../hooks/useQueryCollectionsSwr", () => ({
    resolveResourceErrorKey: (error: unknown) =>
        error instanceof h.RestError && error.status === 403 ? "forbidden" : "generic",
    useQueryCollectionsSwr: () => ({
        collections: cache.map((row) => ({
            id: row.id,
            title: row.title,
            description: "",
            count: row.itemCount,
            kind: "RESOURCE_COLLECTION",
            visibility: "MEMBERS",
        })),
        isLoading: false,
        error: undefined,
        authenticated: true,
        mutate,
        create: (...args: Array<unknown>) => create(...args),
    }),
}))

import { AddToCollectionModal, isAlreadyInCollectionError } from "./AddToCollectionModal"

const renderPicker = () =>
    render(<AddToCollectionModal resourceId="res-9" isOpen onClose={() => undefined} />)

beforeEach(() => {
    cache = [
        { id: "col-1", title: "Ôn thi PE", itemCount: 3 },
        { id: "col-2", title: "Thuật toán", itemCount: 1 },
    ]
    mutate.mockClear()
    addCollectionItem.mockReset()
    create.mockReset()
})

afterEach(cleanup)

describe("AddToCollectionModal", () => {
    it("adds the open resource to the PICKED collection id", async () => {
        addCollectionItem.mockResolvedValue({ id: "item-1" })
        renderPicker()

        // second row → the second "Thêm" button
        fireEvent.click(screen.getAllByText("collections.addAction")[1])

        await waitFor(() => expect(addCollectionItem).toHaveBeenCalledTimes(1))
        expect(addCollectionItem).toHaveBeenCalledWith("col-2", { resourceId: "res-9" })
        // optimistic bump landed on that row only
        expect(cache).toEqual([
            { id: "col-1", title: "Ôn thi PE", itemCount: 3 },
            { id: "col-2", title: "Thuật toán", itemCount: 2 },
        ])
    })

    it("rolls the count back and explains a duplicate (BE answers 400 RESOURCE_VALIDATION)", async () => {
        addCollectionItem.mockRejectedValue(
            new h.RestError("Item đã có trong collection", 400, "RESOURCE_VALIDATION"),
        )
        renderPicker()

        fireEvent.click(screen.getAllByText("collections.addAction")[0])

        await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy())
        expect(screen.getByRole("alert").textContent).toBe("collections.addDuplicate")
        expect(cache[0].itemCount).toBe(3)
    })

    it("uses the generic copy for a real failure", async () => {
        addCollectionItem.mockRejectedValue(new h.RestError("nope", 403, "RESOURCE_ACCESS_DENIED"))
        renderPicker()

        fireEvent.click(screen.getAllByText("collections.addAction")[0])

        await waitFor(() =>
            expect(screen.getByRole("alert").textContent).toBe(
                "collections.addError apiErrors.forbidden",
            ),
        )
        expect(cache[0].itemCount).toBe(3)
    })

    it("creates a collection inline and adds the resource to the NEW id", async () => {
        create.mockResolvedValue({ id: "col-new", title: "Mới", itemCount: 0 })
        addCollectionItem.mockResolvedValue({ id: "item-2" })
        renderPicker()

        fireEvent.change(screen.getByLabelText("collections.create"), {
            target: { value: "  Mới  " },
        })
        fireEvent.click(screen.getByText("collections.createAndAdd"))

        await waitFor(() => expect(addCollectionItem).toHaveBeenCalledTimes(1))
        expect(create).toHaveBeenCalledWith({ title: "Mới" })
        expect(addCollectionItem).toHaveBeenCalledWith("col-new", { resourceId: "res-9" })
    })
})

describe("isAlreadyInCollectionError", () => {
    it("accepts the current 400 + RESOURCE_VALIDATION and a future 409", () => {
        expect(isAlreadyInCollectionError(new h.RestError("x", 400, "RESOURCE_VALIDATION"))).toBe(true)
        expect(isAlreadyInCollectionError(new h.RestError("x", 409))).toBe(true)
    })

    it("does not swallow other 400s or non-REST failures", () => {
        expect(isAlreadyInCollectionError(new h.RestError("x", 400, "RESOURCE_UPLOAD_INCOMPLETE"))).toBe(
            false,
        )
        expect(isAlreadyInCollectionError(new Error("Network Error"))).toBe(false)
    })
})
