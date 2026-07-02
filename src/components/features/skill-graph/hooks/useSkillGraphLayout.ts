"use client"

import { useMemo } from "react"
import {
    forceCollide,
    forceLink,
    forceManyBody,
    forceRadial,
    forceSimulation,
    forceX,
    forceY,
} from "d3-force"
import type { SimulationLinkDatum, SimulationNodeDatum } from "d3-force"
import { SKILL_DOMAINS } from "./useQuerySkillGraphSwr"
import type { SkillGraphData, SkillNode } from "./useQuerySkillGraphSwr"

/** A skill node with a computed 2-D position. */
export interface PositionedSkillNode extends SkillNode {
    x: number
    y: number
}

/** The result of the force layout: positioned skill nodes + the center user node. */
export interface SkillGraphLayout {
    nodes: Array<PositionedSkillNode>
    center: { x: number; y: number }
}

interface SimNode extends SimulationNodeDatum {
    id: string
    node: SkillNode
}

/**
 * Computes a deterministic spider-web layout for a skill graph with `d3-force`.
 * Runs the simulation synchronously (fixed tick count, seeded initial angles by
 * domain) so positions are stable across re-renders — no animated ticking.
 *
 * @param data - The skill graph (nodes + edges) to lay out.
 * @returns Positioned nodes plus the fixed center point (the user node).
 */
export const useSkillGraphLayout = (data: SkillGraphData | undefined): SkillGraphLayout => {
    return useMemo(() => {
        const center = { x: 0, y: 0 }
        if (!data || data.nodes.length === 0) {
            return { nodes: [], center }
        }

        const sectorCount = SKILL_DOMAINS.length
        // Seed initial positions on a per-domain angular sector so clusters form web sectors.
        const perDomainIndex: Record<string, number> = {}
        const domainCounts: Record<string, number> = {}
        for (const node of data.nodes) {
            domainCounts[node.domain] = (domainCounts[node.domain] ?? 0) + 1
        }

        const simNodes: Array<SimNode> = data.nodes.map((node) => {
            const sector = SKILL_DOMAINS.indexOf(node.domain)
            const withinIndex = perDomainIndex[node.domain] ?? 0
            perDomainIndex[node.domain] = withinIndex + 1
            const count = domainCounts[node.domain] ?? 1
            // Base sector angle + a small deterministic spread inside the sector.
            const sectorAngle = (sector / sectorCount) * Math.PI * 2
            const spread = ((withinIndex + 1) / (count + 1) - 0.5) * ((Math.PI * 2) / sectorCount) * 0.8
            const angle = sectorAngle + spread
            // Inner ring for mastered/learning, outer for locked → spider-web depth.
            const ring = node.status === "mastered" ? 170 : node.status === "learning" ? 240 : 320
            return {
                id: node.id,
                node,
                x: Math.cos(angle) * ring,
                y: Math.sin(angle) * ring,
            }
        })

        const byId = new Map(simNodes.map((simNode) => [simNode.id, simNode]))
        const links: Array<SimulationLinkDatum<SimNode>> = data.edges
            .filter((edge) => byId.has(edge.source) && byId.has(edge.target))
            .map((edge) => ({ source: edge.source, target: edge.target }))

        const simulation = forceSimulation<SimNode>(simNodes)
            .force(
                "link",
                forceLink<SimNode, SimulationLinkDatum<SimNode>>(links)
                    .id((simNode) => simNode.id)
                    .distance(90)
                    .strength(0.15),
            )
            .force("charge", forceManyBody<SimNode>().strength(-260))
            .force("collide", forceCollide<SimNode>(46))
            .force(
                "radial",
                forceRadial<SimNode>(
                    (simNode) =>
                        simNode.node.status === "mastered" ? 170 : simNode.node.status === "learning" ? 250 : 340,
                    center.x,
                    center.y,
                ).strength(0.35),
            )
            // Gentle pull toward the sector axis keeps domain clusters angularly separated.
            .force("x", forceX<SimNode>(center.x).strength(0.02))
            .force("y", forceY<SimNode>(center.y).strength(0.02))
            .stop()

        // Synchronous, fixed-iteration run — deterministic, no animation.
        const iterations = 300
        for (let i = 0; i < iterations; i += 1) {
            simulation.tick()
        }

        const nodes: Array<PositionedSkillNode> = simNodes.map((simNode) => ({
            ...simNode.node,
            x: Math.round(simNode.x ?? 0),
            y: Math.round(simNode.y ?? 0),
        }))

        return { nodes, center }
    }, [data])
}
