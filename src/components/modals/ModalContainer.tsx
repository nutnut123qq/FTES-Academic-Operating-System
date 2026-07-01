import React from "react"
// import { AIProcessingModal } from "./AIProcessingModal"
import { AuthenticationModal } from "./AuthenticationModal"
import { ContentModal } from "./ContentModal"
import { LivestreamCalendarModal } from "./LivestreamCalendarModal"
import { LessonVideoModal } from "./LessonVideoModal"
import { PaymentModal } from "./PaymentModal"
import { LanguageModal } from "./LanguageModal"
import { FeedbackDetailsModal } from "./FeedbackDetailsModal"
import { CvPreviewModal } from "./CvPreviewModal"
import { CvReviewLevelDetailsModal } from "./CvReviewLevelDetailsModal"
import { CvUpdateModal } from "./CvUpdateModal"
import { GlobalSearchModal } from "./GlobalSearchModal"
import { LinkGithubModal } from "./LinkGithubModal"
import { ShareModal } from "./ShareModal"
import { FoundationModal } from "./FoundationModal"
import { HeadhunterModal } from "./HeadhunterModal"
import { AiQuotaModal } from "./AiQuotaModal"
import { PremiumGateModal } from "./PremiumGateModal"
import { AdModal } from "./AdModal"
import { ManagePinnedProjectsModal } from "./ManagePinnedProjectsModal"
import { FollowListModal } from "./FollowListModal"
import { CookieConsentModal } from "./CookieConsentModal"

export const ModalContainer = () => {
    return (
        <>
            <AuthenticationModal />
            <PaymentModal />
            <ContentModal />
            <LivestreamCalendarModal />
            <LessonVideoModal />
            <LanguageModal />
            <FeedbackDetailsModal />
            <CvPreviewModal />
            <CvReviewLevelDetailsModal />
            <CvUpdateModal />
            <GlobalSearchModal />
            <LinkGithubModal />
            <ShareModal />
            <FoundationModal />
            <HeadhunterModal />
            <AiQuotaModal />
            <PremiumGateModal />
            <AdModal />
            <ManagePinnedProjectsModal />
            <FollowListModal />
            <CookieConsentModal />
            {/* <AIProcessingModal /> */}
        </>
    )
}