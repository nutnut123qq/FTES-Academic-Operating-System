"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
    Background,
    BackgroundVariant,
    type Edge,
    type Node,
    type NodeMouseHandler,
    Panel,
    ReactFlow,
    ReactFlowProvider,
    useEdgesState,
    useNodesState,
    useReactFlow,
} from "@xyflow/react"
import { cn } from "@heroui/react"
import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { useReducedMotion } from "framer-motion"
import { useTheme } from "next-themes"
import {
    forceCollide,
    forceLink,
    forceManyBody,
    forceSimulation,
    forceX,
    forceY,
    type Simulation,
    type SimulationLinkDatum,
    type SimulationNodeDatum,
} from "d3-force"
import { pathConfig } from "@/resources/path"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { LANDING_TRACK_COURSE_SLUG } from "../constants"
import { CONCEPT_NODE_TYPE, type ConceptNodeData, ConceptNode } from "./ConceptNode"
import { ShuffleBeacon } from "./ShuffleBeacon"
import { KNOWLEDGE_EDGES, KNOWLEDGE_NODES, NODE_DEGREE, TRACK_CONFIG, bubbleRadius, type TrackKey } from "./data"

/** A d3-force simulation node (positions written back onto React Flow each tick). */
interface SimNode extends SimulationNodeDatum {
    id: string
    track: TrackKey
}

/** Initial React Flow nodes — seed quanh ANCHOR theo track (3 màu 3 góc tam giác), rải trên
 * 1 ring nhỏ; force sau đó kéo mỗi track về góc của nó, vùng giữa các góc tự trộn lẫn. */
const buildInitialNodes = (): Node<ConceptNodeData>[] =>
    KNOWLEDGE_NODES.map((node, index) => {
        const cfg = TRACK_CONFIG[node.track]
        const angle = (index / KNOWLEDGE_NODES.length) * Math.PI * 2
        return {
            id: node.id,
            type: CONCEPT_NODE_TYPE,
            position: {
                x: cfg.anchorX + Math.cos(angle) * 130,
                y: cfg.anchorY + Math.sin(angle) * 130,
            },
            data: { label: node.label, track: node.track },
            draggable: true,
        }
    })

/** Edges — TẤT CẢ là đường nối nhẹ (đặc, mảnh, mờ — như sharding↔cdc); KHÔNG dashed, KHÔNG accent. */
const buildEdges = (): Edge[] =>
    KNOWLEDGE_EDGES.map((edge, index) => ({
        id: `e${index}`,
        source: edge.source,
        target: edge.target,
        type: "straight",
        style: { stroke: "var(--border)", strokeWidth: 1, strokeOpacity: 0.22 },
    }))

/** Per-node collide radius (px): bubble radius, but ≥ nửa bề rộng label (label căn GIỮA,
 * tràn ngang ra ngoài bubble) để label đỡ chồng hàng xóm. Pad giữ chòm bubble thoáng. */
const COLLIDE_RADIUS = new Map(
    KNOWLEDGE_NODES.map((node) => {
        const r = bubbleRadius(NODE_DEGREE[node.id] ?? 1)
        const labelHalfWidth = node.label.length * 3.4
        return [node.id, Math.max(r, labelHalfWidth) + 14] as const
    }),
)

/** Inner flow (needs to be inside {@link ReactFlowProvider} for `useReactFlow`). */
const KnowledgeGraphFlow = () => {
    const router = useRouter()
    const locale = useLocale()
    const { resolvedTheme } = useTheme()
    const reduce = useReducedMotion()
    const { setCenter } = useReactFlow()

    const [nodes, setNodes, onNodesChange] = useNodesState<Node<ConceptNodeData>>(buildInitialNodes())
    const [edges, , onEdgesChange] = useEdgesState(buildEdges())
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const nodeTypes = useMemo(() => ({ [CONCEPT_NODE_TYPE]: ConceptNode }), [])

    // Re-shuffle = give every node a random velocity kick + reheat the sim → nodes drift
    // out and re-settle into a fresh arrangement (the beacon countdown / tap fires this).
    const reshuffle = useCallback(() => {
        const simulation = simRef.current
        if (!simulation) {
            return
        }
        simNodesRef.current.forEach((simNode) => {
            simNode.fx = null
            simNode.fy = null
            simNode.vx = (Math.random() - 0.5) * 200
            simNode.vy = (Math.random() - 0.5) * 200
        })
        simulation.alpha(1).restart()
    }, [])

    const simRef = useRef<Simulation<SimNode, undefined> | null>(null)
    const simNodesRef = useRef<Map<string, SimNode>>(new Map())
    const draggingRef = useRef<string | null>(null)

    // Live force layout: a d3-force simulation drives node positions; each tick writes
    // positions back to React Flow. The 3 tracks gravitate to their own x-anchor (loose
    // clusters) while charge + collide spread nodes and links pull related ones together.
    useEffect(() => {
        const simNodes: SimNode[] = buildInitialNodes().map((rfNode) => ({
            id: rfNode.id,
            track: rfNode.data.track,
            x: rfNode.position.x,
            y: rfNode.position.y,
        }))
        const byId = new Map(simNodes.map((simNode) => [simNode.id, simNode]))
        simNodesRef.current = byId

        const simLinks: SimulationLinkDatum<SimNode>[] = KNOWLEDGE_EDGES.map((edge) => ({
            source: edge.source,
            target: edge.target,
        }))

        const simulation = forceSimulation(simNodes)
            .force("charge", forceManyBody().strength(-100))
            .force("link", forceLink<SimNode, SimulationLinkDatum<SimNode>>(simLinks).id((node) => node.id).distance(90).strength(0.12))
            .force("x", forceX<SimNode>((node) => TRACK_CONFIG[node.track].anchorX).strength(0.05))
            .force("y", forceY<SimNode>((node) => TRACK_CONFIG[node.track].anchorY).strength(0.05))
            .force("collide", forceCollide<SimNode>((node) => COLLIDE_RADIUS.get(node.id) ?? 44))
            .alphaDecay(0.035)
        simRef.current = simulation

        const writeBack = () => setNodes((current) => current.map((rfNode) => {
            if (rfNode.id === draggingRef.current) return rfNode
            const simNode = byId.get(rfNode.id)
            return simNode ? { ...rfNode, position: { x: simNode.x ?? 0, y: simNode.y ?? 0 } } : rfNode
        }))
        simulation.on("tick", writeBack)

        // Camera: DÍ vào giữa cụm (zoom 1.2, center 0,0) → lõi 3 màu hội tụ chiếm khung, mép
        // cắt bớt → kéo (pan) để khám phá = cảm giác bản đồ tự nhiên.
        const centre = (duration: number) => void setCenter(0, 0, { zoom: 1.2, duration })

        const fits: ReturnType<typeof setTimeout>[] = []
        if (reduce) {
            simulation.stop()
            simulation.tick(300)
            writeBack()
            fits.push(setTimeout(() => centre(0), 0))
        } else {
            fits.push(setTimeout(() => centre(500), 600))
        }

        return () => {
            simulation.stop()
            fits.forEach(clearTimeout)
        }
    }, [setCenter, reduce, setNodes])

    // Drag pins the node (fx/fy) and reheats the sim; release lets it flow back.
    const onNodeDragStart: NodeMouseHandler = useCallback((_, node) => {
        draggingRef.current = node.id
        const simNode = simNodesRef.current.get(node.id)
        if (simNode) {
            simNode.fx = node.position.x
            simNode.fy = node.position.y
        }
        simRef.current?.alphaTarget(0.3).restart()
    }, [])
    const onNodeDrag: NodeMouseHandler = useCallback((_, node) => {
        const simNode = simNodesRef.current.get(node.id)
        if (simNode) {
            simNode.fx = node.position.x
            simNode.fy = node.position.y
        }
    }, [])
    const onNodeDragStop: NodeMouseHandler = useCallback((_, node) => {
        draggingRef.current = null
        const simNode = simNodesRef.current.get(node.id)
        if (simNode) {
            simNode.fx = null
            simNode.fy = null
        }
        simRef.current?.alphaTarget(0)
    }, [])

    // Click toggles a concept's popover (blurb + CTA); clicking empty pane closes it.
    const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
        setSelectedId((prev) => (prev === node.id ? null : node.id))
    }, [])
    const onPaneClick = useCallback(() => setSelectedId(null), [])
    // CTA inside the popover → flagship course that teaches the concept (grounded).
    const onOpenCourse = useCallback(
        (track: TrackKey) => router.push(pathConfig().locale(locale).course(LANDING_TRACK_COURSE_SLUG[track]).build()),
        [router, locale],
    )
    // Inject per-render UI state (selected + CTA handler) into node data for the custom node.
    const displayNodes = useMemo(
        () => nodes.map((node) => ({
            ...node,
            // lift the open node (+ its popover) above every other node
            zIndex: node.id === selectedId ? 1000 : 0,
            data: { ...node.data, selected: node.id === selectedId, onOpenCourse },
        })),
        [nodes, selectedId, onOpenCourse],
    )

    return (
        <ReactFlow
            nodes={displayNodes}
            onPaneClick={onPaneClick}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStart={onNodeDragStart}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            colorMode={resolvedTheme === "dark" ? "dark" : "light"}
            // @xyflow dark colorMode bakes a #141414 pane bg via this var — force it
            // transparent so the graph blends into the page (starfield shows through).
            style={{ backgroundColor: "transparent", "--xy-background-color": "transparent" } as React.CSSProperties}
            proOptions={{ hideAttribution: true }}
            nodesConnectable={false}
            elementsSelectable={false}
            minZoom={1.2}
            maxZoom={1.2}
            // zoom CỐ ĐỊNH; CHO PHÉP kéo (pan) khám phá — mép cụm cắt bớt = cảm giác tự nhiên
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            preventScrolling={false}
            panOnDrag
            translateExtent={[[-1000, -820], [1000, 820]]}
        >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1} className="opacity-40" />
            {/* DeFi-swap-style countdown beacon (bottom-left): auto-reshuffles the graph
                every 10s; tap it to reshuffle now. Signals the graph is live + interactive. */}
            <Panel position="bottom-left">
                <ShuffleBeacon onShuffle={reshuffle} />
            </Panel>
        </ReactFlow>
    )
}

/** Props for {@link KnowledgeGraph}. */
export type KnowledgeGraphProps = WithClassNames<undefined>

/**
 * "Kho tàng" rendered as a live KNOWLEDGE GRAPH: ~26 real curriculum concepts (nodes)
 * interlinked by builds-on + cross-track edges, laid out by a d3-force simulation
 * (drag a node, zoom/pan). Each node is coloured by its flagship course track; clicking
 * one opens that course. Honours reduced-motion (settles to a static layout). Qdrant-
 * dashboard vibe, but brand-themed via React Flow custom nodes.
 *
 * @param props - {@link KnowledgeGraphProps}
 */
export const KnowledgeGraph = ({ className }: KnowledgeGraphProps) => (
    <div className={cn("h-[460px] w-full overflow-hidden rounded-3xl border border-default bg-background sm:h-[560px]", className)}>
        <ReactFlowProvider>
            <KnowledgeGraphFlow />
        </ReactFlowProvider>
    </div>
)
