import type { IconComponent } from "@/types"
import { CircleCheck as CheckCircleIcon, CircleXmark as XCircleIcon, Stopwatch as HourglassIcon } from "@gravity-ui/icons"
import { AiBalancerKeyStatus } from "@/modules/api/graphql/queries/enums/ai-balancer-key-status"

/** Visual token for one balancer key status badge. */
export interface AiBalancerKeyStatusVisual {
    /** Tailwind classes for the status chip. */
    chipClassName: string
    /** Icon component reference. */
    Icon: IconComponent
}

/**
 * Status chip styles for dark admin surfaces.
 */
export const AI_BALANCER_KEY_STATUS_DARK_MAP: Record<string, AiBalancerKeyStatusVisual> = {
    [AiBalancerKeyStatus.Active]: {
        chipClassName: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        Icon: CheckCircleIcon,
    },
    [AiBalancerKeyStatus.Disabled]: {
        chipClassName: "bg-rose-500/15 text-rose-300 border-rose-500/30",
        Icon: XCircleIcon,
    },
    [AiBalancerKeyStatus.Probing]: {
        chipClassName: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        Icon: HourglassIcon,
    },
}

/**
 * Status chip styles for light learn surfaces (FTES AOS AI page).
 */
export const AI_BALANCER_KEY_STATUS_LIGHT_MAP: Record<string, AiBalancerKeyStatusVisual> = {
    [AiBalancerKeyStatus.Active]: {
        chipClassName: "bg-emerald-100 text-emerald-800 border-emerald-200",
        Icon: CheckCircleIcon,
    },
    [AiBalancerKeyStatus.Disabled]: {
        chipClassName: "bg-rose-100 text-rose-800 border-rose-200",
        Icon: XCircleIcon,
    },
    [AiBalancerKeyStatus.Probing]: {
        chipClassName: "bg-amber-100 text-amber-800 border-amber-200",
        Icon: HourglassIcon,
    },
}
