import React from "react"
import { AuthenticationModal } from "./AuthenticationModal"
import { LanguageModal } from "./LanguageModal"
import { CookieConsentModal } from "./CookieConsentModal"
import { CommunityComposerModal } from "./CommunityComposerModal"
import { PaymentModal } from "./PaymentModal"
import { SearchOverlay } from "@/components/features/search/SearchOverlay"

/** Global modal mount point — feature modals stripped for the skeleton; add new ones here. */
export const ModalContainer = () => {
    return (
        <>
            <AuthenticationModal />
            <LanguageModal />
            <CookieConsentModal />
            <CommunityComposerModal />
            <PaymentModal />
            <SearchOverlay />
        </>
    )
}
