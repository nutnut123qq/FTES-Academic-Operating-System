"use client"

import { EyeIcon } from "@phosphor-icons/react"
import React from "react"
import { Tooltip, cn } from "@heroui/react"
import { ReactionBar } from "./ReactionBar"
import { ReactionType, type ReactionSummary } from "@/modules/api/graphql/queries/types/discussion"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link InteractionBar}. */
export interface InteractionBarProps extends WithClassNames<undefined> {
    /** Aggregate reaction summary for the content. */
    summary: ReactionSummary | undefined
    /** React to / un-react from the content (null removes the reaction). */
    onReact: (type: ReactionType | null) => void
    /** Optional view count from the server (undefined = not tracked yet). */
    viewCount?: number
    /** Disables the reaction control (e.g. PREVIEW access or a mutation in flight). */
    disabled?: boolean
    /** When set, shows this text in a tooltip on the disabled reaction control. */
    disabledReason?: string
    /**
     * Hiện cụm thả cảm xúc hay không. Mặc định `true`.
     *
     * Tách ra vì hai nửa của thanh này phục vụ hai việc khác nhau: bên trái là HÀNH ĐỘNG
     * (thả cảm xúc), bên phải là SỐ LIỆU (lượt xem). Bài tài liệu bỏ phần hành động nhưng
     * vẫn phải đếm lượt xem, nên gỡ cả thanh là gỡ nhầm nửa còn lại.
     */
    showReactions?: boolean
}

/**
 * Single-row content interaction: the shared {@link ReactionBar} (HeroUI Button trigger +
 * emoji picker + summary) on the left — IDENTICAL to each comment's reaction — and the
 * view count on the right. Save / share / fullscreen are intentionally NOT here — they own
 * a single home in the OnThisPage rail.
 *
 * When `disabled` is set the reaction control cannot be operated; pairing it with
 * `disabledReason` wraps the control in a tooltip (e.g. inviting a PREVIEW viewer to enroll).
 */
export const InteractionBar = ({
    summary,
    onReact,
    viewCount,
    disabled = false,
    disabledReason,
    showReactions = true,
    className,
}: InteractionBarProps) => {
    const reactions = <ReactionBar summary={summary} onReact={onReact} disabled={disabled} />

    return (
        // `justify-between` đẩy hai nửa ra hai mép. Khi ẩn cụm cảm xúc thì chỉ còn lượt xem,
        // `justify-end` giữ nó ở mép phải thay vì nhảy sang trái — cùng chỗ với lúc có đủ hai nửa.
        <div className={cn("flex items-center gap-3", showReactions ? "justify-between" : "justify-end", className)}>
            {/* reaction trigger + summary — same control as the comment reactions */}
            {!showReactions ? null : disabled && disabledReason ? (
                <Tooltip>
                    <Tooltip.Trigger>
                        {/* span keeps the tooltip target hoverable while the button is disabled */}
                        <span className="inline-flex">{reactions}</span>
                    </Tooltip.Trigger>
                    <Tooltip.Content>{disabledReason}</Tooltip.Content>
                </Tooltip>
            ) : (
                reactions
            )}

            {/* view count */}
            {viewCount !== undefined ? (
                <span className="flex items-center gap-2 text-xs text-muted">
                    <EyeIcon aria-hidden focusable="false" className="size-4" />
                    {viewCount.toLocaleString()}
                </span>
            ) : null}
        </div>
    )
}
