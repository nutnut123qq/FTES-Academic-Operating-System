import React from "react"

/**
 * The four mascot poses, each mapped to one role a guided-tour step can play
 * (see `openspec/changes/onboarding-mascot-guide`):
 *
 * | pose       | tour role                                   |
 * |------------|---------------------------------------------|
 * | `greeting` | welcome / opening step (waving hello)       |
 * | `explain`  | explain a concept (holding a tablet)        |
 * | `point`    | spotlight one control ("tap this")          |
 * | `cheer`    | completion / celebration (arms up)          |
 */
export type MascotPose = "greeting" | "explain" | "point" | "cheer"

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PLACEHOLDER ART — swappable in ONE place.
 * ─────────────────────────────────────────────────────────────────────────────
 * The real FTES mascot (husky + glasses + FTES polo) is not yet exported as
 * artwork. Until then every pose is a simple, self-contained inline husky SVG so
 * the tour engine, coach-marks and helper FAB can be built and reviewed against
 * four visually-distinct poses.
 *
 * TODO(mascot-art): when the real assets land, replace the four entries in
 * {@link MASCOT_ART} with the production artwork — e.g.
 *   greeting: <img src="/mascot/greeting.webp" alt="" width="100%" height="100%" />
 * Nothing else needs to change: {@link FtesMascot} only reads this record, so art
 * lives here and here ONLY (no hardcoded mascot markup anywhere else).
 *
 * Each entry is a full `<svg>` sized to 100% of its box; {@link FtesMascot} owns
 * the pixel dimensions. The polo uses `var(--accent)` so the mascot tracks the
 * brand accent; the fur/face/ink colours are illustration constants (they read
 * the same in light and dark).
 */

/** Husky fur (cool grey). */
const FUR = "#9AA4B2"
/** Face mask / paws highlight. */
const FACE = "#F4F6FA"
/** Ink for glasses, eyes, nose, outlines. */
const INK = "#2B2F3A"

/**
 * Shared husky base: ears, head, face mask, glasses, snout and the FTES polo
 * torso. Arms/props are layered per pose on top of (or in front of) this. Drawn
 * inside a `0 0 100 120` viewBox.
 */
const HuskyBase = () => (
    <>
        {/* ears */}
        <path d="M28 30 L26 6 L46 22 Z" fill={FUR} />
        <path d="M72 30 L74 6 L54 22 Z" fill={FUR} />
        <path d="M31 26 L30 13 L41 22 Z" fill={FACE} opacity={0.9} />
        <path d="M69 26 L70 13 L59 22 Z" fill={FACE} opacity={0.9} />
        {/* head */}
        <ellipse cx={50} cy={42} rx={27} ry={26} fill={FUR} />
        {/* white face mask */}
        <path
            d="M50 22 C40 22 33 30 33 44 C33 58 41 66 50 66 C59 66 67 58 67 44 C67 30 60 22 50 22 Z"
            fill={FACE}
        />
        {/* glasses */}
        <circle cx={41} cy={43} r={8.5} fill="#FFFFFF" stroke={INK} strokeWidth={2.4} />
        <circle cx={59} cy={43} r={8.5} fill="#FFFFFF" stroke={INK} strokeWidth={2.4} />
        <path d="M49.5 43 H50.5" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
        {/* eyes behind glasses */}
        <circle cx={41} cy={43} r={2.7} fill={INK} />
        <circle cx={59} cy={43} r={2.7} fill={INK} />
        {/* snout + nose */}
        <ellipse cx={50} cy={57} rx={7} ry={5} fill={FACE} />
        <ellipse cx={50} cy={54} rx={3} ry={2.2} fill={INK} />
        {/* FTES polo torso */}
        <path
            d="M32 78 C32 72 38 70 50 70 C62 70 68 72 68 78 L68 112 C68 116 65 118 61 118 L39 118 C35 118 32 116 32 112 Z"
            fill="var(--accent)"
        />
        {/* polo collar */}
        <path d="M44 70 L50 78 L56 70 Z" fill="#FFFFFF" />
        {/* placket dot (stands in for the FTES emblem) */}
        <circle cx={50} cy={90} r={2.2} fill="#FFFFFF" opacity={0.85} />
    </>
)

/** One rounded fur limb between two points. */
const Arm = ({ d }: { d: string }) => (
    <path d={d} fill="none" stroke={FUR} strokeWidth={9} strokeLinecap="round" />
)

/** A fur paw. */
const Paw = ({ cx, cy }: { cx: number; cy: number }) => (
    <circle cx={cx} cy={cy} r={5.5} fill={FUR} />
)

const svgProps = {
    viewBox: "0 0 100 120",
    width: "100%",
    height: "100%",
    preserveAspectRatio: "xMidYMid meet",
    xmlns: "http://www.w3.org/2000/svg",
} as const

/**
 * Placeholder pose → artwork map. Swap these four nodes for the real assets when
 * they land (see the module header). Poses are drawn back-to-front: arms behind
 * the torso appear before {@link HuskyBase}, arms/props in front appear after.
 */
export const MASCOT_ART: Record<MascotPose, React.ReactElement> = {
    // GREETING — right arm raised in a wave; left arm resting.
    greeting: (
        <svg {...svgProps}>
            <Arm d="M66 84 Q74 74 78 58" />
            <HuskyBase />
            <Arm d="M34 84 Q30 96 33 106" />
            <Paw cx={80} cy={54} />
            {/* wave marks */}
            <path d="M86 48 q4 -3 4 -8" fill="none" stroke={FUR} strokeWidth={2.2} strokeLinecap="round" opacity={0.7} />
            <path d="M88 56 q5 -2 7 -7" fill="none" stroke={FUR} strokeWidth={2.2} strokeLinecap="round" opacity={0.5} />
        </svg>
    ),
    // EXPLAIN — both paws holding a tablet in front of the torso.
    explain: (
        <svg {...svgProps}>
            <HuskyBase />
            <Arm d="M35 84 Q34 94 40 99" />
            <Arm d="M65 84 Q66 94 60 99" />
            {/* tablet */}
            <rect x={37} y={88} width={26} height={20} rx={3} fill={INK} />
            <rect x={39.5} y={90.5} width={21} height={15} rx={1.5} fill="#FFFFFF" />
            <path d="M42 94 H58 M42 98 H55 M42 102 H57" stroke="var(--accent)" strokeWidth={1.6} strokeLinecap="round" />
            <Paw cx={38} cy={100} />
            <Paw cx={62} cy={100} />
        </svg>
    ),
    // POINT — right arm extended to the side, pointing.
    point: (
        <svg {...svgProps}>
            <HuskyBase />
            <Arm d="M34 84 Q30 96 33 106" />
            <Arm d="M66 82 Q80 80 90 74" />
            <Paw cx={92} cy={73} />
            {/* index accent + spotlight target */}
            <path d="M96 73 h6" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
            <circle cx={92} cy={73} r={11} fill="none" stroke="var(--accent)" strokeWidth={2} opacity={0.55} />
        </svg>
    ),
    // CHEER — both arms up in a V, open happy mouth.
    cheer: (
        <svg {...svgProps}>
            <Arm d="M35 82 Q26 66 22 50" />
            <Arm d="M65 82 Q74 66 78 50" />
            <HuskyBase />
            {/* open happy mouth over the snout */}
            <path d="M45 58 Q50 64 55 58" fill={INK} />
            <Paw cx={21} cy={47} />
            <Paw cx={79} cy={47} />
            {/* celebration sparkles */}
            <path d="M18 34 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5 l4 -1.5 Z" fill="var(--accent)" opacity={0.8} />
            <path d="M84 32 l1.2 3 l3 1.2 l-3 1.2 l-1.2 3 l-1.2 -3 l-3 -1.2 l3 -1.2 Z" fill="var(--accent)" opacity={0.6} />
        </svg>
    ),
}
