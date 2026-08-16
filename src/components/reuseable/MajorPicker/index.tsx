"use client"

import React from "react"
import {
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownPopover,
    DropdownTrigger,
    Typography,
    cn,
} from "@heroui/react"
import { CaretDownIcon, GraduationCapIcon } from "@phosphor-icons/react"
import type { Major } from "@/components/features/subject/hooks/useQueryMajorsSwr"

/** Menu key for the "no major" entry — kept distinct from any real major code. */
const NONE_KEY = "__none"

/** Props for {@link MajorPicker}. */
export interface MajorPickerProps {
    /** Selectable majors (from `useQueryMajorsSwr`) — options show each `name`. */
    majors: Array<Major>
    /** Selected major CODE, or `null` for "not chosen". */
    value: string | null
    /** Fires with the picked major code (`null` when the "no major" entry is picked). */
    onChange: (code: string | null) => void
    /** Label of the placeholder / "no major" entry (also shown on the trigger when unset). */
    placeholder: string
    /** Accessible name for the menu (the trigger is icon + text, so a11y needs this). */
    ariaLabel: string
    /** Disables the trigger. */
    isDisabled?: boolean
    /**
     * Câu giải thích in ra khi danh mục ngành RỖNG (trigger tự khoá).
     *
     * VÌ SAO cần: rỗng là trạng thái HỢP LỆ (`useQueryMajorsSwr` — BE chưa deploy endpoint
     * `/api/v1/majors` thì trả 404, hoặc danh mục chưa ai nhập), không phải chuyện hiếm. Không có
     * câu này thì người dùng — thường là người vừa bấm lời mời "Chọn ngành" từ biểu đồ EXP — gặp
     * một ô xám bấm không được, dưới nó là dòng hint "Ngành quyết định bộ kỹ năng…" như thể mọi thứ
     * bình thường. Chính lane này đã ghi "lời mời trỏ tới form không đặt được field còn tệ hơn
     * không mời"; ô khoá câm là đúng cảnh đó ở một điều kiện khác.
     */
    emptyHint?: string
    /** Extra classes on the trigger. */
    className?: string
}

/**
 * Single-select major dropdown — the sibling of `CampusPicker`, same HeroUI `Dropdown`
 * pattern (the repo carries no HeroUI `Select`). Options render each major's localised
 * `name` but the selected VALUE is the `code`, which is what the BE stores in
 * `profile.profiles.major_code`.
 *
 * The trigger disables itself on an EMPTY catalogue: `useQueryMajorsSwr` documents that
 * an empty list is a legitimate state (backend without the majors endpoint, or a
 * catalogue nobody has filled in), and a dropdown that opens onto nothing reads as
 * broken. Khoá thì phải NÓI VÌ SAO — truyền {@link MajorPickerProps.emptyHint} để câu giải thích
 * hiện ngay dưới ô; ô xám câm là chỗ người dùng đứng lại và không biết làm gì tiếp.
 */
export const MajorPicker = ({
    majors,
    value,
    onChange,
    placeholder,
    ariaLabel,
    isDisabled,
    emptyHint,
    className,
}: MajorPickerProps) => {
    const activeLabel = majors.find((major) => major.code === value)?.name ?? placeholder
    const isEmpty = majors.length === 0

    const dropdown = (
        <Dropdown>
            <DropdownTrigger
                isDisabled={isDisabled || isEmpty}
                className={cn(
                    "cursor-pointer rounded-2xl border border-default px-3 py-2",
                    className,
                )}
            >
                <div className="flex items-center gap-2">
                    <GraduationCapIcon aria-hidden focusable="false" className="size-4 text-accent" />
                    <span className="max-w-56 truncate text-sm font-medium">{activeLabel}</span>
                    <CaretDownIcon aria-hidden focusable="false" className="size-4" />
                </div>
            </DropdownTrigger>
            <DropdownPopover className="min-w-56">
                <DropdownMenu
                    aria-label={ariaLabel}
                    onAction={(key) => onChange(key === NONE_KEY ? null : String(key))}
                >
                    <DropdownItem key={NONE_KEY} id={NONE_KEY} textValue={placeholder}>
                        {placeholder}
                    </DropdownItem>
                    {majors.map((major) => (
                        <DropdownItem key={major.code} id={major.code} textValue={major.name}>
                            {major.name}
                        </DropdownItem>
                    ))}
                </DropdownMenu>
            </DropdownPopover>
        </Dropdown>
    )

    // Không có gì để giải thích ⇒ trả đúng cây DOM cũ: hai nơi dùng khác (bộ lọc workplace, linh
    // vật onboarding) đang canh layout theo nó, thêm wrapper vô cớ là đổi layout của chúng.
    if (!isEmpty || !emptyHint) {
        return dropdown
    }

    return (
        <div className="flex flex-col gap-1">
            {dropdown}
            {/* `role="note"` để trình đọc màn hình thấy được lý do ô bị khoá — người dùng bàn phím
                chỉ nghe "disabled" thì vẫn không biết vì sao. */}
            <Typography type="body-xs" color="muted" role="note">
                {emptyHint}
            </Typography>
        </div>
    )
}
