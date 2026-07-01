import { useEffect } from "react"
import { initializeFingerprint } from "@/modules/api/fingerprint"

/**
 * Hook to trigger FingerprintJS initialization on app mount.
 */
export const useInitializeFingerprint = () => {
    useEffect(() => {
        void initializeFingerprint()
    }, [])
}
