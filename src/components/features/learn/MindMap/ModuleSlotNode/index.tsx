"use client"

import React, { useCallback } from "react"
import { Handle, type Node, type NodeProps, Position } from "@xyflow/react"
import { cn } from "@heroui/react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { CheckCircleIcon } from "@phosphor-icons/react"

import { COURSE_MODULE_SLOT_NODE_TYPE, SLOT_NODE_HEIGHT, SLOT_NODE_WIDTH } from "../moduleExpansion"
import { pathConfig } from "@/resources/path"
import { useAppSelector } from "@/redux/hooks"
import { useAuthenticationOverlayState } from "@/hooks/zustand/overlay/hooks"

export type CourseModuleSlotNodeData = {
    /** Parent `courseModule` node id this lesson belongs to. */
    parentModuleId: string
    /** Course mount slug — needed to build the lesson URL. */
    courseDisplayId: string
    /** Owning module id — part of the lesson URL. */
    moduleId: string
    /** Lesson (content) id this card opens. */
    contentId: string
    /** Lesson title shown on the card. */
    label: string
    /** True when the parent module sits in the left column (handle faces right, toward the module). */
    isLeft: boolean
    /** Whether the viewer has read this lesson. */
    isRead: boolean
}

export type CourseModuleSlotFlowNode = Node<CourseModuleSlotNodeData, typeof COURSE_MODULE_SLOT_NODE_TYPE>

/**
 * Real lesson card expanded beside a course module. Clicking navigates straight into
 * the lesson reader (the map is a content surface — no intermediate preview drawer).
 * Guests are bounced to the authentication modal first. A read flag marks finished lessons.
 * @param props — React Flow `NodeProps` for `courseModuleContent` nodes.
 */
export const CourseModuleSlotNode = (props: NodeProps<CourseModuleSlotFlowNode>) => {
    const { data, selected } = props
    const router = useRouter()
    const locale = useLocale()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const authentication = useAuthenticationOverlayState()

    const onOpen = useCallback(() => {
        // gate: guests cannot open the lesson — bounce them to the auth modal
        if (!authenticated) {
            authentication.open()
            return
        }
        if (!data.courseDisplayId) {
            return
        }
        router.push(
            pathConfig()
                .locale(locale)
                .course(data.courseDisplayId)
                .learn()
                .module(data.moduleId)
                .content(data.contentId)
                .build(),
        )
    }, [
        authenticated,
        authentication,
        router,
        locale,
        data.courseDisplayId,
        data.moduleId,
        data.contentId,
    ])

    return (
        <button
            type="button"
            onClick={(event) => {
                // keep the click on the card → open lesson; don't let the canvas zoom-handler also fire
                event.stopPropagation()
                onOpen()
            }}
            className={cn(
                "nodrag nopan relative flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-center",
                "border bg-background/90 text-sm font-medium text-foreground shadow-sm outline-none",
                "transition-all duration-200 hover:border-accent hover:bg-accent/5 hover:shadow-md hover:ring-2 hover:ring-accent/30",
                "focus-visible:ring-2 focus-visible:ring-accent/40",
                "dark:border-zinc-600/80 dark:bg-zinc-900/90 dark:hover:bg-accent/10 dark:hover:ring-accent/40",
                selected && "ring-2 ring-accent/25 dark:ring-accent/35",
            )}
            style={{ width: SLOT_NODE_WIDTH, minHeight: SLOT_NODE_HEIGHT }}
        >
            <Handle
                isConnectable={false}
                className="!h-px !w-px !min-h-0 !min-w-0 !border-0 !bg-transparent !opacity-0"
                position={data.isLeft ? Position.Right : Position.Left}
                type="target"
            />
            {data.isRead ? (
                <CheckCircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-success" />
            ) : null}
            <span className="line-clamp-2 leading-snug">{data.label}</span>
        </button>
    )
}
