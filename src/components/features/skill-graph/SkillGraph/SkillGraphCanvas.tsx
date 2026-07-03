"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import {
    Background,
    Controls,
    MarkerType,
    ReactFlow,
    ReactFlowProvider,
} from "@xyflow/react"
import type { Edge, Node, NodeMouseHandler, NodeTypes } from "@xyflow/react"
import { useSkillGraphLayout } from "../hooks/useSkillGraphLayout"
import type { SkillDomain, SkillGraphData, SkillNode } from "../hooks/useQuerySkillGraphSwr"
import { SkillGraphSkeleton } from "./SkillGraphSkeleton"
import { CenterNodeCard } from "./CenterNodeCard"
import { SkillNodeCard } from "./SkillNodeCard"
import type { SkillNodeData } from "./SkillNodeCard"

/** Props for {@link SkillGraphCanvas}. */
export interface SkillGraphCanvasProps {
    graph: SkillGraphData
    activeDomains: Set<SkillDomain>
    heightClassName: string
    selectedId?: string
    onSelect: (skill: SkillNode) => void
}

const NODE_TYPES: NodeTypes = {
    skill: SkillNodeCard,
    center: CenterNodeCard,
}

/**
 * React Flow canvas rendering the spider-web graph. Mounts only after hydration
 * (SSR-safe — React Flow measures the DOM), computes a deterministic d3-force
 * layout, wires pan/zoom, hover neighbor-highlight, domain filtering, and click
 * → detail selection.
 */
const SkillGraphCanvasInner = ({
    graph,
    activeDomains,
    heightClassName,
    selectedId,
    onSelect,
}: SkillGraphCanvasProps) => {
    const t = useTranslations()
    const [hoveredId, setHoveredId] = useState<string | null>(null)

    // Domain-filtered subgraph (edges kept only between visible nodes).
    const filtered = useMemo<SkillGraphData>(() => {
        if (activeDomains.size === 0) return graph
        const keep = new Set(graph.nodes.filter((node) => activeDomains.has(node.domain)).map((node) => node.id))
        return {
            nodes: graph.nodes.filter((node) => keep.has(node.id)),
            edges: graph.edges.filter((edge) => keep.has(edge.source) && keep.has(edge.target)),
        }
    }, [graph, activeDomains])

    const layout = useSkillGraphLayout(filtered)

    // Adjacency map for O(1) neighbor highlight (no graph walk in render).
    const adjacency = useMemo(() => {
        const map = new Map<string, Set<string>>()
        for (const edge of filtered.edges) {
            if (!map.has(edge.source)) map.set(edge.source, new Set())
            if (!map.has(edge.target)) map.set(edge.target, new Set())
            map.get(edge.source)?.add(edge.target)
            map.get(edge.target)?.add(edge.source)
        }
        return map
    }, [filtered.edges])

    const highlightId = hoveredId ?? selectedId ?? null
    const highlightSet = useMemo(() => {
        if (!highlightId) return null
        const set = new Set<string>([highlightId])
        for (const neighbor of adjacency.get(highlightId) ?? []) set.add(neighbor)
        return set
    }, [highlightId, adjacency])

    const nodes = useMemo<Array<Node>>(() => {
        const centerNode: Node = {
            id: "__center__",
            type: "center",
            position: { x: layout.center.x - 40, y: layout.center.y - 40 },
            data: { label: t("skillGraph.you") },
            draggable: false,
            selectable: false,
        }
        const skillNodes: Array<Node> = layout.nodes.map((positioned) => {
            const dimmed = !!highlightSet && !highlightSet.has(positioned.id)
            const highlighted = !!highlightSet && highlightSet.has(positioned.id) && positioned.id === highlightId
            const data: SkillNodeData = {
                skill: positioned,
                statusLabel: t(`skillGraph.statuses.${positioned.status}`),
                dimmed,
                highlighted,
            }
            return {
                id: positioned.id,
                type: "skill",
                position: { x: positioned.x, y: positioned.y },
                data,
                draggable: false,
                ariaLabel: `${positioned.name} — ${t(`skillGraph.domains.${positioned.domain}`)}, ${t(
                    `skillGraph.statuses.${positioned.status}`,
                )}, ${positioned.level}%`,
            }
        })
        return [centerNode, ...skillNodes]
    }, [layout, highlightSet, highlightId, t])

    const edges = useMemo<Array<Edge>>(() => {
        const skillEdges: Array<Edge> = filtered.edges.map((edge) => {
            const active =
                !highlightSet ||
                (highlightId != null &&
                    (edge.source === highlightId || edge.target === highlightId) &&
                    highlightSet.has(edge.source) &&
                    highlightSet.has(edge.target))
            return {
                id: edge.id,
                source: edge.source,
                target: edge.target,
                animated: false,
                selectable: false,
                focusable: false,
                style: {
                    stroke: "var(--muted)",
                    strokeWidth: active ? 2 : 1,
                    strokeDasharray: edge.kind === "related" ? "4 3" : undefined,
                    opacity: active ? 0.9 : 0.2,
                },
                markerEnd:
                    edge.kind === "prerequisite"
                        ? { type: MarkerType.ArrowClosed, color: "var(--muted)", width: 14, height: 14 }
                        : undefined,
            }
        })
        // Spokes from the center to each node (the "web").
        const spokes: Array<Edge> = layout.nodes.map((positioned) => ({
            id: `spoke-${positioned.id}`,
            source: "__center__",
            target: positioned.id,
            selectable: false,
            focusable: false,
            style: { stroke: "var(--border)", strokeWidth: 1, opacity: highlightSet ? 0.08 : 0.25 },
        }))
        return [...spokes, ...skillEdges]
    }, [filtered.edges, layout.nodes, highlightSet, highlightId])

    const onNodeClick: NodeMouseHandler = (_event, node) => {
        const data = node.data as SkillNodeData | undefined
        if (data?.skill) onSelect(data.skill)
    }
    const onNodeMouseEnter: NodeMouseHandler = (_event, node) => {
        if (node.type === "skill") setHoveredId(node.id)
    }
    const onNodeMouseLeave: NodeMouseHandler = () => setHoveredId(null)

    return (
        <div
            className={`w-full overflow-hidden rounded-2xl border border-default bg-surface ${heightClassName}`}
            role="application"
            aria-label={t("skillGraph.canvasLabel")}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={NODE_TYPES}
                onNodeClick={onNodeClick}
                onNodeMouseEnter={onNodeMouseEnter}
                onNodeMouseLeave={onNodeMouseLeave}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.3}
                maxZoom={2}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable
                proOptions={{ hideAttribution: true }}
            >
                <Background gap={24} color="var(--border)" />
                <Controls showInteractive={false} position="bottom-right" />
            </ReactFlow>
        </div>
    )
}

/** SSR-safe wrapper: renders the skeleton until mounted, then the React Flow canvas. */
export const SkillGraphCanvas = (props: SkillGraphCanvasProps) => {
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    if (!mounted) {
        return <SkillGraphSkeleton heightClassName={props.heightClassName} />
    }

    return (
        <ReactFlowProvider>
            <SkillGraphCanvasInner {...props} />
        </ReactFlowProvider>
    )
}
