import React from "react"
import type { ReactNode } from "react"
import { Typography, cn } from "@heroui/react"

import type { WithClassNames } from "@/modules/types/base/class-name"
import { ProgressMeter } from "../ProgressMeter"
import { StatusChip } from "../../chips/StatusChip"
import type { StatusChipTone } from "../../chips/StatusChip"

/** Props for the {@link SkillProgressRow} block. */
export interface SkillProgressRowProps extends WithClassNames<undefined> {
    /** Tên kỹ năng (dòng 1, cắt bằng ellipsis khi dài). */
    name: ReactNode
    /** Icon trạng thái đứng trước tên (Phosphor `*Icon`); tự chừa chỗ khi vắng. */
    icon?: ReactNode
    /** Nhãn trạng thái đã dịch, hiện trong {@link StatusChip}. */
    statusLabel: ReactNode
    /** Tone của chip trạng thái. */
    statusTone?: StatusChipTone
    /**
     * Nhãn bậc ("Lv 3/5") — chip phụ chỉ hiện từ `sm` lên để không chen chỗ trên điện
     * thoại. Bỏ qua cho kỹ năng chưa mở.
     */
    levelLabel?: ReactNode
    /** Nhãn "đủ điều kiện lên bậc" — chip nhấn, hiện ở mọi khổ màn hình. */
    eligibleLabel?: ReactNode
    /**
     * Nhãn của THANH tiến độ — luôn nói rõ thanh đang đo gì ("Mức thành thạo" vs "Khoá C
     * Basic"), vì cùng một thanh mang hai nghĩa khác nhau tuỳ trạng thái.
     */
    progressLabel: ReactNode
    /** Giá trị thanh tiến độ, 0–100. */
    progressValue: number
    /** Dòng quy trách nhiệm mở khoá (đã dịch, có thể chứa link khoá học). */
    unlock?: ReactNode
    /** Mệnh đề tiên quyết còn thiếu, hiện dưới dòng mở khoá. */
    prerequisite?: ReactNode
    /** Hành động phụ bên phải dòng cuối (thường là nút "Học tiếp"). */
    action?: ReactNode
}

/**
 * Một hàng kỹ năng trong bảng kỹ năng theo nhóm nghề: ba dòng trả lời đúng ba câu hỏi
 * — kỹ năng gì, tôi đang ở đâu, học khoá nào để mở.
 *
 * 1. icon trạng thái + tên + chip bậc/chip trạng thái,
 * 2. {@link ProgressMeter} kèm nhãn nói rõ thanh đang đo gì,
 * 3. dòng mở khoá (+ tiên quyết) và hành động phụ.
 *
 * Props-only: khối này KHÔNG gọi `useTranslations` và không tự quyết màu theo nhóm nghề
 * — mọi chữ đã dịch do feature truyền vào, màu chỉ đi theo tone trạng thái. Hàng cao tối
 * thiểu 56px để vùng chạm đạt chuẩn trên điện thoại.
 *
 * @param props - {@link SkillProgressRowProps}
 */
export const SkillProgressRow = ({
    name,
    icon,
    statusLabel,
    statusTone = "neutral",
    levelLabel,
    eligibleLabel,
    progressLabel,
    progressValue,
    unlock,
    prerequisite,
    action,
    className,
}: SkillProgressRowProps) => {
    return (
        <div className={cn("flex min-h-14 flex-col gap-2 px-4 py-3", className)}>
            <div className="flex min-w-0 items-center gap-2">
                <span className="flex size-4 shrink-0 items-center justify-center">{icon}</span>
                <Typography type="body-sm" weight="medium" className="min-w-0 flex-1" truncate>
                    {name}
                </Typography>
                {/* chip bậc là thông tin phụ → nhường chỗ cho tên trên màn hẹp */}
                {levelLabel ? (
                    <StatusChip tone="neutral" className="hidden shrink-0 sm:inline-flex">
                        {levelLabel}
                    </StatusChip>
                ) : null}
                {eligibleLabel ? (
                    <StatusChip tone="accent" className="shrink-0">
                        {eligibleLabel}
                    </StatusChip>
                ) : null}
                <StatusChip tone={statusTone} className="shrink-0">
                    {statusLabel}
                </StatusChip>
            </div>

            <ProgressMeter value={progressValue} label={progressLabel} showValue />

            {unlock || prerequisite || action ? (
                <div className="flex min-w-0 items-end justify-between gap-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-0">
                        {unlock ? (
                            <Typography type="body-xs" color="muted" className="line-clamp-2">
                                {unlock}
                            </Typography>
                        ) : null}
                        {prerequisite ? (
                            <Typography type="body-xs" color="muted" className="line-clamp-1">
                                {prerequisite}
                            </Typography>
                        ) : null}
                    </div>
                    {action ? <span className="shrink-0">{action}</span> : null}
                </div>
            ) : null}
        </div>
    )
}
