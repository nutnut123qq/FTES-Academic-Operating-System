import FingerprintJS from "@fingerprintjs/fingerprintjs"
import axios from "axios"

let cachedFingerprint: string | null = null

/**
 * Initializes and retrieves the device fingerprint, caching it in memory
 * and setting it as a default header on global axios defaults.
 */
export const initializeFingerprint = async (): Promise<string | null> => {
    if (typeof window === "undefined") return null
    if (cachedFingerprint) return cachedFingerprint

    try {
        const fp = await FingerprintJS.load()
        const result = await fp.get()
        cachedFingerprint = result.visitorId
        
        // set on axios defaults so custom instances created via axios.create() inherit it
        if (axios.defaults.headers) {
            axios.defaults.headers.common["x-device-fingerprint"] = cachedFingerprint
        }
        
        return cachedFingerprint
    } catch (error) {
        console.error("[Fingerprint] Failed to initialize device fingerprint", error)
        return null
    }
}

/**
 * Synchronously retrieves the cached fingerprint.
 */
export const getCachedFingerprint = (): string | null => {
    return cachedFingerprint
}
