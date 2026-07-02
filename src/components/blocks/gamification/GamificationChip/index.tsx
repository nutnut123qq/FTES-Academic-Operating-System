import React from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link GamificationChip}. */
export interface GamificationChipProps extends WithClassNames<undefined> {
    /** Leading icon node (caller sets `aria-hidden` + `focusable="false"`). */
    icon: React.ReactNode
    /** Short display value (e.g. `7`, `#3`, `4.820`). */
    value: React.ReactNode
    /** Full accessible name describing metric + value (e.g. "Chuỗi ngày: 7 ngày"). */
    label: string
    /** When set the chip renders as a button and is keyboard-activatable. */
    onPress?: () => void
}

/**
 * Compact gamification stat pill (icon + value) shared by the account-menu
 * stats row and the profile identity card, so both surfaces stay visually and
 * numerically identical. Mirrors the `StreakChip` pill box (h-6) so
 * `Skeleton.Chip` matches its dimensions exactly.
 *
 * Pure block: all content arrives via props. With {@link GamificationChipProps.onPress}
 * it renders a `<button>` carrying the accessible label; without it, a static
 * `<span>` with the label exposed to screen readers.
 *
 * @param props - {@link GamificationChipProps}
 */
export const GamificationChip = ({ icon, value, label, onPress, className }: GamificationChipProps) => {
    const pill = cn(
        "inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent",
        onPress && "cursor-pointer transition-colors hover:bg-accent/20",
        className,
    )
    if (onPress) {
        return (
            <button type="button" aria-label={label} title={label} className={pill} onClick={onPress}>
                {icon}
                {value}
            </button>
        )
    }
    return (
        <span title={label} className={pill}>
            {icon}
            {value}
            <span className="sr-only">{label}</span>
        </span>
    )
}
