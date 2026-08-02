"use client"

/* eslint-disable react/no-unknown-property -- react-three-fiber maps three.js
   properties (position, args, color, attach…) onto intrinsic JSX elements;
   eslint-plugin-react doesn't know them, so this rule must be off for R3F files. */

import React from "react"
import { Canvas, useFrame, useThree, invalidate } from "@react-three/fiber"
import { Html, Line, OrbitControls, useGLTF } from "@react-three/drei"
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
const LABEL_Y = 2.4

/** Khối chặng phóng to so với bản đầu: ở khoảng cách camera cũ mỗi khối chỉ ~40px nên
 *  hình gì cũng thành cục — sửa dáng mà không phóng thì công cốc. */
const STATION_SCALE = 1.35

/**
 * Hue offset (vòng màu, 0..1) của từng chặng so với `--accent`. Dẫn xuất từ token thay vì
 * hard-code màu: giữ nguyên độ bão hoà / độ sáng của theme (sáng + tối) mà vẫn tách được 5
 * chặng. Trước đây 4/5 chặng dùng chung `--default` xám nên nhìn "đơn điệu"; Thành quả vẫn
 * ăn `--success` riêng (nó là payoff, không nằm trong dải này).
 */
const KIND_HUE_SHIFT: Record<StationKind, number> = {
    home: -0.08,
    workplace: 0.5,
    course: 0,
    practice: 0.28,
    outcome: 0,
}

/** A shaded station shape per {@link StationKind}. Payoff scales up + glows. */
const StationMesh = ({ kind, color, emphasized }: { kind: StationKind; color: THREE.Color; emphasized: boolean }) => {
    // Hai tông vẫn giữ cho phần "mặt trên vs thân", nhưng nhẹ hơn hẳn bản cũ: từ khi có đèn
    // thật (ambient + directional) thì sáng-tối do ánh sáng lo, tô cứng nhiều sẽ bệt.
    const top = color.clone().lerp(WHITE, 0.1)
    const side = color
    switch (kind) {
    case "home":
        // a house: base cube + pyramid roof
        return (
            <group>
                <mesh position={[0, 0.35, 0]}>
                    <boxGeometry args={[0.9, 0.7, 0.9]} />
                    <meshLambertMaterial color={side} />
                </mesh>
                <mesh position={[0, 0.9, 0]} rotation={[0, Math.PI / 4, 0]}>
                    <coneGeometry args={[0.75, 0.55, 4]} />
                    <meshLambertMaterial color={top} />
                </mesh>
            </group>
        )
    case "workplace":
        // bàn làm việc + màn hình. Bản cũ là "slab thấp + tấm panel" → nhìn ra thùng carton;
        // mặt bàn mỏng trên 4 chân + màn nghiêng mới đọc ra "không gian làm việc".
        return (
            <group>
                {/* mặt bàn */}
                <mesh position={[0, 0.62, 0]}>
                    <boxGeometry args={[1.3, 0.1, 0.8]} />
                    <meshLambertMaterial color={top} />
                </mesh>
                {/* 4 chân bàn */}
                {[[-0.55, -0.3], [0.55, -0.3], [-0.55, 0.3], [0.55, 0.3]].map(([x, z], i) => (
                    <mesh key={i} position={[x, 0.29, z]}>
                        <boxGeometry args={[0.09, 0.58, 0.09]} />
                        <meshLambertMaterial color={side} />
                    </mesh>
                ))}
                {/* Màn hình: HẸP hơn mặt bàn, nâng trên cổ đứng nên có KHE HỞ giữa bàn và màn.
                    Hai bản trước (tấm cao sát mép sau, rồi tấm rộng bằng bàn) đều đọc ra lưng
                    ghế — cái tách nghĩa là khe hở + bề rộng nhỏ hơn bàn. Mặt hiển thị tô tông
                    tối hơn khung để ra "cái màn", không phải tấm ván. */}
                <mesh position={[0, 0.72, -0.14]}>
                    <boxGeometry args={[0.3, 0.04, 0.18]} />
                    <meshLambertMaterial color={side} />
                </mesh>
                <mesh position={[0, 0.84, -0.14]}>
                    <boxGeometry args={[0.07, 0.2, 0.07]} />
                    <meshLambertMaterial color={side} />
                </mesh>
                <mesh position={[0, 1.06, -0.14]} rotation={[-0.16, 0, 0]}>
                    <boxGeometry args={[0.66, 0.4, 0.05]} />
                    <meshLambertMaterial color={side} />
                </mesh>
                <mesh position={[0, 1.06, -0.11]} rotation={[-0.16, 0, 0]}>
                    <boxGeometry args={[0.58, 0.32, 0.02]} />
                    <meshLambertMaterial color={top} />
                </mesh>
                {/* bàn phím — chi tiết chốt nghĩa "bàn làm việc", tách hẳn khỏi hình cái ghế */}
                <mesh position={[0, 0.69, 0.22]} rotation={[-0.06, 0, 0]}>
                    <boxGeometry args={[0.6, 0.04, 0.22]} />
                    <meshLambertMaterial color={top} />
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
                        <meshLambertMaterial color={i % 2 ? top : side} />
                    </mesh>
                ))}
            </group>
        )
    case "practice":
        // tạ + AI orb. Bản cũ chỉ có thanh trụ trơn nên nhìn như khúc xương — thêm 2 bánh tạ
        // hai đầu (thứ khiến mắt nhận ra "tạ") và hạ thanh xuống cho ra dáng đặt trên sàn.
        return (
            <group>
                <mesh position={[0, 0.34, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.08, 0.08, 1.24, 16]} />
                    <meshLambertMaterial color={side} />
                </mesh>
                {[-0.52, 0.52].map((x) => (
                    <mesh key={x} position={[x, 0.34, 0]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.3, 0.3, 0.17, 20]} />
                        <meshLambertMaterial color={top} />
                    </mesh>
                ))}
                <mesh position={[0, 1.0, 0]}>
                    <icosahedronGeometry args={[0.34, 0]} />
                    <meshLambertMaterial color={top} />
                </mesh>
            </group>
        )
    case "outcome":
    default:
        // cúp = thành quả (chặng payoff). Quai hai bên là chi tiết quyết định: thiếu nó thì
        // đế + thân + chỏm cầu chỉ đọc ra "cái ly" (góp ý website 2026-07-26).
        return (
            <group scale={emphasized ? 1.28 : 1}>
                {/* đế dày 2 tầng */}
                <mesh position={[0, 0.11, 0]}>
                    <cylinderGeometry args={[0.5, 0.56, 0.22, 6]} />
                    <meshLambertMaterial color={side} />
                </mesh>
                <mesh position={[0, 0.29, 0]}>
                    <cylinderGeometry args={[0.34, 0.44, 0.16, 6]} />
                    <meshLambertMaterial color={side} />
                </mesh>
                {/* thân */}
                <mesh position={[0, 0.5, 0]}>
                    <cylinderGeometry args={[0.1, 0.13, 0.3, 12]} />
                    <meshLambertMaterial color={side} />
                </mesh>
                {/* bát cúp = nón cụt loe miệng. Bản trước dùng chỏm cầu: từ góc camera này mặt
                    cầu đọc ra quả bóng / cây nấm, không ra cái cốc (thấy trên ảnh chụp thử). */}
                <mesh position={[0, 0.92, 0]}>
                    <cylinderGeometry args={[0.42, 0.2, 0.52, 20, 1, true]} />
                    <meshLambertMaterial color={top} side={THREE.DoubleSide} />
                </mesh>
                {/* đáy lòng cốc (nón cụt để hở nên phải bịt, không thì nhìn xuyên) */}
                <mesh position={[0, 0.7, 0]}>
                    <cylinderGeometry args={[0.2, 0.2, 0.03, 20]} />
                    <meshLambertMaterial color={top} />
                </mesh>
                {/* quai hai bên: nửa vòng DỰNG trong mặt phẳng XY, bụng quai loe ra ngoài — nằm
                    ngang như bản trước thì bị bát che mất, mà quai mới là thứ chốt nghĩa "cúp". */}
                {[-1, 1].map((dir) => (
                    <mesh
                        key={dir}
                        position={[dir * 0.38, 0.96, 0]}
                        rotation={[0, 0, dir > 0 ? -Math.PI / 2 : Math.PI / 2]}
                    >
                        <torusGeometry args={[0.17, 0.045, 10, 20, Math.PI]} />
                        <meshLambertMaterial color={top} />
                    </mesh>
                ))}
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
    // Tông riêng cho từng chặng (payoff giữ --success). Active = chính tông đó sáng lên, KHÔNG
    // đổi sang accent như bản cũ — đổi màu khi active thì 4 chặng còn lại vẫn xám như nhau.
    const color = React.useMemo(() => {
        if (node.payoff) return active ? palette.success.clone().lerp(WHITE, 0.16) : palette.success
        // Kéo mạnh về `--node` để 5 tông chỉ khác nhau đủ phân biệt, không thành 5 cây bút sáp:
        // lệch hue giữ vai trò "đây là chặng khác", còn độ gắt do token nền quyết định.
        const tone = palette.accent.clone().offsetHSL(KIND_HUE_SHIFT[node.kind], 0, 0)
        return active ? tone.lerp(palette.node, 0.32) : tone.lerp(palette.node, 0.62)
    }, [node.payoff, node.kind, active, palette])
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
            <group scale={STATION_SCALE}>
                <StationMesh kind={node.kind} color={color} emphasized={Boolean(node.payoff)} />
            </group>
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

/** Đường ray đi qua các ga — dùng CHUNG cho nét đứt và cho đường chạy của mascot, nên phải
 *  là một curve duy nhất (hai curve riêng sẽ lệch nhau vài pixel ở khúc cong). */
const useJourneyCurve = (stations: JourneyStationNode[]) =>
    React.useMemo(() => {
        const points = stations.map((s) => new THREE.Vector3(...s.pos).setY(0.15))
        return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.4)
    }, [stations])

/** Nét đứt của đường ray. Bốn chấm tròn chạy dọc đường đã BỎ — mascot thay vai trò "chỉ hướng
 *  đi", giữ cả hai thì đường ray thành hai thứ chuyển động tranh nhau (góp ý website). */
const FlowPath = ({ curve, palette }: { curve: THREE.CatmullRomCurve3; palette: Palette }) => {
    const linePoints = React.useMemo(() => curve.getPoints(120), [curve])
    return (
        <Line points={linePoints} color={palette.accent} lineWidth={2} dashed dashSize={0.24} gapSize={0.18} transparent opacity={0.7} />
    )
}

/** Model 3D của FrosTES (sinh từ art pose `greeting`). KHÔNG có xương/animation — chỉ là
 *  khối tĩnh, nên chuyển động vẫn là trượt trên ray + nhún, không phải bước chân thật. */
const MASCOT_MODEL = "/mascot/frostes.glb"

/** Cao ~1.7 đơn vị — mascot là VẬT CHUẨN kích thước của scene, đổi số này thì phải soi lại
 *  scale khối chặng và khoảng cách camera. */
const MASCOT_HEIGHT = 1.7

/** Xoay model về đúng tư thế đứng, mặt hướng ra camera (+z). File TRELLIS sinh ra theo quy ước
 *  Z-up nên phải hạ -90° quanh trục X; chỉnh số ở ĐÂY nếu đổi sang model khác. */
const MODEL_ROTATION: [number, number, number] = [0, 0, 0]

/** Đứng LỆCH SANG BÊN + nhích ra trước so với tâm ga. Góp ý là "đứng CẠNH những phần tử":
 *  đứng đúng tâm thì khối che mất nửa người, mà nhích thẳng ra trước thì cáo che mất khối
 *  (cả hai đều đã thấy trên ảnh chụp thử). */
const MASCOT_OFFSET: [number, number] = [1.2, 0.75]

/**
 * FrosTES chạy dọc đường ray tới ga đang active rồi ĐỨNG LẠI đó (thay 4 chấm chạy vô nghĩa).
 * Là billboard 2D: art là ảnh render sẵn, mang ánh sáng riêng nên KHÔNG nhận đèn scene
 * (`sprite` + `spriteMaterial`), và luôn quay mặt về camera kể cả khi khách xoay OrbitControls.
 * Bóng ellipse mờ dưới chân để nhân vật chạm đất thay vì trôi.
 */
const Mascot = ({
    curve,
    stations,
    activeIndex,
    palette,
    reduce,
}: {
    curve: THREE.CatmullRomCurve3
    stations: JourneyStationNode[]
    activeIndex: number
    palette: Palette
    reduce: boolean
}) => {
    const { scene: gltfScene } = useGLTF(MASCOT_MODEL)
    /** Model sinh ra nằm trong hộp đơn vị quanh gốc toạ độ → chuẩn hoá về đúng chiều cao
     *  scene VÀ hạ chân xuống mặt đất, thay vì tin vào scale/pivot của file. */
    const model = React.useMemo(() => {
        // Xoay TRƯỚC rồi mới đo hộp bao: file sinh ra theo trục Z-up nên nhân vật nằm ngửa,
        // và đo chiều cao trên trục sai thì scale cũng sai theo.
        const holder = new THREE.Group()
        const clone = gltfScene.clone(true)
        // File sinh ra KHÔNG khai báo metallicFactor → glTF mặc định = 1.0 (kim loại đặc). Scene
        // này không có environment map để phản chiếu nên vật kim loại render ra khối đen xỉn.
        // Lông + vải là phi kim → ép metalness 0, để đèn của scene ăn đúng.
        clone.traverse((child) => {
            const mesh = child as THREE.Mesh
            if (!mesh.isMesh) return
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
            materials.forEach((material) => {
                const std = material as THREE.MeshStandardMaterial
                if (std.isMeshStandardMaterial) {
                    std.metalness = 0
                    std.roughness = 0.85
                }
            })
        })
        clone.rotation.set(MODEL_ROTATION[0], MODEL_ROTATION[1], MODEL_ROTATION[2])
        holder.add(clone)
        holder.updateMatrixWorld(true)
        const box = new THREE.Box3().setFromObject(holder)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        const scale = size.y > 0 ? MASCOT_HEIGHT / size.y : 1
        holder.scale.setScalar(scale)
        // chân chạm đất (box.min.y), tâm trùng trục đứng
        holder.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)
        return holder
    }, [gltfScene])
    /** Vị trí trên curve (0..1) của ga đang active — các ga chia đều theo control point. */
    const targetU = stations.length > 1 ? Math.max(0, Math.min(activeIndex, stations.length - 1)) / (stations.length - 1) : 0

    const group = React.useRef<THREE.Group>(null)
    const u = React.useRef(targetU)
    const point = React.useMemo(() => new THREE.Vector3(), [])

    useFrame(({ clock }) => {
        if (!group.current) return
        // chạy tới ga: lerp trên tham số đường cong (không phải lerp toạ độ) nên luôn bám ray
        const delta = targetU - u.current
        if (Math.abs(delta) > 0.0005) {
            u.current += delta * (reduce ? 1 : 0.06)
            invalidate()
        } else {
            u.current = targetU
        }
        curve.getPointAt(Math.max(0, Math.min(1, u.current)), point)
        // đứng yên thì bob nhẹ; đang di chuyển thì nảy nhanh hơn cho ra cảm giác bước
        const t = clock.getElapsedTime()
        const moving = Math.abs(delta) > 0.0005
        const bob = reduce ? 0 : Math.sin(t * (moving ? 9 : 2.2)) * (moving ? 0.09 : 0.045)
        group.current.position.set(
            point.x + MASCOT_OFFSET[0],
            point.y + bob,
            point.z + MASCOT_OFFSET[1],
        )
        if (!reduce) invalidate()
    })

    return (
        <group>
            <group ref={group}>
                <primitive object={model} />
            </group>
            <GroundShadow curve={curve} u={u} palette={palette} />
        </group>
    )
}

/** Bóng ellipse mờ bám chân mascot (đọc `u` cùng ref nên không lệch khung hình nào). */
const GroundShadow = ({
    curve,
    u,
    palette,
}: {
    curve: THREE.CatmullRomCurve3
    u: React.RefObject<number>
    palette: Palette
}) => {
    const mesh = React.useRef<THREE.Mesh>(null)
    const point = React.useMemo(() => new THREE.Vector3(), [])
    useFrame(() => {
        if (!mesh.current) return
        curve.getPointAt(Math.max(0, Math.min(1, u.current ?? 0)), point)
        mesh.current.position.set(point.x + MASCOT_OFFSET[0], 0.02, point.z + MASCOT_OFFSET[1])
    })
    return (
        <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.45, 1]}>
            <circleGeometry args={[0.42, 24]} />
            <meshBasicMaterial color={palette.muted} transparent opacity={0.22} depthWrite={false} />
        </mesh>
    )
}

/** Tween the camera to look at the active station (demand frameloop → invalidate).
 *  A manual orbit (OrbitControls onStart) pauses the rig — but only until the NEXT
 *  stage change: any change of the active station (stepper click or auto-advance)
 *  re-takes the camera and tweens ONE smooth move from wherever the visitor left it
 *  to the new station's canonical pose. The orbit pivot (controls target) is lerped
 *  along too, so the next drag orbits around the active station instead of snapping. */
const CameraRig = ({ target, offset, tookOver }: { target: THREE.Vector3; offset: THREE.Vector3; tookOver: React.RefObject<boolean> }) => {
    const { camera, controls } = useThree()
    const desired = React.useMemo(() => target.clone().add(offset), [target, offset])
    useFrame(() => {
        // the visitor is driving (grabbed since the last stage change) → hands off.
        if (tookOver.current) return
        camera.position.lerp(desired, 0.08)
        const orbit = controls as unknown as { target: THREE.Vector3; update: () => void } | null
        if (orbit) {
            // keep ONE source of truth for the look-at: move the controls' own pivot
            // (update() applies the lookAt) so rig and controls never fight.
            orbit.target.lerp(target, 0.08)
            orbit.update()
        } else {
            camera.lookAt(target)
        }
        const remaining = camera.position.distanceToSquared(desired) + (orbit ? orbit.target.distanceToSquared(target) : 0)
        if (remaining > 0.0004) invalidate()
    })
    // stage change (stepper click OR auto-advance) → re-take the camera from the visitor
    React.useEffect(() => {
        tookOver.current = false
        invalidate()
    }, [desired, tookOver])
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
    // true while the visitor drives the camera (OrbitControls grab) — the rig backs
    // off until the next stage change re-takes it (see CameraRig).
    const userTookOver = React.useRef(false)
    const curve = useJourneyCurve(DATA.stations)
    return (
        <group>
            {/* Ánh sáng: trước đây mọi khối dùng meshBasicMaterial (bỏ qua đèn) nên mặt nào cũng
                một màu, cạnh biến mất, cúp/nhà/sách đều dẹp thành mảng. Ambient giữ vùng tối
                không đen kịt, directional chếch cao tạo mặt sáng/mặt tối cho ra khối. */}
            <ambientLight intensity={1.35} />
            <directionalLight position={[5, 9, 6]} intensity={1.5} />
            <directionalLight position={[-6, 4, -4]} intensity={0.4} />
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
            <FlowPath curve={curve} palette={palette} />
            <React.Suspense fallback={null}>
                <Mascot
                    curve={curve}
                    stations={DATA.stations}
                    activeIndex={activeIndex}
                    palette={palette}
                    reduce={reduce}
                />
            </React.Suspense>
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
