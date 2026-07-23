import React from "react"

/**
 * The four poses of **FrosTES** — the official FTES mascot (a pastel husky with
 * blue glasses, white FTES polo and denim shorts) — each mapped to one role a
 * guided-tour / moment surface can play (see
 * `openspec/changes/onboarding-mascot-guide` + `openspec/changes/mascot-moments`):
 *
 * | pose       | role                                        | art               |
 * |------------|---------------------------------------------|-------------------|
 * | `greeting` | welcome / opening (waving hello)            | greeting.webp     |
 * | `explain`  | explain a concept (holding a tablet)        | explain.webp      |
 * | `point`    | spotlight one control ("tap this")          | point.webp        |
 * | `cheer`    | completion / celebration (arms up)          | cheer.webp        |
 */
export type MascotPose = "greeting" | "explain" | "point" | "cheer"

/**
 * Pose → artwork. The production FrosTES assets live in `public/mascot/*.webp`
 * (optimised from the source artboards) and are referenced ONLY here — swap a
 * file in that folder (same name) to re-skin every tour step + moment surface at
 * once. {@link import("./FtesMascot").FtesMascot} owns the box dimensions; each
 * image fills it with `object-contain` (no distortion across poses).
 */
export const MASCOT_ART: Record<MascotPose, React.ReactElement> = {
    greeting: (
        <img src="/mascot/greeting.webp" alt="" aria-hidden draggable={false} className="size-full object-contain" />
    ),
    explain: (
        <img src="/mascot/explain.webp" alt="" aria-hidden draggable={false} className="size-full object-contain" />
    ),
    point: (
        <img src="/mascot/point.webp" alt="" aria-hidden draggable={false} className="size-full object-contain" />
    ),
    cheer: (
        <img src="/mascot/cheer.webp" alt="" aria-hidden draggable={false} className="size-full object-contain" />
    ),
}
