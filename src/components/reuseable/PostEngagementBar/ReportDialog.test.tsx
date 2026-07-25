import React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * Component — {@link ReportDialog}: the report submit contract.
 *  - submitting sends the CHOSEN reason code plus the trimmed detail,
 *  - a blank detail is sent as `undefined` (never an empty string — the BE field
 *    is optional, not "empty text"),
 *  - a successful submit closes the dialog,
 *  - a rejected submit (duplicate report, rate limit, guest) keeps it open with
 *    the draft intact so the reporter can retry.
 *
 * HeroUI primitives are mocked to plain elements; the radio group becomes native
 * radios so a reason can be picked without React Aria.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@heroui/react", () => {
    const Modal = ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
        isOpen ? <div data-testid="modal">{children}</div> : null
    Modal.Backdrop = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Modal.Container = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Modal.Dialog = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Modal.Header = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Modal.Body = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Modal.Footer = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    return {
        Modal,
        Button: ({
            children,
            onPress,
            isDisabled,
        }: {
            children?: React.ReactNode
            onPress?: () => void
            isDisabled?: boolean
            isPending?: boolean
        }) => (
            <button type="button" disabled={isDisabled} onClick={onPress}>
                {children}
            </button>
        ),
        RadioGroup: ({
            value,
            onChange,
            children,
        }: {
            value: string
            onChange: (next: string) => void
            children: React.ReactNode
        }) => (
            <div
                data-testid="reasons"
                data-value={value}
                onChange={(event) =>
                    onChange((event.target as HTMLInputElement).value)
                }
            >
                {children}
            </div>
        ),
        Radio: ({ value, children }: { value: string; children: React.ReactNode }) => (
            <label>
                <input type="radio" name="reason" value={value} />
                {children}
            </label>
        ),
        TextField: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        TextArea: (props: React.ComponentProps<"textarea">) => <textarea {...props} />,
        Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    }
})

import { ReportDialog } from "./ReportDialog"

/** Fill the detail box and press the submit button. */
const submitWith = async (detail: string) => {
    fireEvent.change(screen.getByLabelText("engagement.reportDetailLabel"), {
        target: { value: detail },
    })
    await act(async () => {
        fireEvent.click(screen.getByText("engagement.reportSubmit"))
    })
}

describe("ReportDialog — submit", () => {
    it("sends the selected reason with the trimmed detail and closes on success", async () => {
        const onSubmit = vi.fn().mockResolvedValue(true)
        const onClose = vi.fn()
        render(<ReportDialog isOpen onClose={onClose} onSubmit={onSubmit} />)

        // pick a reason other than the default
        fireEvent.click(screen.getByDisplayValue("HARASSMENT"))
        await submitWith("  quấy rối trong bình luận  ")

        expect(onSubmit).toHaveBeenCalledWith("HARASSMENT", "quấy rối trong bình luận")
        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it("defaults to SPAM and omits an empty detail", async () => {
        const onSubmit = vi.fn().mockResolvedValue(true)
        render(<ReportDialog isOpen onClose={vi.fn()} onSubmit={onSubmit} />)

        await submitWith("   ")

        expect(onSubmit).toHaveBeenCalledWith("SPAM", undefined)
    })

    it("keeps the dialog open with the draft when the report is rejected", async () => {
        const onSubmit = vi.fn().mockResolvedValue(false)
        const onClose = vi.fn()
        render(<ReportDialog isOpen onClose={onClose} onSubmit={onSubmit} />)

        await submitWith("nội dung sai sự thật")

        expect(onSubmit).toHaveBeenCalledTimes(1)
        expect(onClose).not.toHaveBeenCalled()
        expect(
            (screen.getByLabelText("engagement.reportDetailLabel") as HTMLTextAreaElement).value,
        ).toBe("nội dung sai sự thật")
    })
})
