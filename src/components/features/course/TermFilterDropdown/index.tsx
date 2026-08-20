"use client"

import React from "react"
import type { Selection } from "@heroui/react"
import { Dropdown, Label, cn } from "@heroui/react"
import { CalendarBlankIcon, CaretDownIcon } from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Khoá nội bộ của mục "tất cả". Ra ngoài nó là `undefined` (KHÔNG phải chuỗi rỗng):
 * "không lọc" và `?termId=` rỗng phải đổ về cùng một lần gọi, cùng một cache key.
 */
const ALL_TERMS = "__all_terms__"

/** Một lựa chọn kỳ trong {@link TermFilterDropdown}. */
export interface TermFilterOption {
    /** Khoá duy nhất — id kỳ thật, hoặc khoá nội bộ của nhóm "ngoài kỳ học". */
    id: string
    /** Nhãn hiển thị. KHÔNG bao giờ là chuỗi rỗng — caller lo phần fallback. */
    label: string
    /** Chú thích mờ đứng cạnh nhãn (mã kỳ, số khoá…). */
    hint?: string
}

/** Props cho {@link TermFilterDropdown}. */
export interface TermFilterDropdownProps extends WithClassNames<undefined> {
    /** Các kỳ chọn được, theo đúng thứ tự hiển thị. Mục "tất cả" tự thêm ở đầu. */
    options: Array<TermFilterOption>
    /** Kỳ đang chọn; `undefined` = mục "tất cả" (mặc định). */
    value?: string
    onChange: (value: string | undefined) => void
    /** Tên bộ lọc — dùng cho `aria-label` của nút và của menu. */
    label: string
    /** Nhãn mục "tất cả", luôn đứng đầu danh sách. */
    allLabel: string
}

/**
 * Ô chọn kỳ học dùng chung cho catalog `/courses` (lọc server-side) và
 * `/courses/me` (lọc client-side).
 *
 * Là `Dropdown` chọn-một (`selectionMode="single"` + `Dropdown.ItemIndicator`, nên
 * mỗi dòng là `menuitemradio` thật, có `aria-checked`) chứ KHÔNG phải
 * `SegmentedControl` như facet cấp độ / số sao: một trường tích luỹ vài chục kỳ,
 * còn segmented control là để chọn "một trong vài".
 *
 * @param props - {@link TermFilterDropdownProps}
 */
export const TermFilterDropdown = ({
    options,
    value,
    onChange,
    label,
    allLabel,
    className,
}: TermFilterDropdownProps) => {
    const selected = options.find((option) => option.id === value)
    // kỳ đang chọn mà không còn trong danh sách thì in khoá thô, còn hơn hiện "tất cả"
    // trong khi danh sách vẫn đang bị lọc
    const triggerLabel = value === undefined ? allLabel : selected?.label ?? value

    const onSelectionChange = (keys: Selection) => {
        const next = String([...keys][0])
        onChange(next === ALL_TERMS ? undefined : next)
    }

    return (
        <Dropdown>
            <Dropdown.Trigger
                /* tên khả truy cập phải CHỨA chữ đang hiện trên nút (WCAG 2.5.3) */
                aria-label={`${label}: ${triggerLabel}`}
                className={cn(
                    "shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors",
                    value === undefined
                        ? "border-separator text-foreground hover:border-accent"
                        : "border-accent bg-accent/10 font-medium text-accent",
                    className,
                )}
            >
                <div className="flex items-center gap-1.5">
                    <CalendarBlankIcon aria-hidden focusable="false" className="size-4" />
                    <span className="max-w-44 truncate">{triggerLabel}</span>
                    <CaretDownIcon aria-hidden focusable="false" className="size-3.5" />
                </div>
            </Dropdown.Trigger>
            <Dropdown.Popover className="min-w-60">
                <Dropdown.Menu
                    aria-label={label}
                    selectionMode="single"
                    disallowEmptySelection
                    selectedKeys={new Set([value ?? ALL_TERMS])}
                    onSelectionChange={onSelectionChange}
                >
                    <Dropdown.Section>
                        <Dropdown.Item id={ALL_TERMS} textValue={allLabel}>
                            <Dropdown.ItemIndicator />
                            <Label>{allLabel}</Label>
                        </Dropdown.Item>
                        {options.map((option) => (
                            <Dropdown.Item key={option.id} id={option.id} textValue={option.label}>
                                <Dropdown.ItemIndicator />
                                <Label>
                                    {option.label}
                                    {option.hint ? (
                                        <span className="ml-1.5 text-xs text-muted">{option.hint}</span>
                                    ) : null}
                                </Label>
                            </Dropdown.Item>
                        ))}
                    </Dropdown.Section>
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown>
    )
}
