import type {
    AuthenticationModalTab,
} from "@/redux/slices/tabs"

/**
 * One auth call-to-action button shown to signed-out users in the dropdown
 * (e.g. "Sign in" / "Sign up").
 */
export interface AccountActionItem {
    /** Stable React key + identity for the action. */
    key: string
    /** Already-translated button label. */
    label: string
    /** HeroUI button variant for visual emphasis. */
    variant: "primary" | "tertiary"
    /** Tab to open in the authentication modal when pressed. */
    tab: AuthenticationModalTab
}
