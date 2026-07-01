"use client"

import React from "react"
import { ContentBodyV2 } from "./ContentBodyV2"
import type { WithClassNames } from "@/modules/types/base/class-name"

export type ContentBodyProps = WithClassNames<undefined>

/**
 * Lesson content body. Legacy (V1) content has been retired — every lesson now
 * ships per-language `bodies`, so this renders the V2 body unconditionally.
 *
 * @param props.className - Optional wrapper class forwarded to the body.
 */
export const ContentBody = ({ className }: ContentBodyProps) => {
    return <ContentBodyV2 className={className} />
}
