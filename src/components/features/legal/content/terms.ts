/**
 * Terms of Service — structured content rendered natively by {@link import("../LegalPage").LegalPage}
 * with Typography (NO markdown). Real FTES copy (Công ty TNHH Giải pháp Công nghệ Giáo dục FTES —
 * dịch vụ AI-Learning). Provided as the published terms — have a lawyer review before relying on it.
 */

import type {
    LegalDocument,
} from "./types"

/** "Last updated" date shown in the page header (ISO; display formatted by the page). */
export const TERMS_LAST_UPDATED = "2026-07-04"

const vi: LegalDocument = {
    intro: "Chào mừng bạn đến với dịch vụ AI-Learning của Công ty TNHH Giải pháp Công nghệ Giáo dục FTES (sau đây gọi tắt là FTES). Vui lòng đọc kỹ các điều khoản và điều kiện dưới đây trước khi sử dụng dịch vụ.",
    sections: [
        {
            heading: "Thông báo quan trọng",
            callout: {
                tone: "warning",
                title: "Đọc kỹ trước khi sử dụng",
                text: "Việc sử dụng dịch vụ AI-Learning của FTES đồng nghĩa với việc bạn đồng ý với tất cả các điều khoản được nêu dưới đây.",
            },
        },
        {
            heading: "Các khái niệm",
            definitions: [
                { term: "FTES", definition: "Công ty TNHH Giải pháp Công nghệ Giáo dục FTES (sau đây gọi tắt là FTES)." },
                { term: "Dịch vụ AI-Learning", definition: "bất kỳ dịch vụ nào liên quan đến các khóa học và những tính năng AI kèm theo được cung cấp bởi FTES." },
                { term: "Lộ trình học", definition: "một chuỗi các khóa học được xây dựng và sắp xếp bảo đảm theo đúng nhu cầu và điều kiện của học viên hiện tại." },
                {
                    term: "Khóa học",
                    definition: "lĩnh vực học, bao gồm toàn bộ các bài học liên quan tới lĩnh vực đề cập trong khóa học.",
                    example: "Ví dụ: Khóa học “Web design for everyone” dành cho những học viên học về thiết kế web.",
                },
                {
                    term: "Bài học",
                    definition: "đơn vị nhỏ nhất sau khóa học, thể hiện nội dung cụ thể bằng video/tài liệu/kiểm tra/thực hành… liên quan tới chủ đề của khóa học.",
                    example: "Ví dụ: Khóa học “Web design for everyone” bao gồm “Khái niệm cơ bản”, “Một số công cụ lập trình cho thiết kế web”, “Bài kiểm tra số 1”, “Thực hành cuối khóa”…",
                },
                { term: "Học viên", definition: "bất kỳ cá nhân nào sử dụng bất kỳ khía cạnh nào của trang web và/hoặc các Dịch vụ AI-Learning." },
                { term: "Chatbot", definition: "trợ lý AI 24/7 giúp hỗ trợ, giải đáp các nội dung có trong bài học hoặc trang hiện tại đang truy cập." },
            ],
        },
        {
            heading: "Dịch vụ và thông tin truyền thông của FTES",
            paragraphs: [
                "ftes.vn là trang web chính thức và duy nhất cung cấp các khóa học AI-Learning và các thông tin truyền thông khác do FTES sở hữu và quản lý. Mọi trang web khác có nội dung liên quan như trên đều không chính thức và không thuộc quyền sở hữu của FTES.",
                "Trang web ftes.vn có thể bao gồm văn bản, đồ họa, liên kết, hình ảnh, âm thanh, video, phần mềm, cùng các nội dung và dữ liệu khác (gọi chung là “nội dung, thông tin”). Các nội dung này được định dạng, tổ chức và thu thập dưới nhiều hình thức khác nhau, mà người dùng có thể đăng ký truy cập hoặc mua.",
            ],
        },
        {
            heading: "Quyền lợi và trách nhiệm của học viên",
            subsections: [
                {
                    heading: "Quyền lợi",
                    items: [
                        { text: "Được truy cập và sử dụng các khóa học AI-Learning, lộ trình học, bài học và các nội dung khác đã thực hiện thanh toán thành công theo đúng thông tin tài khoản đã đăng ký." },
                        { text: "Được tiếp cận nội dung bài học dưới nhiều hình thức (video, tài liệu, bài kiểm tra, thực hành…) theo phạm vi khóa học đã mua hoặc được cấp quyền." },
                        { text: "Được hỗ trợ bởi Chatbot 24/7 trong việc giải đáp nội dung có trong bài học hoặc trên trang đang truy cập." },
                        { text: "Được nhận các thông báo, email và hình thức truyền thông khác từ FTES về sản phẩm, dịch vụ và các ưu đãi liên quan." },
                        { text: "Được đảm bảo quyền riêng tư, bảo mật thông tin cá nhân và giải quyết khiếu nại theo chính sách bảo mật, khiếu nại của FTES." },
                    ],
                },
                {
                    heading: "Trách nhiệm",
                    items: [
                        { text: "Cung cấp thông tin đăng ký tài khoản đầy đủ, chính xác và luôn cập nhật; đồng thời chịu trách nhiệm về tính xác thực của những thông tin đã cung cấp." },
                        { text: "Tuân thủ đầy đủ các điều khoản, quy định và hướng dẫn sử dụng dịch vụ AI-Learning của FTES." },
                        { text: "Sử dụng duy nhất email đã đăng ký trong toàn bộ quá trình học; chỉ thay đổi email khi có sự chấp thuận đặc biệt từ FTES." },
                        { text: "Thực hiện thanh toán đầy đủ chi phí khóa học theo mức giá và phương thức được công bố; đồng thời chịu các khoản phí phát sinh trong quá trình thanh toán (nếu có)." },
                        { text: "Bảo mật thông tin cá nhân và không sử dụng nội dung khóa học vào các mục đích vi phạm bản quyền hoặc gây ảnh hưởng đến uy tín của FTES." },
                    ],
                },
            ],
        },
        {
            heading: "Quy định về tài khoản và bảo mật thông tin",
            paragraphs: [
                "Để sử dụng dịch vụ AI-Learning của FTES, mỗi học viên phải đăng ký một tài khoản để có thể truy cập và sử dụng. Khi đăng ký tài khoản, học viên cam kết đã tuân thủ quy định, điều khoản của FTES, đồng thời tất cả các thông tin cung cấp cho FTES là đúng, chính xác, đầy đủ tại thời điểm được yêu cầu.",
            ],
            callout: {
                tone: "warning",
                title: "Lưu ý quan trọng",
                text: "Mọi quyền lợi và nghĩa vụ của bạn sẽ căn cứ trên thông tin tài khoản bạn đã đăng ký; do đó nếu có bất kỳ thông tin sai lệch nào, FTES sẽ không chịu trách nhiệm trong trường hợp thông tin đó làm ảnh hưởng hoặc hạn chế quyền lợi của học viên.",
            },
            subsections: [
                {
                    heading: "Tài khoản và truyền thông",
                    paragraphs: [
                        "Mỗi học viên sở hữu một tài khoản bao gồm tên đăng nhập, mật khẩu hoặc tài khoản Google, có giá trị và hiệu lực kể từ thời điểm học viên đăng ký lần đầu tiên.",
                        "Sau khi đăng ký, học viên đồng ý nhận thông báo, email hoặc các hình thức truyền thông khác về sản phẩm và dịch vụ của FTES. Nếu không muốn tiếp tục nhận email, bạn có thể sử dụng chức năng “hủy đăng ký” ở cuối mỗi email của FTES.",
                    ],
                },
                {
                    heading: "Về việc thay đổi thông tin đã đăng ký",
                    items: [
                        { text: "Email đã đăng ký sẽ không được thay đổi trong suốt quá trình học." },
                        { text: "Trường hợp học viên cá nhân được mời vào tài khoản doanh nghiệp, khách hàng phải sử dụng email có domain của công ty hoặc email cá nhân." },
                        { text: "Nếu nghỉ việc và đang sử dụng email công ty, khách hàng cần đổi sang email cá nhân để duy trì tài khoản. Tuy nhiên, các bài học trước đó do công ty mua sẽ không thể tiếp tục truy cập." },
                    ],
                },
            ],
        },
        {
            heading: "Mức giá và phương thức thanh toán",
            paragraphs: [
                "Mức giá của từng khóa học công bố trên trang web đã bao gồm VAT, có thể thay đổi tùy theo chính sách giá của FTES và được cập nhật trên trang web.",
            ],
            cards: [
                { icon: "qr", label: "Thanh toán QR", text: "Mã QR thanh toán trên website." },
                { icon: "bank", label: "Smart Banking", text: "App ngân hàng điện tử." },
                { icon: "wallet", label: "Ví điện tử", text: "Momo, Viettel Pay…" },
            ],
            subsections: [
                {
                    heading: "Lưu ý về thanh toán",
                    items: [
                        { text: "Học viên phải chịu phí thanh toán (nếu có)." },
                        { text: "Học viên được yêu cầu đọc kỹ và hiểu các Điều khoản và quy định trước khi thanh toán." },
                        { text: "Trường hợp học viên gửi thanh toán nhưng không thành công, bạn cần chụp minh chứng giao dịch và gửi về cho FTES. Sau khi kiểm tra và xác nhận trên hệ thống, nếu đúng, FTES sẽ hoàn tiền hoặc hỗ trợ mua khóa học theo nguyện vọng của bạn." },
                    ],
                },
            ],
        },
        {
            heading: "Miễn trừ trách nhiệm",
            items: [
                { text: "FTES không tuyên bố hoặc bảo đảm rằng dịch vụ AI-Learning sẽ không bị lỗi, gián đoạn, hoặc rằng mọi lỗi sẽ được khắc phục." },
                { text: "FTES không cam kết rằng mọi thông tin, hướng dẫn hoặc nội dung được cung cấp trong dịch vụ là chính xác, đầy đủ hoặc hữu ích trong thời điểm học hiện tại của bạn." },
                { text: "Bằng việc truy cập hoặc sử dụng dịch vụ, học viên tuyên bố và bảo đảm rằng hoạt động của mình là hợp pháp tại mọi khu vực pháp lý liên quan." },
                { text: "Một số khu vực pháp lý có thể giới hạn hoặc không cho phép áp dụng toàn bộ các tuyên bố miễn trừ trách nhiệm nêu trên. Trong những trường hợp này, việc miễn trừ trách nhiệm của FTES sẽ được điều chỉnh theo phạm vi mà pháp luật của khu vực pháp lý đó cho phép." },
            ],
        },
        {
            heading: "Quy định giải quyết khiếu nại",
            items: [
                { text: "FTES ưu tiên giải quyết mọi tranh chấp, khiếu nại hoặc bất đồng giữa học viên và FTES thông qua thương lượng, hòa giải trên tinh thần hợp tác và tôn trọng quyền lợi đôi bên." },
                { text: "Học viên gửi khiếu nại qua các kênh hỗ trợ chính thức của FTES trong thời hạn 07 ngày làm việc kể từ khi phát sinh sự việc." },
                { text: "Khi gửi khiếu nại, học viên cần cung cấp đầy đủ: thông tin cá nhân (họ tên, email đăng ký tài khoản, số điện thoại liên hệ); mô tả chi tiết sự việc; tài liệu, chứng cứ liên quan (hóa đơn thanh toán, ảnh chụp màn hình, video, email trao đổi…)." },
                { text: "Bộ phận chuyên trách sẽ tiến hành kiểm tra thông tin, xác minh sự việc và yêu cầu học viên bổ sung thông tin (nếu cần)." },
            ],
        },
        {
            heading: "Hiệu lực",
            paragraphs: [
                "Các điều khoản và điều kiện này có hiệu lực kể từ ngày được công bố trên trang web chính thức của FTES và thay thế cho tất cả các phiên bản, thỏa thuận hoặc cam kết trước đó (nếu có) liên quan đến cùng nội dung.",
                "FTES có quyền sửa đổi, bổ sung hoặc cập nhật các điều khoản và điều kiện này bất kỳ lúc nào để phù hợp với chính sách hoạt động hoặc yêu cầu pháp luật, và phải thông báo trên các trang thông tin chính thức để học viên được nắm.",
                "Học viên có trách nhiệm thường xuyên kiểm tra các cập nhật; việc tiếp tục sử dụng dịch vụ sau khi điều khoản được cập nhật đồng nghĩa với việc học viên chấp nhận các thay đổi đó.",
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
                "Nếu bạn có câu hỏi về Điều khoản Dịch vụ AI-Learning FTES, vui lòng truy cập vào mục liên hệ để được giải đáp nhanh nhất.",
            ],
        },
    ],
}

const en: LegalDocument = {
    intro: "Welcome to the AI-Learning service of FTES Education Technology Solutions Co., Ltd (hereinafter “FTES”). Please read the terms and conditions below carefully before using the service.",
    sections: [
        {
            heading: "Important notice",
            callout: {
                tone: "warning",
                title: "Read before using",
                text: "Using the FTES AI-Learning service means you agree to all of the terms set out below.",
            },
        },
        {
            heading: "Definitions",
            definitions: [
                { term: "FTES", definition: "FTES Education Technology Solutions Co., Ltd (hereinafter “FTES”)." },
                { term: "AI-Learning service", definition: "any service related to the courses and the accompanying AI features provided by FTES." },
                { term: "Learning path", definition: "a sequence of courses built and arranged to match a learner's current needs and conditions." },
                {
                    term: "Course",
                    definition: "a field of study, including all lessons related to the field the course covers.",
                    example: "Example: the course “Web design for everyone” is for learners studying web design.",
                },
                {
                    term: "Lesson",
                    definition: "the smallest unit within a course, presenting specific content via video/materials/quiz/practice… related to the course topic.",
                    example: "Example: “Web design for everyone” includes “Basic concepts”, “Some programming tools for web design”, “Quiz 1”, “Final practice”…",
                },
                { term: "Learner", definition: "any individual who uses any aspect of the website and/or the AI-Learning services." },
                { term: "Chatbot", definition: "a 24/7 AI assistant that helps answer content within a lesson or the page you are currently on." },
            ],
        },
        {
            heading: "FTES services and communication channels",
            paragraphs: [
                "ftes.vn is the official and sole website providing AI-Learning courses and other communications owned and managed by FTES. Any other website with similar content is unofficial and not owned by FTES.",
                "The ftes.vn website may include text, graphics, links, images, audio, video, software, and other content and data (collectively “content, information”). This content is formatted, organized, and collected in various forms that users may register to access or purchase.",
            ],
        },
        {
            heading: "Learner rights and responsibilities",
            subsections: [
                {
                    heading: "Rights",
                    items: [
                        { text: "Access and use AI-Learning courses, learning paths, lessons, and other content that has been successfully paid for, under the registered account information." },
                        { text: "Access lesson content in various forms (video, materials, quizzes, practice…) within the scope of the purchased or granted course." },
                        { text: "Receive 24/7 Chatbot support to answer content within a lesson or the page being accessed." },
                        { text: "Receive notifications, emails, and other communications from FTES about products, services, and related offers." },
                        { text: "Be assured of privacy, personal-data security, and complaint resolution under the FTES privacy and complaints policies." },
                    ],
                },
                {
                    heading: "Responsibilities",
                    items: [
                        { text: "Provide complete, accurate, and up-to-date account registration information, and be responsible for the authenticity of the information provided." },
                        { text: "Fully comply with the terms, regulations, and usage guidelines of the FTES AI-Learning service." },
                        { text: "Use only the registered email throughout the learning process; change the email only with special approval from FTES." },
                        { text: "Pay course fees in full at the published prices and methods, and bear any fees arising during payment (if any)." },
                        { text: "Keep personal information secure and not use course content for copyright-infringing purposes or in ways that harm FTES's reputation." },
                    ],
                },
            ],
        },
        {
            heading: "Account and information security",
            paragraphs: [
                "To use the FTES AI-Learning service, each learner must register an account to access and use it. When registering, the learner commits to complying with FTES's regulations and terms, and that all information provided to FTES is true, accurate, and complete at the time requested.",
            ],
            callout: {
                tone: "warning",
                title: "Important note",
                text: "All of your rights and obligations are based on your registered account information; therefore, if any information is inaccurate, FTES is not responsible where that information affects or limits the learner's rights.",
            },
            subsections: [
                {
                    heading: "Account and communications",
                    paragraphs: [
                        "Each learner owns one account consisting of a username and password, or a Google account, valid and effective from the time the learner first registers.",
                        "After registering, the learner agrees to receive notifications, emails, or other communications about FTES products and services. If you no longer wish to receive emails, you can use the “unsubscribe” function at the bottom of each FTES email.",
                    ],
                },
                {
                    heading: "Changing registered information",
                    items: [
                        { text: "The registered email cannot be changed throughout the learning process." },
                        { text: "If an individual learner is invited into a business account, the customer must use an email with the company domain or a personal email." },
                        { text: "If leaving the job while using a company email, the customer must switch to a personal email to keep the account. However, lessons previously purchased by the company will no longer be accessible." },
                    ],
                },
            ],
        },
        {
            heading: "Pricing and payment methods",
            paragraphs: [
                "The price of each course published on the website is VAT-inclusive, may change according to FTES's pricing policy, and is updated on the website.",
            ],
            cards: [
                { icon: "qr", label: "QR payment", text: "Payment QR code on the website." },
                { icon: "bank", label: "Smart Banking", text: "Electronic banking app." },
                { icon: "wallet", label: "E-wallet", text: "Momo, Viettel Pay…" },
            ],
            subsections: [
                {
                    heading: "Payment notes",
                    items: [
                        { text: "Learners bear the payment fee (if any)." },
                        { text: "Learners are required to read and understand the Terms and regulations carefully before paying." },
                        { text: "If a payment is sent but fails, capture proof of the transaction and send it to FTES. After checking and confirming on the system, if correct, FTES will refund or help purchase the course as you wish." },
                    ],
                },
            ],
        },
        {
            heading: "Disclaimer",
            items: [
                { text: "FTES does not state or guarantee that the AI-Learning service will be error-free, uninterrupted, or that every error will be fixed." },
                { text: "FTES does not guarantee that all information, guidance, or content provided in the service is accurate, complete, or useful at your current point of study." },
                { text: "By accessing or using the service, the learner represents and warrants that their activity is lawful in every relevant jurisdiction." },
                { text: "Some jurisdictions may limit or not allow the application of all of the above disclaimers. In such cases, FTES's disclaimer applies to the extent permitted by the law of that jurisdiction." },
            ],
        },
        {
            heading: "Complaint resolution",
            items: [
                { text: "FTES prioritizes resolving all disputes, complaints, or disagreements between learners and FTES through negotiation and mediation, in a spirit of cooperation and mutual respect." },
                { text: "Learners submit complaints through FTES's official support channels within 07 working days from when the matter arises." },
                { text: "When submitting a complaint, learners must provide: personal information (full name, registered account email, contact phone number); a detailed description of the matter; and related documents/evidence (payment invoices, screenshots, video, email exchanges…)." },
                { text: "The dedicated team will check the information, verify the matter, and ask the learner for additional information (if needed)." },
            ],
        },
        {
            heading: "Effect",
            paragraphs: [
                "These terms and conditions take effect from the date they are published on FTES's official website and replace all previous versions, agreements, or commitments (if any) relating to the same content.",
                "FTES has the right to amend, supplement, or update these terms and conditions at any time to suit its operating policy or legal requirements, and must announce this on its official information channels for learners to be aware of.",
                "Learners are responsible for regularly checking for updates; continuing to use the service after the terms are updated means the learner accepts those changes.",
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
                "If you have questions about the FTES AI-Learning Terms of Service, please visit the contact section for the fastest response.",
            ],
        },
    ],
}

/** Terms of Service per locale. */
export const TERMS_OF_SERVICE: Record<string, LegalDocument> = { vi, en }
