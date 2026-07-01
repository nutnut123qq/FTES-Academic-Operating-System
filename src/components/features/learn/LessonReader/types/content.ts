import type {
    ReactNode,
} from "react"
import type { ContentTab } from "@/redux/slices/tabs"

/**
 * One entry in the {@link LessonReader} tab bar: which redux {@link ContentTab} it
 * maps to, the i18n label shown on the trigger, and the body rendered when the
 * tab is active.
 */
export interface ContentTabItem {
    /** Redux tab key this entry selects. */
    key: ContentTab
    /** Translated label rendered on the tab trigger. */
    label: string
    /** Body component rendered when this tab is active. */
    component: ReactNode
    /**
     * When true the tab is a locked premium feature: rendered muted and, on
     * click, opens the register modal instead of switching to its body.
     */
    locked?: boolean
}
