import React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * KHẢO SÁT chọn ngành — ba thứ dễ hỏng im lặng, mỗi thứ một ca.
 *
 * 1. Bước 2: nút Lưu KHÔNG được bấm khi chưa chọn gì. Trước đây nó bấm được và
 *    `child ?? category` âm thầm ghi mã KHỐI vào hồ sơ, trong khi người dùng đinh ninh
 *    ngành đã chọn ở bước 1 — hồ sơ lưu "IT" chứ không phải "SE" mà không một dấu hiệu nào
 *    trên màn nói "chưa chọn gì".
 * 2. Đóng modal (Esc / bấm nền) trong lúc PATCH đang bay = mất luôn bước onboarding: nó
 *    đánh dấu "Để sau" VĨNH VIỄN trên thiết bị, và lỗi BE thì không hiện ở đâu cả.
 * 3. Hàng nút phải nằm ở khe `actions` của `MascotBubble`, NGOÀI vùng `aria-live` — trong
 *    vùng đó thì mỗi lần đổi bước, trình đọc màn hình đọc lại tên MỌI ngành.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, values?: Record<string, unknown>) =>
        values
            ? `${key}(${Object.entries(values).map(([n, v]) => `${n}=${v}`).join(",")})`
            : key,
}))

let lastOnOpenChange: ((open: boolean) => void) | null = null
vi.mock("@heroui/react", () => {
    const Pass = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    const Modal = Object.assign(
        ({
            children,
            onOpenChange,
        }: {
            children?: React.ReactNode
            onOpenChange?: (open: boolean) => void
        }) => {
            lastOnOpenChange = onOpenChange ?? null
            return <div>{children}</div>
        },
        {
            Backdrop: ({
                children,
                isDismissable,
                isKeyboardDismissDisabled,
            }: {
                children?: React.ReactNode
                isDismissable?: boolean
                isKeyboardDismissDisabled?: boolean
            }) => (
                <div
                    data-testid="backdrop"
                    data-dismissable={String(isDismissable)}
                    data-kbd-disabled={String(isKeyboardDismissDisabled)}
                >
                    {children}
                </div>
            ),
            Container: Pass,
            Dialog: Pass,
            Body: Pass,
            Footer: Pass,
        },
    )
    return {
        Modal,
        Button: ({
            children,
            onPress,
            isDisabled,
            variant,
        }: {
            children?: React.ReactNode
            onPress?: () => void
            isDisabled?: boolean
            variant?: string
        }) => (
            <button
                type="button"
                disabled={isDisabled}
                data-variant={variant}
                onClick={() => {
                    if (!isDisabled) onPress?.()
                }}
            >
                {children}
            </button>
        ),
    }
})

// Bong bóng linh vật tách ĐÔI có chủ đích: `title`+`children` nằm trong vùng `aria-live`,
// `actions` là div anh em NGOÀI vùng đó. Mock giữ đúng sự tách đó để ca 3 kiểm được.
vi.mock("@/components/reuseable/FtesMascot", () => ({
    MascotBubble: ({
        title,
        children,
        actions,
    }: {
        title?: React.ReactNode
        children?: React.ReactNode
        actions?: React.ReactNode
    }) => (
        <div>
            <div data-testid="bubble-live" aria-live="polite">
                {title}
                {children}
            </div>
            <div data-testid="bubble-actions">{actions}</div>
        </div>
    ),
}))

vi.mock("@/redux/hooks", () => ({
    useAppSelector: (select: (state: unknown) => unknown) =>
        select({ keycloak: { authenticated: true } }),
}))

vi.mock("@/components/features/onboarding", () => ({ useTour: () => ({ isActive: false }) }))

const setMajor = vi.fn<(code: string) => Promise<void>>()
vi.mock("@/components/features/profile/hooks/useMyMajor", () => ({
    useMyMajor: () => ({ needsMajor: true, setMajor }),
}))

// Một khối CÓ hai chuyên ngành con + một khối ngõ cụt (không con).
vi.mock("@/components/features/subject/hooks/useQueryMajorsSwr", () => ({
    useQueryMajorsSwr: () => ({
        majors: [
            { code: "IT", name: "Information Technology", description: null, parentCode: null },
            { code: "SE", name: "Software Engineering", description: null, parentCode: "IT" },
            { code: "DM", name: "Digital Marketing", description: null, parentCode: "IT" },
            { code: "LAW", name: "Law", description: null, parentCode: null },
        ],
    }),
}))

const markNudgeDismissed = vi.fn()
vi.mock("./persistence", () => ({
    isNudgeDismissed: () => false,
    markNudgeDismissed: (...args: Array<unknown>) => markNudgeDismissed(...args),
}))

const { MascotMajorPicker } = await import("./MascotMajorPicker")

/** Mở modal và đi tới bước 2 của khối `code`. */
const openStepTwo = (label: string) => {
    render(<MascotMajorPicker />)
    fireEvent.click(screen.getByText(label))
}

const saveButton = () => screen.getByText("save").closest("button") as HTMLButtonElement

beforeEach(() => {
    setMajor.mockReset()
    setMajor.mockResolvedValue(undefined)
    markNudgeDismissed.mockClear()
    lastOnOpenChange = null
})

describe("MascotMajorPicker — bước 2 không được ghi mã KHỐI sau lưng người dùng", () => {
    it("khoá nút Lưu khi khối có chuyên ngành con mà chưa bấm con nào", () => {
        openStepTwo("Information Technology")

        expect(saveButton().disabled).toBe(true)
        fireEvent.click(saveButton())
        expect(setMajor).not.toHaveBeenCalled()
    })

    it("ghi mã KHỐI chỉ khi người dùng bấm đúng nút \"Tất cả {khối}\"", async () => {
        openStepTwo("Information Technology")

        const allButton = screen
            .getByText("allInMajor(major=Information Technology)")
            .closest("button") as HTMLButtonElement
        // Chưa bấm ⇒ không nút nào ở trạng thái "đang chọn".
        expect(allButton.getAttribute("data-variant")).toBe("secondary")

        fireEvent.click(allButton)
        expect(allButton.getAttribute("data-variant")).toBe("primary")
        expect(saveButton().disabled).toBe(false)

        await act(async () => {
            fireEvent.click(saveButton())
        })
        expect(setMajor).toHaveBeenCalledWith("IT")
    })

    it("ghi mã CHUYÊN NGÀNH khi người dùng bấm một con", async () => {
        openStepTwo("Information Technology")

        fireEvent.click(screen.getByText("Software Engineering"))
        await act(async () => {
            fireEvent.click(saveButton())
        })
        expect(setMajor).toHaveBeenCalledWith("SE")
    })

    it("khối NGÕ CỤT (không chuyên ngành con) vẫn lưu thẳng mã khối", async () => {
        openStepTwo("Law")

        expect(saveButton().disabled).toBe(false)
        await act(async () => {
            fireEvent.click(saveButton())
        })
        expect(setMajor).toHaveBeenCalledWith("LAW")
    })
})

describe("MascotMajorPicker — không được đóng giữa lúc đang ghi", () => {
    it("chặn cả bấm-ra-nền lẫn Esc trong lúc PATCH đang bay", async () => {
        let release: () => void = () => undefined
        setMajor.mockImplementation(
            () => new Promise<void>((resolve) => {
                release = resolve
            }),
        )

        openStepTwo("Law")
        expect(screen.getByTestId("backdrop").getAttribute("data-dismissable")).toBe("true")

        await act(async () => {
            fireEvent.click(saveButton())
        })

        // Đang ghi: hai cửa đóng đều khoá…
        expect(screen.getByTestId("backdrop").getAttribute("data-dismissable")).toBe("false")
        expect(screen.getByTestId("backdrop").getAttribute("data-kbd-disabled")).toBe("true")
        // …và chốt cuối trong `onOpenChange` cũng không cho đánh dấu "Để sau".
        act(() => {
            lastOnOpenChange?.(false)
        })
        expect(markNudgeDismissed).not.toHaveBeenCalled()

        await act(async () => {
            release()
        })
    })
})

describe("MascotMajorPicker — hàng nút ở NGOÀI vùng aria-live", () => {
    it("đặt mọi nút ngành vào khe `actions`, không vào phần copy được đọc lại", () => {
        render(<MascotMajorPicker />)

        const live = screen.getByTestId("bubble-live")
        const actions = screen.getByTestId("bubble-actions")
        // Vùng live chỉ còn tiêu đề + một câu của bước.
        expect(live.textContent).toBe("titlebody")
        expect(live.querySelector("button")).toBeNull()
        expect(actions.textContent).toContain("Information Technology")
        expect(actions.textContent).toContain("Law")
    })
})
