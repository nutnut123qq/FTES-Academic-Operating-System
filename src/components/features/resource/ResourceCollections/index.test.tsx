import React from "react"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Component — {@link ResourceCollections} row management.
 *
 * Pins the destructive/edit wiring:
 *  - "Xoá" NEVER writes straight off the icon: it opens the confirm dialog, and a
 *    cancelled confirm leaves the list (and the BE) untouched,
 *  - confirming deletes THAT collection id, drops the row optimistically through
 *    `mutate`, and re-inserts it at its old index when the DELETE fails,
 *  - "Sửa" submits a trimmed title/description to `PATCH /collections/{id}` and
 *    patches the cached row in place.
 */

const h = vi.hoisted(() => {
    class MockRestError extends Error {
        status: number
        constructor(message: string, status: number) {
            super(message)
            this.name = "RestError"
            this.status = status
        }
    }
    return {
        RestError: MockRestError,
        /** Last `onSubmit` handed to the mocked edit form modal. */
        editSubmit: undefined as ((input: { title: string; description?: string }) => Promise<unknown>) | undefined,
    }
})

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, values?: Record<string, unknown>) =>
        values ? `${key}(${Object.values(values).join(",")})` : key,
}))

vi.mock("@phosphor-icons/react", () => ({
    CaretRightIcon: () => <span />,
    PencilSimpleIcon: () => <span />,
    PlusIcon: () => <span />,
    TrashIcon: () => <span />,
}))

vi.mock("@heroui/react", () => {
    const strip = (rest: Record<string, unknown>) => {
        const { variant, size, className, isIconOnly, isPending, isDisabled, color, type, weight, truncate, ...dom } =
            rest
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
    return {
        Button,
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

vi.mock("./CollectionFormModal", () => ({
    CollectionFormModal: ({
        mode,
        isOpen,
        onSubmit,
    }: {
        mode: string
        isOpen: boolean
        onSubmit: (input: { title: string; description?: string }) => Promise<unknown>
    }) => {
        if (mode === "edit" && isOpen) {
            h.editSubmit = onSubmit
        }
        return isOpen ? <div data-testid={`form-${mode}`} /> : null
    },
}))

vi.mock("./CollectionDetailModal", () => ({ CollectionDetailModal: () => null }))

vi.mock("@/hooks/useRequireAuth", () => ({
    useRequireAuth: () => ({
        authenticated: true,
        requireAuth: () => true,
        guard:
            <Args extends Array<unknown>>(action: (...args: Args) => void) =>
            (...args: Args) =>
                action(...args),
    }),
}))

const deleteCollection = vi.fn()
const updateCollection = vi.fn()
vi.mock("@/modules/api/rest/resource", () => ({
    deleteCollection: (...args: Array<unknown>) => deleteCollection(...args),
    updateCollection: (...args: Array<unknown>) => updateCollection(...args),
}))

/** Raw BE rows behind the collections SWR cache. */
let cache: Array<{ id: string; title: string; description?: string; itemCount: number }> = []
const mutate = vi.fn(async (updater?: unknown) => {
    if (typeof updater === "function") {
        cache = (updater as (current: unknown) => typeof cache)(cache)
    }
    return cache
})
const create = vi.fn()

vi.mock("../hooks/useQueryCollectionsSwr", () => ({
    resolveResourceErrorKey: () => "generic",
    useQueryCollectionsSwr: () => ({
        collections: cache.map((row) => ({
            id: row.id,
            title: row.title,
            description: row.description ?? "",
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

import { ResourceCollections } from "./index"

beforeEach(() => {
    cache = [
        { id: "col-1", title: "Ôn thi PE", description: "cũ", itemCount: 3 },
        { id: "col-2", title: "Thuật toán", itemCount: 1 },
    ]
    mutate.mockClear()
    deleteCollection.mockReset()
    updateCollection.mockReset()
    h.editSubmit = undefined
})

afterEach(cleanup)

describe("ResourceCollections — delete", () => {
    it("asks for confirmation first and writes nothing when cancelled", () => {
        render(<ResourceCollections />)

        fireEvent.click(screen.getAllByLabelText("collections.delete")[0])
        expect(deleteCollection).not.toHaveBeenCalled()

        fireEvent.click(screen.getByTestId("cancel"))
        expect(deleteCollection).not.toHaveBeenCalled()
        expect(cache).toHaveLength(2)
    })

    it("deletes the confirmed collection and drops its row through mutate", async () => {
        deleteCollection.mockResolvedValue(undefined)
        render(<ResourceCollections />)

        fireEvent.click(screen.getAllByLabelText("collections.delete")[1])
        fireEvent.click(screen.getByTestId("confirm"))

        await waitFor(() => expect(deleteCollection).toHaveBeenCalledWith("col-2"))
        expect(mutate).toHaveBeenCalled()
        expect(cache.map((row) => row.id)).toEqual(["col-1"])
    })

    it("puts the row back at its old index when the DELETE fails", async () => {
        deleteCollection.mockRejectedValue(new h.RestError("nope", 403))
        render(<ResourceCollections />)

        fireEvent.click(screen.getAllByLabelText("collections.delete")[0])
        fireEvent.click(screen.getByTestId("confirm"))

        await waitFor(() => expect(deleteCollection).toHaveBeenCalledWith("col-1"))
        expect(cache.map((row) => row.id)).toEqual(["col-1", "col-2"])
    })
})

describe("ResourceCollections — edit", () => {
    it("patches the collection and the cached row with the trimmed draft", async () => {
        updateCollection.mockResolvedValue({ id: "col-1" })
        render(<ResourceCollections />)

        fireEvent.click(screen.getAllByLabelText("collections.edit")[0])
        expect(screen.getByTestId("form-edit")).toBeTruthy()

        await h.editSubmit?.({ title: "  Ôn thi PE 2  ", description: "  mới  " })

        expect(updateCollection).toHaveBeenCalledWith("col-1", {
            title: "Ôn thi PE 2",
            description: "mới",
        })
        expect(cache[0]).toMatchObject({ title: "Ôn thi PE 2", description: "mới" })
    })

    it("restores the previous name when the PATCH fails", async () => {
        updateCollection.mockRejectedValue(new h.RestError("nope", 403))
        render(<ResourceCollections />)

        fireEvent.click(screen.getAllByLabelText("collections.edit")[0])
        await expect(h.editSubmit?.({ title: "Tên hỏng" })).rejects.toBeInstanceOf(h.RestError)

        expect(cache[0]).toMatchObject({ title: "Ôn thi PE", description: "cũ" })
    })
})
