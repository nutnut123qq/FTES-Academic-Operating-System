"use client"

import React from "react"
import { cn } from "@heroui/react"
import type { ReactNode } from "react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Who authored a chat message. */
export type ChatRole = "user" | "assistant"

/** Props for the {@link ChatBubble} block. */
export interface ChatBubbleProps extends WithClassNames<undefined> {
    /** Author of the message — drives alignment + tint. */
    role: ChatRole
    /** Message content (text or a markdown render). */
    children: ReactNode
}

/**
 * A single chat message bubble: user messages align right with an accent tint,
 * assistant messages align left on the surface tint. Pure + props-only; owns its
 * look so chat features only compose it.
 *
 * @param props - {@link ChatBubbleProps}
 */
export const ChatBubble = ({ role, children, className }: ChatBubbleProps) => {
    const isUser = role === "user"
    return (
        <div className={cn("flex", isUser ? "justify-end" : "justify-start", className)}>
            <div
                className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2",
                    isUser ? "bg-accent/10" : "bg-surface-secondary",
                )}
            >
                {children}
            </div>
        </div>
    )
}
