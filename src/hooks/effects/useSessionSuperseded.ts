import { useEffect } from "react"
import { toast } from "@heroui/react"
import { useTranslations } from "next-intl"

/**
 * Checks if a session superseded redirect flag is set in sessionStorage.
 * If found, displays a warning toast to the user and clears the flag.
 */
export const useSessionSuperseded = () => {
    const t = useTranslations()

    useEffect(() => {
        if (typeof window === "undefined") return

        try {
            const hasBeenSuperseded = sessionStorage.getItem("superseded_toast")
            if (hasBeenSuperseded === "true") {
                toast.danger(t("auth.sessionSuperseded"), {
                    timeout: 5000,
                })
                sessionStorage.removeItem("superseded_toast")
            }
        } catch (e) {
            // ignore storage errors
        }
    }, [t])
}
