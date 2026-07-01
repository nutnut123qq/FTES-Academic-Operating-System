import { ApolloLink } from "@apollo/client"
import { getCachedFingerprint } from "../../../fingerprint"

const FINGERPRINT_HEADER_NAME = "x-device-fingerprint"

/**
 * Apollo link that attaches the `x-device-fingerprint` header from the preloaded
 * FingerprintJS visitorId.
 */
export const createAttachDeviceFingerprintLink = (debug = false) =>
    new ApolloLink((operation, forward) => {
        const fingerprint = getCachedFingerprint()
        if (fingerprint) {
            operation.setContext(({ headers = {} }) => ({
                headers: {
                    ...headers,
                    [FINGERPRINT_HEADER_NAME]: fingerprint,
                },
            }))
        }
        if (debug) {
            console.log(
                `[AttachDeviceFingerprintLink] op=${operation.operationName} fingerprint=${fingerprint || "(none)"}`
            )
        }
        return forward(operation)
    })
