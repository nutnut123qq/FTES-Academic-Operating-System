/**
 * Privacy Policy — structured content rendered natively by {@link import("../LegalPage").LegalPage}
 * with Typography (NO markdown). Grounded in what StarCi Academy actually collects/processes (auth,
 * learning, payment via gateways, GitHub link + encrypted token, cookies/GA, self-hosted + cloud AI
 * grading) and aligned with Vietnam's Decree 13/2023/ND-CP (PDPD). Provided as a starting template —
 * have a lawyer review before relying on it.
 */

import type {
    LegalDocument,
} from "./types"

/** "Last updated" date shown in the page header (ISO; display formatted by the page). */
export const PRIVACY_LAST_UPDATED = "2026-06-21"

const vi: LegalDocument = {
    intro: "StarCi Academy (\"StarCi\", \"chúng tôi\") tôn trọng quyền riêng tư của bạn. Chính sách này mô tả cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu cá nhân khi bạn dùng nền tảng tại academy.starci.org, tuân theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.",
    sections: [
        {
            heading: "1. Dữ liệu chúng tôi thu thập",
            items: [
                { label: "Thông tin tài khoản:", text: "email, tên hiển thị, tên người dùng, ảnh đại diện — khi bạn đăng ký hoặc đăng nhập qua Google / GitHub." },
                { label: "Dữ liệu học tập:", text: "tiến độ khóa học, bài nộp challenge và điểm, lịch sử ôn tập (flashcard), hồ sơ của bạn (giới thiệu, liên kết, dự án ghim), CV bạn tải lên để nhận xét." },
                { label: "Dữ liệu thanh toán:", text: "giao dịch mua khóa học hoặc gói, được xử lý bởi cổng thanh toán (PayOS, Sepay cho VND; Stripe, PayPal, NOWPayments cho quốc tế). Chúng tôi không lưu số thẻ của bạn — chỉ lưu bản ghi giao dịch (mã, số tiền, trạng thái)." },
                { label: "Tài khoản GitHub:", text: "tên người dùng GitHub khi bạn liên kết. Nếu bạn nộp một repository riêng tư để AI chấm, access token do bạn cấp được mã hóa khi lưu, chỉ dùng tạm thời để clone repo và không bao giờ hiển thị lại." },
                { label: "Dữ liệu kỹ thuật:", text: "địa chỉ IP, loại trình duyệt và thiết bị, cùng cookie (xem mục 5)." },
            ],
        },
        {
            heading: "2. Mục đích sử dụng",
            paragraphs: [
                "Chúng tôi xử lý dữ liệu để: cung cấp và vận hành dịch vụ học; chấm bài và đánh giá dự án bằng AI; xử lý thanh toán và quản lý gói; cá nhân hóa lộ trình học; cải thiện sản phẩm thông qua phân tích; bảo mật và phòng chống gian lận; và liên hệ hỗ trợ bạn.",
            ],
        },
        {
            heading: "3. Cơ sở xử lý",
            paragraphs: [
                "Chúng tôi xử lý dữ liệu dựa trên sự đồng ý của bạn và để thực hiện hợp đồng (cung cấp dịch vụ bạn đăng ký). Với cookie phân tích, chúng tôi chỉ thu thập sau khi bạn đồng ý.",
            ],
        },
        {
            heading: "4. Chia sẻ với bên thứ ba",
            paragraphs: [
                "Chúng tôi không bán dữ liệu cá nhân của bạn. Chúng tôi chỉ chia sẻ ở mức tối thiểu cần thiết với các bên giúp vận hành dịch vụ:",
            ],
            items: [
                { label: "Xác thực & đăng nhập:", text: "Keycloak, Google, GitHub." },
                { label: "Thanh toán:", text: "PayOS, Sepay, Stripe, PayPal, NOWPayments." },
                { label: "Phân tích:", text: "Google Analytics (chỉ khi bạn đồng ý)." },
                { label: "Chấm điểm AI:", text: "việc chấm chủ yếu chạy trên model tự host tại máy chủ của chúng tôi; khi cần, chúng tôi dùng thêm OpenAI hoặc Google (Gemini), khi đó nội dung bài nộp / repo được gửi tới các dịch vụ này để chấm." },
                { label: "Hạ tầng:", text: "dịch vụ máy chủ và lưu trữ vận hành nền tảng." },
            ],
        },
        {
            heading: "5. Cookie",
            paragraphs: [
                "Cookie cần thiết (đăng nhập, bảo mật, ghi nhớ ngôn ngữ) luôn bật để hệ thống hoạt động. Cookie phân tích (Google Analytics) chỉ bật khi bạn đồng ý qua banner cookie. Bạn có thể thay đổi lựa chọn bất cứ lúc nào.",
            ],
        },
        {
            heading: "6. Chuyển dữ liệu ra nước ngoài",
            paragraphs: [
                "Một số nhà cung cấp (Google Analytics, dịch vụ AI, một vài cổng thanh toán) xử lý dữ liệu ngoài lãnh thổ Việt Nam. Khi bạn dùng các dịch vụ này, dữ liệu liên quan có thể được chuyển và lưu trữ ở nước ngoài; chúng tôi chỉ chia sẻ mức tối thiểu cần thiết.",
            ],
        },
        {
            heading: "7. Lưu trữ",
            paragraphs: [
                "Chúng tôi giữ dữ liệu trong thời gian tài khoản của bạn còn hoạt động và theo yêu cầu pháp lý. Khi không còn cần thiết, dữ liệu được xóa hoặc ẩn danh.",
            ],
        },
        {
            heading: "8. Bảo mật",
            paragraphs: [
                "Token làm mới phiên đăng nhập lưu ở cookie HttpOnly; chúng tôi áp dụng cơ chế chống CSRF; các bí mật (token GitHub, khóa AI riêng của bạn) được mã hóa AES-256-GCM khi lưu. Mật khẩu do hệ thống xác thực quản lý — chúng tôi không nhìn thấy mật khẩu của bạn.",
            ],
        },
        {
            heading: "9. Quyền của bạn (theo Nghị định 13/2023)",
            paragraphs: [
                "Bạn có quyền: được biết về việc xử lý dữ liệu; đồng ý hoặc rút lại đồng ý; truy cập, xem và chỉnh sửa dữ liệu; yêu cầu xóa dữ liệu; hạn chế hoặc phản đối việc xử lý; và khiếu nại với cơ quan có thẩm quyền. Để thực hiện các quyền này, vui lòng liên hệ qua email ở mục 12.",
            ],
        },
        {
            heading: "10. Trẻ em",
            paragraphs: [
                "Nền tảng dành cho người từ 16 tuổi trở lên. Người dưới 16 tuổi cần sự đồng ý của cha mẹ hoặc người giám hộ theo Nghị định 13/2023.",
            ],
        },
        {
            heading: "11. Thay đổi chính sách",
            paragraphs: [
                "Chúng tôi có thể cập nhật chính sách này khi cần. Thay đổi quan trọng sẽ được thông báo, và ngày \"Cập nhật lần cuối\" ở đầu trang luôn phản ánh phiên bản hiện hành.",
            ],
        },
        {
            heading: "12. Liên hệ",
            paragraphs: [
                "Mọi câu hỏi về quyền riêng tư hoặc dữ liệu cá nhân, vui lòng liên hệ: cuongnvtse160875@gmail.com.",
            ],
        },
    ],
}

const en: LegalDocument = {
    intro: "StarCi Academy (\"StarCi\", \"we\") respects your privacy. This policy explains how we collect, use, store, and protect personal data when you use the platform at academy.starci.org, in line with Vietnam's Decree 13/2023/ND-CP on personal data protection.",
    sections: [
        {
            heading: "1. Data we collect",
            items: [
                { label: "Account information:", text: "email, display name, username, avatar — when you register or sign in with Google / GitHub." },
                { label: "Learning data:", text: "course progress, challenge submissions and scores, flashcard review history, your profile (bio, links, pinned projects), and any CV you upload for review." },
                { label: "Payment data:", text: "purchases of courses or plans, processed by payment gateways (PayOS, Sepay for VND; Stripe, PayPal, NOWPayments for international). We do not store your card numbers — only transaction records (id, amount, status)." },
                { label: "GitHub account:", text: "your GitHub username when you link it. If you submit a private repository for AI grading, an access token you provide is encrypted at rest, used only transiently to clone the repo, and never shown again." },
                { label: "Technical data:", text: "IP address, browser and device type, and cookies (see section 5)." },
            ],
        },
        {
            heading: "2. How we use it",
            paragraphs: [
                "We process data to: provide and operate the learning service; grade work and evaluate projects with AI; process payments and manage plans; personalize your learning path; improve the product through analytics; secure the service and prevent abuse; and contact you for support.",
            ],
        },
        {
            heading: "3. Legal basis",
            paragraphs: [
                "We process data based on your consent and to perform our contract (delivering the service you sign up for). For analytics cookies, we only collect after you consent.",
            ],
        },
        {
            heading: "4. Sharing with third parties",
            paragraphs: [
                "We do not sell your personal data. We share only the minimum necessary with providers that help run the service:",
            ],
            items: [
                { label: "Authentication & sign-in:", text: "Keycloak, Google, GitHub." },
                { label: "Payments:", text: "PayOS, Sepay, Stripe, PayPal, NOWPayments." },
                { label: "Analytics:", text: "Google Analytics (only with your consent)." },
                { label: "AI grading:", text: "grading runs primarily on a model self-hosted on our servers; when needed we also use OpenAI or Google (Gemini), in which case submission / repo content is sent to those services for grading." },
                { label: "Infrastructure:", text: "the server and storage services that run the platform." },
            ],
        },
        {
            heading: "5. Cookies",
            paragraphs: [
                "Necessary cookies (sign-in, security, language) are always on so the system works. Analytics cookies (Google Analytics) turn on only when you consent via the cookie banner. You can change your choice at any time.",
            ],
        },
        {
            heading: "6. International transfers",
            paragraphs: [
                "Some providers (Google Analytics, AI services, some payment gateways) process data outside Vietnam. When you use these services, related data may be transferred and stored abroad; we share only the minimum necessary.",
            ],
        },
        {
            heading: "7. Retention",
            paragraphs: [
                "We keep data for as long as your account is active and as required by law. When no longer needed, data is deleted or anonymized.",
            ],
        },
        {
            heading: "8. Security",
            paragraphs: [
                "Session refresh tokens are stored in an HttpOnly cookie; we apply CSRF protection; secrets (your GitHub token, your own AI keys) are encrypted with AES-256-GCM at rest. Passwords are managed by the authentication system — we never see your password.",
            ],
        },
        {
            heading: "9. Your rights (under Decree 13/2023)",
            paragraphs: [
                "You have the right to: be informed about processing; consent or withdraw consent; access, view, and correct your data; request deletion; restrict or object to processing; and lodge a complaint with the competent authority. To exercise these rights, contact us at the email in section 12.",
            ],
        },
        {
            heading: "10. Children",
            paragraphs: [
                "The platform is for people aged 16 and over. Those under 16 need the consent of a parent or guardian under Decree 13/2023.",
            ],
        },
        {
            heading: "11. Changes to this policy",
            paragraphs: [
                "We may update this policy when needed. Significant changes will be announced, and the \"Last updated\" date at the top always reflects the current version.",
            ],
        },
        {
            heading: "12. Contact",
            paragraphs: [
                "For any question about privacy or personal data, contact: cuongnvtse160875@gmail.com.",
            ],
        },
    ],
}

/** Privacy Policy per locale. */
export const PRIVACY_POLICY: Record<string, LegalDocument> = { vi, en }
