"use client"

import React, { memo } from "react"
import { Handle, Position } from "@xyflow/react"

/** Data for the center (user) node. */
export interface CenterNodeData extends Record<string, unknown> {
    label: string
}

/**
 * The fixed center "you" node of the spider web — the hub every domain sector
 * radiates from. Non-interactive, accent-filled.
 */
const CenterNodeCardBase = ({ data }: { data: CenterNodeData }) => (
    <div className="flex size-20 items-center justify-center rounded-full bg-accent text-center text-xs font-bold text-accent-foreground shadow-sm">
        <Handle type="source" position={Position.Bottom} className="!opacity-0" isConnectable={false} />
        <Handle type="target" position={Position.Top} className="!opacity-0" isConnectable={false} />
        {data.label}
    </div>
)

export const CenterNodeCard = memo(CenterNodeCardBase)
