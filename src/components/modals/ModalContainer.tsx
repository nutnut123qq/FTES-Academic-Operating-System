import React from "react"
import { AuthenticationModal } from "./AuthenticationModal"
import { LanguageModal } from "./LanguageModal"
import { CookieConsentModal } from "./CookieConsentModal"
import dynamic from "next/dynamic"
import { PaymentModal } from "./PaymentModal"
import { SessionRevokeModal } from "./SessionRevokeModal"
import { ForcedSetPasswordModal } from "./ForcedSetPasswordModal"
import { SearchOverlay } from "@/components/features/search/SearchOverlay"


/**
 * Ô soạn bài cộng đồng nạp THEO YÊU CẦU.
 *
 * <p><b>Vì sao phải tách.</b> {@link ModalContainer} được gắn trong `InnerLayout`, tức có mặt ở
 * MỌI trang. Nó import tĩnh modal này, modal kéo `CommunityComposerForm`, form kéo
 * `RichTextEditor` — và thế là toàn bộ TipTap/ProseMirror đi theo. Đã đo trên production: chunk
 * TipTap **204 KB** nằm trong lần tải ĐẦU của trang chủ, một trang không có lấy một ô soạn thảo.
 *
 * <p>`ssr: false` là đúng chứ không phải cho tiện: đây là overlay chỉ mở khi người dùng bấm, nội
 * dung của nó không nằm trong HTML đầu tiên và cũng không nên nằm ở đó.
 */
/**
 * Xem ảnh bài cộng đồng — cũng nạp theo yêu cầu, và vì CÙNG một lý do.
 *
 * <p>Đường đi dài hơn nên dễ sót: modal này kéo `CommunityPostContent`, cái đó kéo
 * `PostCommentThread`, và thread kéo `RichCommentEditor` — lại TipTap. Tách mỗi ô soạn bài mà bỏ
 * quên đường này thì TipTap vẫn nằm nguyên trong lần tải đầu của MỌI trang, và số đo sẽ không
 * nhúc nhích một byte.
 */
const CommunityPhotoLightboxModal = dynamic(
    () => import("./CommunityPhotoLightboxModal").then((m) => m.CommunityPhotoLightboxModal),
    { ssr: false },
)

const CommunityComposerModal = dynamic(
    () => import("./CommunityComposerModal").then((m) => m.CommunityComposerModal),
    { ssr: false },
)

/** Global modal mount point — feature modals stripped for the skeleton; add new ones here. */
export const ModalContainer = () => {
    return (
        <>
            <AuthenticationModal />
            <LanguageModal />
            <CookieConsentModal />
            <CommunityComposerModal />
            <CommunityPhotoLightboxModal />
            <PaymentModal />
            <SessionRevokeModal />
            <ForcedSetPasswordModal />
            <SearchOverlay />
        </>
    )
}
