import { PricingPhase } from "@/modules/types/enums/pricing-phase"

/** i18n key for each pricing phase's display name. Shared by the rail + rows. */
export const PHASE_LABEL_KEY: Record<PricingPhase, string> = {
    [PricingPhase.Pioneer]: "courseLanding.phase.pioneer",
    [PricingPhase.EarlyBird]: "courseLanding.phase.earlyBird",
    [PricingPhase.Regular]: "courseLanding.phase.regular",
}
