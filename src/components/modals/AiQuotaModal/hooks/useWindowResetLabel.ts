import {
    useCallback,
} from "react"
import {
    useTranslations,
} from "next-intl"
import dayjs from "dayjs"

/**
 * Formats API reset timestamps for quota window copy (`aiQuota.windowResetAt`).
 * @returns Callback that maps an ISO-ish value to a localized reset line, or `null`.
 */
export const useWindowResetLabel = () => {
    const t = useTranslations()

    return useCallback(
        (value: string | null | undefined) => {
            if (!value) {
                return null
            }
            const time = dayjs(value).format("HH:mm DD/MM")
            return t("aiQuota.windowResetAt", { time })
        },
        [t],
    )
}
