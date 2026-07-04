/**
 * Privacy Policy — structured content rendered natively by {@link import("../LegalPage").LegalPage}
 * with Typography (NO markdown). Real FTES copy (Công ty TNHH Giải pháp Công nghệ Giáo dục FTES —
 * dịch vụ AI-Learning). Provided as the published policy — have a lawyer review before relying on it.
 */

import type {
    LegalDocument,
} from "./types"

/** "Last updated" date shown in the page header (ISO; display formatted by the page). */
export const PRIVACY_LAST_UPDATED = "2026-07-04"

const vi: LegalDocument = {
    intro: "AI-Learning FTES cam kết bảo vệ thông tin cá nhân của bạn một cách tốt nhất. Chính sách này mô tả cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin của bạn khi sử dụng dịch vụ.",
    sections: [
        {
            heading: "1. Phạm vi áp dụng",
            paragraphs: [
                "Chính sách này áp dụng cho tất cả học viên, khách hàng và người dùng truy cập vào dịch vụ AI-Learning trên trang web ftes.vn hoặc các kênh trực tuyến khác do FTES quản lý.",
            ],
        },
        {
            heading: "2. Thông tin thu thập",
            paragraphs: [
                "FTES có thể thu thập các loại thông tin sau:",
            ],
            cards: [
                { icon: "person", label: "Thông tin cá nhân", text: "Họ tên, ngày sinh, địa chỉ email, số điện thoại, địa chỉ liên hệ, thông tin tài khoản đăng nhập, thông tin thanh toán." },
                { icon: "learning", label: "Thông tin học tập", text: "Khóa học đã đăng ký, tiến độ học, kết quả kiểm tra, phản hồi và đánh giá của học viên." },
                { icon: "technical", label: "Thông tin kỹ thuật", text: "Địa chỉ IP, loại trình duyệt, thiết bị sử dụng, cookie và dữ liệu nhật ký truy cập." },
                { icon: "other", label: "Thông tin khác", text: "Bất kỳ dữ liệu nào bạn tự nguyện cung cấp cho FTES trong quá trình trao đổi, hỗ trợ hoặc khảo sát." },
            ],
        },
        {
            heading: "3. Mục đích sử dụng thông tin",
            paragraphs: [
                "Thông tin của bạn có thể được FTES sử dụng để:",
            ],
            steps: [
                "Cung cấp và duy trì dịch vụ AI-Learning.",
                "Quản lý tài khoản, xác minh danh tính và xử lý thanh toán.",
                "Cải thiện chất lượng khóa học, tối ưu trải nghiệm học tập.",
                "Gửi thông báo, bản tin, khuyến mãi hoặc thông tin liên quan đến dịch vụ.",
                "Hỗ trợ kỹ thuật, xử lý khiếu nại và giải quyết tranh chấp.",
                "Tuân thủ yêu cầu pháp luật và nghĩa vụ báo cáo.",
            ],
        },
        {
            heading: "4. Chia sẻ thông tin",
            callout: {
                tone: "accent",
                title: "Cam kết bảo mật",
                text: "FTES cam kết không bán, trao đổi hoặc chia sẻ thông tin cá nhân của học viên cho bên thứ ba vì mục đích thương mại.",
            },
            subsections: [
                {
                    heading: "Các trường hợp ngoại lệ",
                    items: [
                        { text: "Có sự đồng ý của học viên." },
                        { text: "Yêu cầu bởi cơ quan nhà nước có thẩm quyền theo quy định pháp luật." },
                        { text: "Chia sẻ với đối tác, nhà cung cấp dịch vụ liên quan để vận hành dịch vụ, nhưng phải đảm bảo họ tuân thủ chính sách bảo mật tương đương." },
                    ],
                },
            ],
        },
        {
            heading: "5. Bảo mật thông tin",
            subsections: [
                {
                    heading: "Trách nhiệm của FTES",
                    paragraphs: [
                        "FTES áp dụng các biện pháp kỹ thuật và quản lý phù hợp để bảo vệ thông tin cá nhân khỏi truy cập trái phép, mất mát hoặc tiết lộ.",
                    ],
                },
                {
                    heading: "Trách nhiệm của học viên",
                    paragraphs: [
                        "Học viên có trách nhiệm bảo mật thông tin tài khoản (tên đăng nhập, mật khẩu) và thông báo ngay cho FTES nếu phát hiện sử dụng trái phép.",
                    ],
                },
            ],
        },
        {
            heading: "6. Lưu trữ và thời gian bảo quản dữ liệu",
            callout: {
                tone: "accent",
                title: "Thời gian lưu trữ",
                text: "Thông tin cá nhân sẽ được lưu trữ trong suốt thời gian học viên có tài khoản tại FTES và trong vòng 03 năm kể từ khi tài khoản bị hủy (trừ khi pháp luật yêu cầu thời gian lưu trữ dài hơn).",
            },
        },
        {
            heading: "7. Quyền của học viên",
            paragraphs: [
                "Học viên có quyền:",
            ],
            cards: [
                { icon: "edit", label: "Xem & chỉnh sửa", text: "Yêu cầu xem, chỉnh sửa hoặc xóa thông tin cá nhân." },
                { icon: "no-marketing", label: "Từ chối marketing", text: "Từ chối nhận các thông tin tiếp thị." },
                { icon: "explain", label: "Giải thích", text: "Yêu cầu giải thích về cách FTES xử lý dữ liệu của mình." },
            ],
        },
        {
            heading: "8. Thay đổi chính sách",
            paragraphs: [
                "FTES có quyền sửa đổi, bổ sung chính sách này bất kỳ lúc nào. Các thay đổi sẽ được công bố trên trang web ftes.vn và có hiệu lực kể từ ngày đăng tải.",
            ],
        },
        {
            heading: "Thông tin liên hệ",
            contact: {
                company: "Công ty TNHH Giải pháp Công nghệ Giáo dục FTES",
                address: "Tổ dân phố Tân Hoà, Phường An Bình, Tỉnh Gia Lai.",
                phone: "0326 359 014 (Mr. Khoa)",
            },
            paragraphs: [
                "Nếu bạn có câu hỏi về Chính sách Bảo mật AI-Learning FTES, vui lòng truy cập vào mục liên hệ để được giải đáp nhanh nhất.",
            ],
        },
    ],
}

const en: LegalDocument = {
    intro: "AI-Learning FTES is committed to protecting your personal information as best we can. This policy describes how we collect, use, store, and protect your information when you use the service.",
    sections: [
        {
            heading: "1. Scope",
            paragraphs: [
                "This policy applies to all learners, customers, and users who access the AI-Learning service on the ftes.vn website or other online channels managed by FTES.",
            ],
        },
        {
            heading: "2. Information collected",
            paragraphs: [
                "FTES may collect the following types of information:",
            ],
            cards: [
                { icon: "person", label: "Personal information", text: "Full name, date of birth, email address, phone number, contact address, login account details, payment details." },
                { icon: "learning", label: "Learning information", text: "Registered courses, learning progress, test results, learner feedback and reviews." },
                { icon: "technical", label: "Technical information", text: "IP address, browser type, device used, cookies, and access log data." },
                { icon: "other", label: "Other information", text: "Any data you voluntarily provide to FTES during exchanges, support, or surveys." },
            ],
        },
        {
            heading: "3. Purposes of use",
            paragraphs: [
                "Your information may be used by FTES to:",
            ],
            steps: [
                "Provide and maintain the AI-Learning service.",
                "Manage accounts, verify identity, and process payments.",
                "Improve course quality and optimize the learning experience.",
                "Send notifications, newsletters, promotions, or service-related information.",
                "Provide technical support, handle complaints, and resolve disputes.",
                "Comply with legal requirements and reporting obligations.",
            ],
        },
        {
            heading: "4. Information sharing",
            callout: {
                tone: "accent",
                title: "Privacy commitment",
                text: "FTES commits not to sell, trade, or share learners' personal information with third parties for commercial purposes.",
            },
            subsections: [
                {
                    heading: "Exceptions",
                    items: [
                        { text: "With the learner's consent." },
                        { text: "When required by a competent state authority under the law." },
                        { text: "Sharing with partners and related service providers to operate the service, but ensuring they comply with an equivalent privacy policy." },
                    ],
                },
            ],
        },
        {
            heading: "5. Information security",
            subsections: [
                {
                    heading: "FTES's responsibility",
                    paragraphs: [
                        "FTES applies appropriate technical and managerial measures to protect personal information from unauthorized access, loss, or disclosure.",
                    ],
                },
                {
                    heading: "Learner's responsibility",
                    paragraphs: [
                        "Learners are responsible for keeping their account information (username, password) secure and notifying FTES immediately if unauthorized use is detected.",
                    ],
                },
            ],
        },
        {
            heading: "6. Data storage and retention period",
            callout: {
                tone: "accent",
                title: "Retention period",
                text: "Personal information is stored for the entire time the learner has an account with FTES and for 03 years after the account is closed (unless the law requires a longer retention period).",
            },
        },
        {
            heading: "7. Learner rights",
            paragraphs: [
                "Learners have the right to:",
            ],
            cards: [
                { icon: "edit", label: "View & edit", text: "Request to view, edit, or delete personal information." },
                { icon: "no-marketing", label: "Opt out of marketing", text: "Decline to receive marketing information." },
                { icon: "explain", label: "Explanation", text: "Request an explanation of how FTES processes their data." },
            ],
        },
        {
            heading: "8. Policy changes",
            paragraphs: [
                "FTES has the right to amend and supplement this policy at any time. Changes will be published on the ftes.vn website and take effect from the date of posting.",
            ],
        },
        {
            heading: "Contact information",
            contact: {
                company: "FTES Education Technology Solutions Co., Ltd",
                address: "Tan Hoa residential group, An Binh Ward, Gia Lai Province.",
                phone: "0326 359 014 (Mr. Khoa)",
            },
            paragraphs: [
                "If you have questions about the FTES AI-Learning Privacy Policy, please visit the contact section for the fastest response.",
            ],
        },
    ],
}

/** Privacy Policy per locale. */
export const PRIVACY_POLICY: Record<string, LegalDocument> = { vi, en }
