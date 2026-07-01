/**
 * Terms of Service — structured content rendered natively by {@link import("../LegalPage").LegalPage}
 * with Typography (NO markdown). Grounded in what StarCi Academy actually offers (self-paced courses +
 * challenges + AI grading + capstone projects, paid via gateways) and Vietnamese law. Provided as a
 * starting template — have a lawyer review before relying on it.
 */

import type {
    LegalDocument,
} from "./types"

/** "Last updated" date shown in the page header (ISO; display formatted by the page). */
export const TERMS_LAST_UPDATED = "2026-06-21"

const vi: LegalDocument = {
    intro: "Chào mừng bạn đến với StarCi Academy (academy.starci.org). Bằng việc tạo tài khoản hoặc sử dụng nền tảng, bạn đồng ý với các Điều khoản dịch vụ dưới đây.",
    sections: [
        {
            heading: "1. Dịch vụ",
            paragraphs: [
                "StarCi là nền tảng học lập trình tự học theo lộ trình (Fullstack, System Design, DevOps, AI/LLM), gồm nội dung bài học, thử thách (challenge), chấm điểm bằng AI và dự án capstone. Chúng tôi có thể cập nhật, thêm hoặc gỡ tính năng và nội dung theo thời gian.",
            ],
        },
        {
            heading: "2. Tài khoản",
            paragraphs: [
                "Bạn cần tài khoản để dùng phần lớn tính năng. Bạn chịu trách nhiệm cho mọi hoạt động dưới tài khoản của mình và phải giữ thông tin đăng nhập an toàn. Cung cấp thông tin chính xác khi đăng ký. Tài khoản dành cho một cá nhân — không chia sẻ.",
            ],
        },
        {
            heading: "3. Thanh toán, gói và hoàn tiền",
            items: [
                { text: "Một số khóa học và gói là trả phí. Giá có thể thay đổi theo giai đoạn (ví dụ ưu đãi tiên phong / sớm / thường) và được hiển thị trước khi bạn thanh toán." },
                { text: "Thanh toán được xử lý qua cổng bên thứ ba (PayOS, Sepay, Stripe, PayPal, NOWPayments). Việc thanh toán cũng chịu điều khoản của các cổng đó." },
                { text: "Sau khi mua, bạn được cấp quyền truy cập nội dung tương ứng. Yêu cầu hoàn tiền được xem xét theo từng trường hợp; vui lòng liên hệ chúng tôi." },
            ],
        },
        {
            heading: "4. Quyền sở hữu trí tuệ",
            items: [
                { text: "Toàn bộ nội dung khóa học, bài học, challenge và tài liệu thuộc về StarCi (hoặc bên cấp phép). Bạn được dùng cho mục đích học tập cá nhân; không sao chép, phân phối lại, bán hoặc công khai nếu không có sự cho phép." },
                { label: "Code và bài làm của bạn vẫn thuộc về bạn.", text: "Khi nộp repo để chấm, bạn cho phép chúng tôi truy cập và xử lý nó (kể cả qua dịch vụ AI) chỉ nhằm mục đích chấm điểm và phản hồi." },
            ],
        },
        {
            heading: "5. Sử dụng được phép",
            paragraphs: [
                "Bạn đồng ý không: chia sẻ tài khoản; sao chép hoặc phát tán lại nội dung trả phí; thu thập dữ liệu tự động (scrape); lạm dụng tính năng AI hoặc cố gắng vượt giới hạn; can thiệp vào hoạt động hoặc bảo mật của nền tảng; hoặc dùng dịch vụ cho mục đích trái pháp luật.",
            ],
        },
        {
            heading: "6. Chấm điểm bằng AI",
            paragraphs: [
                "Kết quả chấm và phản hồi bằng AI mang tính tham khảo và hỗ trợ học tập — chúng tôi không đảm bảo chính xác tuyệt đối và kết quả có thể thay đổi. Điểm số dùng cho mục đích học tập trên nền tảng, không phải chứng nhận chính thức.",
            ],
        },
        {
            heading: "7. Giới hạn trách nhiệm",
            paragraphs: [
                "Dịch vụ được cung cấp \"nguyên trạng\". Trong phạm vi pháp luật cho phép, StarCi không chịu trách nhiệm cho thiệt hại gián tiếp phát sinh từ việc sử dụng (hoặc không thể sử dụng) dịch vụ. Chúng tôi cố gắng duy trì hoạt động ổn định nhưng không cam kết không gián đoạn.",
            ],
        },
        {
            heading: "8. Đình chỉ và chấm dứt",
            paragraphs: [
                "Chúng tôi có thể đình chỉ hoặc chấm dứt tài khoản vi phạm các điều khoản này. Bạn có thể ngừng sử dụng và yêu cầu xóa tài khoản bất cứ lúc nào.",
            ],
        },
        {
            heading: "9. Luật áp dụng",
            paragraphs: [
                "Các điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Tranh chấp sẽ được giải quyết thông qua thương lượng thiện chí trước; nếu không đạt, theo thẩm quyền của tòa án Việt Nam.",
            ],
        },
        {
            heading: "10. Thay đổi điều khoản",
            paragraphs: [
                "Chúng tôi có thể cập nhật các điều khoản này. Thay đổi quan trọng sẽ được thông báo; tiếp tục sử dụng dịch vụ sau khi cập nhật đồng nghĩa với việc bạn chấp nhận.",
            ],
        },
        {
            heading: "11. Liên hệ",
            paragraphs: [
                "Mọi câu hỏi về điều khoản, vui lòng liên hệ: cuongnvtse160875@gmail.com.",
            ],
        },
    ],
}

const en: LegalDocument = {
    intro: "Welcome to StarCi Academy (academy.starci.org). By creating an account or using the platform, you agree to the Terms of Service below.",
    sections: [
        {
            heading: "1. The service",
            paragraphs: [
                "StarCi is a self-paced programming learning platform (Fullstack, System Design, DevOps, AI/LLM), including lesson content, challenges, AI grading, and capstone projects. We may update, add, or remove features and content over time.",
            ],
        },
        {
            heading: "2. Accounts",
            paragraphs: [
                "You need an account for most features. You are responsible for all activity under your account and must keep your credentials secure. Provide accurate information when registering. An account is for one individual — do not share it.",
            ],
        },
        {
            heading: "3. Payments, plans, and refunds",
            items: [
                { text: "Some courses and plans are paid. Prices may vary by phase (e.g. pioneer / early-bird / regular) and are shown before you pay." },
                { text: "Payments are processed by third-party gateways (PayOS, Sepay, Stripe, PayPal, NOWPayments) and are also subject to their terms." },
                { text: "After purchase, you receive access to the corresponding content. Refund requests are reviewed case by case; please contact us." },
            ],
        },
        {
            heading: "4. Intellectual property",
            items: [
                { text: "All course content, lessons, challenges, and materials belong to StarCi (or its licensors). You may use them for personal learning; do not copy, redistribute, sell, or make them public without permission." },
                { label: "Your code and work remain yours.", text: "When you submit a repo for grading, you grant us access to process it (including via AI services) solely for grading and feedback." },
            ],
        },
        {
            heading: "5. Acceptable use",
            paragraphs: [
                "You agree not to: share accounts; copy or redistribute paid content; scrape data automatically; abuse the AI features or attempt to bypass limits; interfere with the platform's operation or security; or use the service for unlawful purposes.",
            ],
        },
        {
            heading: "6. AI grading",
            paragraphs: [
                "AI grades and feedback are indicative and for learning support — we do not guarantee absolute accuracy and results may vary. Scores are for learning on the platform, not an official certification.",
            ],
        },
        {
            heading: "7. Limitation of liability",
            paragraphs: [
                "The service is provided \"as is\". To the extent permitted by law, StarCi is not liable for indirect damages arising from use of (or inability to use) the service. We strive for stable operation but do not guarantee uninterrupted availability.",
            ],
        },
        {
            heading: "8. Suspension and termination",
            paragraphs: [
                "We may suspend or terminate accounts that violate these terms. You may stop using the service and request account deletion at any time.",
            ],
        },
        {
            heading: "9. Governing law",
            paragraphs: [
                "These terms are governed by the laws of Vietnam. Disputes are first resolved through good-faith negotiation; failing that, by the competent Vietnamese courts.",
            ],
        },
        {
            heading: "10. Changes to these terms",
            paragraphs: [
                "We may update these terms. Significant changes will be announced; continued use after an update means you accept it.",
            ],
        },
        {
            heading: "11. Contact",
            paragraphs: [
                "For any question about these terms, contact: cuongnvtse160875@gmail.com.",
            ],
        },
    ],
}

/** Terms of Service per locale. */
export const TERMS_OF_SERVICE: Record<string, LegalDocument> = { vi, en }
