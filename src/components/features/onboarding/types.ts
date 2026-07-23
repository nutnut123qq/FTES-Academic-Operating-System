import type { MascotPose } from "@/components/reuseable/FtesMascot"

/**
 * The role a single tour step plays. It selects both the mascot pose (via
 * {@link INTENT_POSE}) and the coach-mark layout (centered welcome/celebration
 * vs. a spotlight anchored to a target):
 *
 * | intent      | pose       | layout                                  |
 * |-------------|------------|-----------------------------------------|
 * | `welcome`   | `greeting` | centered card, no spotlight (opening)   |
 * | `explain`   | `explain`  | spotlight on target, explain a feature  |
 * | `point`     | `point`    | spotlight on target, "this button here" |
 * | `celebrate` | `cheer`    | centered card, no spotlight (finish)    |
 */
export type StepIntent = "welcome" | "explain" | "point" | "celebrate"

/** Coach-mark placement relative to the spotlighted target. */
export type StepPlacement = "auto" | "top" | "bottom"

/**
 * One declarative step of a guided tour. A step aims at a real element through a
 * STABLE `data-tour="<target>"` attribute (never a CSS class), so refactors that
 * change markup/classes do not break the tour. Steps with no `target` render a
 * centered card (welcome / celebration).
 *
 * All copy is referenced by i18n key (never inline text) so every string is
 * translated in vi + en.
 */
export interface TourStep {
    /** Stable id (used as the React key + resume marker). */
    id: string
    /**
     * Value of the `data-tour` attribute on the element to spotlight. Omit for a
     * centered, targetless step. If the element is missing (or not visible) after
     * ~1.5s the engine skips the step rather than getting stuck — see
     * {@link import("./TourProvider").TourProvider}.
     */
    target?: string
    /** Step role → mascot pose + layout. */
    intent: StepIntent
    /** i18n key for the bold lead line. */
    titleKey: string
    /** i18n key for the body copy. */
    bodyKey: string
    /** Preferred coach-mark side; `auto` (default) flips to stay on-screen. */
    placement?: StepPlacement
}

/** A named, ordered sequence of {@link TourStep}s. */
export interface Tour {
    /** Stable tour id — also the localStorage namespace root. */
    id: string
    /** Ordered steps. */
    steps: ReadonlyArray<TourStep>
}

/** Maps a step {@link StepIntent} to the mascot pose it shows. */
export const INTENT_POSE: Record<StepIntent, MascotPose> = {
    welcome: "greeting",
    explain: "explain",
    point: "point",
    celebrate: "cheer",
}
