"use client"

/* eslint-disable react/no-unknown-property -- react-three-fiber maps three.js
   properties (position, args, color, attach…) onto intrinsic JSX elements;
   eslint-plugin-react doesn't know them, so this rule must be off for R3F files. */

import React from "react"
import { Canvas, useFrame, useThree, invalidate } from "@react-three/fiber"
import { Html, Line, OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import type { JourneySceneData, JourneyStationLabel, JourneyStationNode, StationKind } from "./types"
import sceneJson from "./scene.json"

/**
 * 3D USER-JOURNEY scene (real WebGL via react-three-fiber) for the landing hero. It
 * narrates the product journey as five ordered stations — Home → Subject Workplace →
 * Course → Luyện tập/AI → **Thành quả** — connected by an animated flow of pulses
 * travelling in journey order. The final "Thành quả" station is EMPHASIZED (glow,
 * success tone, larger scale) because the point of the story is the payoff.
 *
 * Guided, NOT free-orbit and NOT scroll-hijacking: a stage stepper (owned by the
 * caller) drives `activeIndex`; the camera tweens to the active station and its
 * floating label lifts. Auto-advance / pause is the caller's concern (this is a pure
 * presentational Canvas). Copy is passed via `labels` — the Canvas never imports
 * next-intl. Client-only: mounted through a `ssr:false` dynamic import so three.js
 * never enters the server (webpack) bundle. Frameloop is `demand` — it renders only
 * while a tween or pulse is in flight (perf budget). DPR clamped, resources disposed
 * on unmount by R3F.
 */

/** JSON widens tuples/unions → assert the schema. */
const DATA = sceneJson as unknown as JourneySceneData

/** Tone tokens (theme-aware). Neutral stations = `--default`; the payoff = `--success`;
 *  the accent path/flow = `--accent`. Read once on mount + on theme flip. */
const NODE_FALLBACK = "#2b313d"
const ACCENT_FALLBACK = "#6366f1"
const SUCCESS_FALLBACK = "#34d399"
const MUTED_FALLBACK = "#6b7382"

const WHITE = new THREE.Color("#ffffff")

/** Normalise any CSS colour (incl. `oklch(...)` HeroUI tokens) into sRGB THREE can
 *  parse — rasterise 1px and read the pixel back (three cannot parse oklch directly). */
let normCtx: CanvasRenderingContext2D | null | undefined
const cssColorToRgb = (color: string): string | null => {
    if (!color) return null
    if (normCtx === undefined) normCtx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })
    if (!normCtx) return null
    normCtx.fillStyle = "#000000"
    normCtx.fillStyle = color
    const fromBlack = normCtx.fillStyle
    normCtx.fillStyle = "#ffffff"
    normCtx.fillStyle = color
    if (fromBlack !== normCtx.fillStyle) return null
    normCtx.clearRect(0, 0, 1, 1)
    normCtx.fillStyle = color
    normCtx.fillRect(0, 0, 1, 1)
    const [r, g, b] = normCtx.getImageData(0, 0, 1, 1).data
    return `rgb(${r}, ${g}, ${b})`
}

/** Read a CSS var into a THREE.Color, gamut-mapped, with fallback. */
const readToken = (cssVar: string, fallback: string): THREE.Color => {
    if (typeof document === "undefined") return new THREE.Color(fallback)
    const probe = document.createElement("span")
    probe.style.color = `var(${cssVar})`
    probe.style.position = "absolute"
    probe.style.opacity = "0"
    probe.style.pointerEvents = "none"
    document.body.appendChild(probe)
    const computed = getComputedStyle(probe).color
    document.body.removeChild(probe)
    return new THREE.Color(cssColorToRgb(computed) ?? fallback)
}

interface Palette {
    node: THREE.Color
    accent: THREE.Color
    success: THREE.Color
    muted: THREE.Color
}

const usePalette = (): Palette => {
    const build = React.useCallback(
        (read: (v: string, f: string) => THREE.Color): Palette => ({
            node: read("--default", NODE_FALLBACK),
            accent: read("--accent", ACCENT_FALLBACK),
            success: read("--success", SUCCESS_FALLBACK),
            muted: read("--muted", MUTED_FALLBACK),
        }),
        [],
    )
    const [palette, setPalette] = React.useState<Palette>(() => build((_v, f) => new THREE.Color(f)))
    React.useEffect(() => {
        const read = () => {
            setPalette(build((v, f) => readToken(v, f)))
            invalidate()
        }
        read()
        const observer = new MutationObserver(read)
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] })
        return () => observer.disconnect()
    }, [build])
    return palette
}

/** Height a station's floating label sits above the node. */
const LABEL_Y = 1.9

/** A flat-shaded station shape per {@link StationKind}. Payoff scales up + glows. */
const StationMesh = ({ kind, color, emphasized }: { kind: StationKind; color: THREE.Color; emphasized: boolean }) => {
    const top = color.clone().lerp(WHITE, 0.18)
    const side = color.clone().multiplyScalar(0.7)
    switch (kind) {
    case "home":
        // a house: base cube + pyramid roof
        return (
            <group>
                <mesh position={[0, 0.35, 0]}>
                    <boxGeometry args={[0.9, 0.7, 0.9]} />
                    <meshBasicMaterial color={side} />
                </mesh>
                <mesh position={[0, 0.9, 0]} rotation={[0, Math.PI / 4, 0]}>
                    <coneGeometry args={[0.75, 0.55, 4]} />
                    <meshBasicMaterial color={top} />
                </mesh>
            </group>
        )
    case "workplace":
        // a workbench: wide low slab + a raised panel
        return (
            <group>
                <mesh position={[0, 0.2, 0]}>
                    <boxGeometry args={[1.2, 0.4, 0.8]} />
                    <meshBasicMaterial color={side} />
                </mesh>
                <mesh position={[0, 0.7, -0.2]}>
                    <boxGeometry args={[1.0, 0.55, 0.08]} />
                    <meshBasicMaterial color={top} />
                </mesh>
            </group>
        )
    case "course":
        // stacked books
        return (
            <group>
                {[0, 1, 2].map((i) => (
                    <mesh key={i} position={[i * 0.04 - 0.04, 0.16 + i * 0.24, 0]} rotation={[0, i * 0.12, 0]}>
                        <boxGeometry args={[1.0, 0.2, 0.72]} />
                        <meshBasicMaterial color={i % 2 ? top : side} />
                    </mesh>
                ))}
            </group>
        )
    case "practice":
        // a dumbbell-ish barbell = luyện tập, plus an AI orb on top
        return (
            <group>
                <mesh position={[0, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.14, 0.14, 1.1, 24]} />
                    <meshBasicMaterial color={side} />
                </mesh>
                <mesh position={[0, 0.95, 0]}>
                    <icosahedronGeometry args={[0.34, 0]} />
                    <meshBasicMaterial color={top} />
                </mesh>
            </group>
        )
    case "outcome":
    default:
        // a trophy = thành quả (emphasized station)
        return (
            <group scale={emphasized ? 1.28 : 1}>
                <mesh position={[0, 0.18, 0]}>
                    <cylinderGeometry args={[0.42, 0.5, 0.22, 6]} />
                    <meshBasicMaterial color={side} />
                </mesh>
                <mesh position={[0, 0.42, 0]}>
                    <cylinderGeometry args={[0.1, 0.12, 0.3, 12]} />
                    <meshBasicMaterial color={side} />
                </mesh>
                <mesh position={[0, 0.78, 0]}>
                    <sphereGeometry args={[0.42, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.6]} />
                    <meshBasicMaterial color={top} />
                </mesh>
            </group>
        )
    }
}

/** One station: shape (payoff pulses a glow ring) + floating label chip. Active
 *  station lifts its label brighter; label is `pointerEvents:none` DOM (crawlable text
 *  lives in the fallback + stepper, this is decorative reinforcement). */
const Station = ({
    node,
    label,
    palette,
    active,
    reduce,
}: {
    node: JourneyStationNode
    label: JourneyStationLabel | undefined
    palette: Palette
    active: boolean
    reduce: boolean
}) => {
    const color = node.payoff ? palette.success : active ? palette.accent : palette.node
    const ring = React.useRef<THREE.Mesh>(null)
    useFrame(({ clock }) => {
        if (!node.payoff || reduce || !ring.current) return
        const p = (Math.sin(clock.getElapsedTime() * 2.4) + 1) / 2
        const s = 1 + p * 0.35
        ring.current.scale.set(s, s, s)
        const mat = ring.current.material as THREE.MeshBasicMaterial
        mat.opacity = 0.5 - p * 0.4
        invalidate()
    })
    return (
        <group position={node.pos}>
            <StationMesh kind={node.kind} color={color} emphasized={Boolean(node.payoff)} />
            {node.payoff ? (
                <mesh ref={ring} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.7, 0.85, 40]} />
                    <meshBasicMaterial color={palette.success} transparent opacity={0.3} side={THREE.DoubleSide} />
                </mesh>
            ) : null}
            {label ? (
                <Html position={[0, LABEL_Y, 0]} center zIndexRange={[100, 0]} style={{ pointerEvents: "none" }}>
                    <div
                        className="flex select-none flex-col items-center gap-0.5 whitespace-nowrap rounded-md border px-2 py-1 text-center"
                        style={{
                            backgroundColor: "var(--surface)",
                            borderColor: node.payoff ? "var(--success)" : active ? "var(--accent)" : "var(--default)",
                            opacity: active || node.payoff ? 1 : 0.72,
                        }}
                    >
                        <span className="text-[11px] font-semibold leading-tight text-foreground">{label.label}</span>
                    </div>
                </Html>
            ) : null}
        </group>
    )
}

/** Animated flow along the whole path: dashed accent line + N pulses travelling in
 *  journey order (Home → … → Thành quả), evenly staggered. */
const FlowPath = ({ stations, palette, reduce }: { stations: JourneyStationNode[]; palette: Palette; reduce: boolean }) => {
    const points = React.useMemo(() => stations.map((s) => new THREE.Vector3(...s.pos).setY(0.15)), [stations])
    const curve = React.useMemo(() => new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.4), [points])
    const linePoints = React.useMemo(() => curve.getPoints(120), [curve])
    const PULSES = 4
    const pulses = React.useRef<Array<THREE.Mesh | null>>([])
    useFrame(({ clock }) => {
        if (reduce) return
        const base = (clock.getElapsedTime() * 0.14) % 1
        for (let i = 0; i < PULSES; i += 1) {
            const m = pulses.current[i]
            if (!m) continue
            const t = (base + i / PULSES) % 1
            m.position.copy(curve.getPointAt(t))
        }
        invalidate()
    })
    return (
        <group>
            <Line points={linePoints} color={palette.accent} lineWidth={2} dashed dashSize={0.24} gapSize={0.18} transparent opacity={0.7} />
            {Array.from({ length: PULSES }).map((_, i) => (
                <mesh key={i} ref={(el) => { pulses.current[i] = el }}>
                    <sphereGeometry args={[0.1, 12, 12]} />
                    <meshBasicMaterial color={palette.accent} />
                </mesh>
            ))}
        </group>
    )
}

/** Tween the camera to look at the active station (demand frameloop → invalidate). */
const CameraRig = ({ target, offset, tookOver }: { target: THREE.Vector3; offset: THREE.Vector3; tookOver: React.RefObject<boolean> }) => {
    const { camera } = useThree()
    const desired = React.useMemo(() => target.clone().add(offset), [target, offset])
    useFrame(() => {
        // once the visitor grabs the scene (OrbitControls onStart), hand the camera
        // over to them completely — no snap-back fight with the auto-tween.
        if (tookOver.current) return
        camera.position.lerp(desired, 0.08)
        camera.lookAt(target)
        if (camera.position.distanceToSquared(desired) > 0.0004) invalidate()
    })
    React.useEffect(() => { if (!tookOver.current) invalidate() }, [desired, tookOver])
    return null
}

const Scene = ({
    labels,
    activeIndex,
    reduce,
}: {
    labels: JourneyStationLabel[]
    activeIndex: number
    reduce: boolean
}) => {
    const palette = usePalette()
    const labelById = React.useMemo(() => Object.fromEntries(labels.map((l) => [l.id, l])), [labels])
    const active = DATA.stations[Math.max(0, Math.min(activeIndex, DATA.stations.length - 1))]
    const target = React.useMemo(() => new THREE.Vector3(...active.pos), [active])
    const offset = React.useMemo(() => new THREE.Vector3(...DATA.cameraOffset), [])
    // once true, the visitor is driving the camera (OrbitControls) — the rig backs off.
    const userTookOver = React.useRef(false)
    return (
        <group>
            <CameraRig target={target} offset={offset} tookOver={userTookOver} />
            {/* grab-to-rotate: orbit the journey, no pan/zoom so it stays framed */}
            <OrbitControls
                makeDefault
                enablePan={false}
                enableZoom={false}
                enableDamping
                dampingFactor={0.12}
                rotateSpeed={0.6}
                minPolarAngle={Math.PI / 6}
                maxPolarAngle={Math.PI / 1.9}
                onStart={() => { userTookOver.current = true }}
            />
            <FlowPath stations={DATA.stations} palette={palette} reduce={reduce} />
            {DATA.stations.map((node, i) => (
                <Station
                    key={node.id}
                    node={node}
                    label={labelById[node.id]}
                    palette={palette}
                    active={i === activeIndex}
                    reduce={reduce}
                />
            ))}
        </group>
    )
}

/** Props for {@link UserJourneyScene}. */
export interface UserJourneySceneProps {
    /** Per-station copy from i18n (id / label / caption). */
    labels: JourneyStationLabel[]
    /** Index of the highlighted station (driven by the caller's stepper). */
    activeIndex: number
    /** Skip all animation (reduced motion) — the caller normally renders the static
     *  fallback instead, but honoured here as a belt-and-braces guard. */
    reduce?: boolean
    className?: string
}

/**
 * The animated 3D journey canvas. Presentational only — the caller owns the stepper,
 * auto-advance and reduced-motion decision. See the module doc-comment for the full
 * contract.
 *
 * @param props - {@link UserJourneySceneProps}
 */
export const UserJourneyScene = ({ labels, activeIndex, reduce = false }: UserJourneySceneProps) => {
    return (
        <Canvas
            flat
            frameloop="demand"
            camera={{ position: [9.2, 5.2, 8.5], fov: 42, near: 0.1, far: 100 }}
            gl={{ alpha: true, antialias: true }}
            style={{ background: "transparent" }}
            dpr={[1, 2]}
        >
            <Scene labels={labels} activeIndex={activeIndex} reduce={reduce} />
        </Canvas>
    )
}

export default UserJourneyScene
