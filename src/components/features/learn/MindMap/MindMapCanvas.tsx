"use client"

import React, { useCallback, useEffect, useState } from "react"
import {
    Background,
    BackgroundVariant,
    Controls,
    type NodeMouseHandler,
    type NodeTypes,
    Panel,
    ReactFlow,
    ReactFlowProvider,
    useEdgesState,
    useNodesState,
    useReactFlow,
} from "@xyflow/react"
import { Button, Typography, cn } from "@heroui/react"
import { ArrowRightIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { MindMapGraph, MindMapNodeData } from "./build"
import { ROOT_NODE_TYPE, CONTENT_NODE_TYPE } from "./build"
import { MindMapRootNode } from "./RootNode"
import { MindMapContentNode } from "./ContentNode"
import { STATUS_SWATCH } from "./status"
import { useMindMapFitView } from "./useMindMapFitView"

/** Props for {@link MindMapCanvas}. */
export interface MindMapCanvasProps {
    /** Nodes + edges to render. */
    graph: MindMapGraph
    /** The module that owns the viewer's resume pointer (camera lands here). */
    currentModuleId: string | null
    /** Click handler for a content node (routing / package gate lives in the parent). */
    onOpenNode: (data: MindMapNodeData) => void
    /** Resume target for the floating "Continue" action, or null when none. */
    continueHref: string | null
    /** Whether the viewer has completed the whole course (shows the "all done" note). */
    allDone: boolean
    /** Fires the resume navigation. */
    onContinue: () => void
}

const NODE_TYPES: NodeTypes = {
    [ROOT_NODE_TYPE]: MindMapRootNode,
    [CONTENT_NODE_TYPE]: MindMapContentNode,
}

/** The status legend + "you are here" + premium gate swatches. */
const MindMapLegend = () => {
    const t = useTranslations("learn")
    return (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-separator bg-surface/90 px-3 py-2 shadow-sm backdrop-blur">
            {(["completed", "inProgress", "notStarted"] as const).map((state) => (
                <span key={state} className="flex items-center gap-1.5">
                    <span className={cn("size-3 rounded-full", STATUS_SWATCH[state])} />
                    <Typography type="body-xs" color="muted">
                        {t(
                            state === "completed"
                                ? "mindMap.legend.done"
                                : state === "inProgress"
                                    ? "mindMap.legend.inProgress"
                                    : "mindMap.legend.notStarted",
                        )}
                    </Typography>
                </span>
            ))}
            <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-accent" />
                <Typography type="body-xs" color="muted">
                    {t("mindMap.legend.current")}
                </Typography>
            </span>
        </div>
    )
}

/** Inner canvas — requires a {@link ReactFlowProvider} ancestor. */
const MindMapCanvasInner = ({
    graph,
    currentModuleId,
    onOpenNode,
    continueHref,
    allDone,
    onContinue,
}: MindMapCanvasProps) => {
    const t = useTranslations("learn")
    const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges)
    const { fitView } = useReactFlow()

    // Re-sync when the underlying course data changes (progress refetch, gate purchase).
    useEffect(() => {
        setNodes(graph.nodes)
        setEdges(graph.edges)
    }, [graph, setNodes, setEdges])

    const onNodeClick = useCallback<NodeMouseHandler>(
        (_event, node) => {
            const data = node.data as MindMapNodeData
            // clicking the subject-code root pulls the camera back to the whole tree
            if (data.kind === "root") {
                void fitView({ padding: 0.2, duration: 500 })
                return
            }
            onOpenNode(data)
        },
        [fitView, onOpenNode],
    )

    useMindMapFitView(currentModuleId, graph.nodes.length)

    return (
        <ReactFlow
            aria-label={t("mindMap.canvasAria")}
            className="text-foreground"
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={2}
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable
            proOptions={{ hideAttribution: true }}
            zoomOnDoubleClick={false}
        >
            <Background gap={20} variant={BackgroundVariant.Dots} color="var(--border)" />
            <Controls showInteractive={false} position="bottom-right" />
            {continueHref ? (
                <Panel className="!m-4" position="top-center">
                    <Button
                        variant="primary"
                        onPress={onContinue}
                        className="rounded-full shadow-lg"
                    >
                        {t("mindMap.continue")}
                        <ArrowRightIcon aria-hidden focusable="false" className="size-5" />
                    </Button>
                </Panel>
            ) : allDone ? (
                <Panel className="!m-4 rounded-full bg-surface px-4 py-2 shadow-lg" position="top-center">
                    <Typography type="body-sm" weight="semibold" className="text-success">
                        {t("mindMap.allDone")}
                    </Typography>
                </Panel>
            ) : null}
            <Panel className="!m-4" position="bottom-left">
                <MindMapLegend />
            </Panel>
        </ReactFlow>
    )
}

/**
 * Draggable / pannable / zoomable React-Flow mind-map canvas (ported from StarCI's
 * `Canvas`, wired to FTES's own SWR learn data). SSR-safe — mounts only after
 * hydration, since React Flow measures the DOM. The parent owns the fixed height.
 */
export const MindMapCanvas = (props: MindMapCanvasProps) => {
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    if (!mounted) {
        return null
    }

    return (
        <ReactFlowProvider>
            <div className="h-full w-full overflow-hidden rounded-3xl border border-separator bg-surface/40">
                <MindMapCanvasInner {...props} />
            </div>
        </ReactFlowProvider>
    )
}
